const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/evaluationModel');
const EvaluationSettings = require('../models/evaluationSettingsModel');
const Submission = require('../models/submissionModel');
const User = require('../models/userModel');

const { JamStage, EvaluationStatus, SCORE_CATEGORIES } = Evaluation;
// Same hardcoded secret the rest of the controllers use. (Flagged in CLAUDE.md
// as something to move to an env var — kept identical here for consistency.)
const JWT_SECRET = 'MY_JWT_SECRET';

// ---------------------------------------------------------------------------
// Inline guards. This repo has no central auth middleware — every controller
// reads req.cookies.token, verifies it, loads the user, and checks roles. We
// follow that convention rather than introducing Express middleware, so the
// route file's [auth, judge, owner] annotations are enforced here.
// ---------------------------------------------------------------------------

// Returns the authenticated user, or sends the proper error response and
// returns null. `role` (optional) is a PascalCase role string to require.
const authUser = async (req, res, role) => {
    const userId = req.cookies.token
        ? jwt.verify(req.cookies.token, JWT_SECRET).userId
        : null;
    if (!userId) {
        res.status(401).json({ success: false, msg: 'Unauthorized' });
        return null;
    }
    const user = await User.findById(userId);
    if (!user) {
        res.status(404).json({ success: false, msg: 'User not found' });
        return null;
    }
    if (role && !(user.roles || []).includes(role)) {
        res.status(403).json({ success: false, msg: `Requires ${role} role` });
        return null;
    }
    return user;
};

// Live count of evaluations occupying a slot for a submission+stage.
const slotUsage = (submissionId, stage) =>
    Evaluation.countDocuments({
        submission: submissionId,
        stage,
        status: { $in: [EvaluationStatus.STARTED, EvaluationStatus.COMPLETED] }
    });

// ---------------------------------------------------------------------------
// expireStaleEvaluations — internal. Deletes STARTED evals past expiresAt,
// freeing their submission slots. Called by the cron sweep (~1 min) and lazily
// at the top of startEvaluation. Returns the deleted docs so the cron can log /
// drive live updates.
//
// Live update to logged-in judges is via POLLING: the judge page already polls
// GET /api/evaluations/timer and /mine, so a deleted STARTED eval surfaces on
// the next poll (timer returns null). No websocket layer exists in this repo;
// switch to one here if sub-minute latency is needed.
// ---------------------------------------------------------------------------
const expireStaleEvaluations = async () => {
    const now = new Date();
    const stale = await Evaluation.find({
        status: EvaluationStatus.STARTED,
        expiresAt: { $lt: now }
    });
    if (stale.length > 0) {
        await Evaluation.deleteMany({ _id: { $in: stale.map(e => e._id) } });
    }
    return stale;
};

// GET /api/evaluations/timer — the judge's active STARTED eval + remaining ms.
const getActiveTimer = async (req, res) => {
    try {
        const user = await authUser(req, res, 'Judge');
        if (!user) return;

        // Clear the judge's own stale evals first so an expired one never
        // reports as active.
        await Evaluation.deleteMany({
            judge: user._id,
            status: EvaluationStatus.STARTED,
            expiresAt: { $lt: new Date() }
        });

        const active = await Evaluation.findOne({
            judge: user._id,
            status: EvaluationStatus.STARTED
        });

        if (!active) {
            return res.status(200).send({ success: true, msg: 'No active evaluation', data: null });
        }

        const remainingMs = Math.max(0, active.expiresAt.getTime() - Date.now());
        res.status(200).send({
            success: true,
            msg: 'Active evaluation found',
            data: { evaluation: active, remainingMs }
        });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// POST /api/evaluations/start — pick an eligible submission for the requested
// stage and create a STARTED evaluation.
const startEvaluation = async (req, res) => {
    try {
        const user = await authUser(req, res, 'Judge');
        if (!user) return;

        const { stage } = req.body;
        if (!Object.values(JamStage).includes(stage)) {
            return res.status(400).json({ success: false, msg: 'Invalid or missing stage' });
        }

        // Lazy expiry of THIS judge's stale evals (frees slots they abandoned).
        await Evaluation.deleteMany({
            judge: user._id,
            status: EvaluationStatus.STARTED,
            expiresAt: { $lt: new Date() }
        });

        // A judge may only hold one STARTED evaluation at a time.
        const existingActive = await Evaluation.findOne({
            judge: user._id,
            status: EvaluationStatus.STARTED
        });
        if (existingActive) {
            return res.status(409).json({
                success: false,
                msg: 'You already have an evaluation in progress',
                data: existingActive
            });
        }

        const settings = await EvaluationSettings.getSettings();

        // Global cap (live count of all STARTED + COMPLETED).
        const globalCount = await Evaluation.countDocuments({
            status: { $in: [EvaluationStatus.STARTED, EvaluationStatus.COMPLETED] }
        });
        if (globalCount >= settings.globalEvaluationCap) {
            return res.status(409).json({ success: false, msg: 'Global evaluation cap reached' });
        }

        // Optional per-judge cap (STARTED + COMPLETED owned by this judge).
        if (settings.perJudgeCap) {
            const judgeCount = await Evaluation.countDocuments({
                judge: user._id,
                status: { $in: [EvaluationStatus.STARTED, EvaluationStatus.COMPLETED] }
            });
            if (judgeCount >= settings.perJudgeCap) {
                return res.status(409).json({ success: false, msg: 'Your evaluation cap is reached' });
            }
        }

        // Candidate pool for this stage.
        // NOTE: Submission has no JamStage enum field, so the pool is "all
        // submissions" here. If a submission only belongs to certain stages,
        // narrow this query with the real domain rule (e.g. goingTo /
        // goingToAcceleration flags). Flagged for confirmation.
        const candidates = await Submission.find({}, { _id: 1 }).lean();

        // Submissions this judge already evaluated for this stage (excluded).
        const alreadyByJudge = await Evaluation.find(
            { judge: user._id, stage },
            { submission: 1 }
        ).lean();
        const excluded = new Set(alreadyByJudge.map(e => e.submission.toString()));

        // Score each eligible candidate by current slot usage; pick from the
        // least-evaluated (load balancing, mirroring the legacy minCount logic),
        // random tiebreak.
        let best = [];
        let bestUsage = Infinity;
        for (const c of candidates) {
            const id = c._id.toString();
            if (excluded.has(id)) continue;
            const usage = await slotUsage(c._id, stage);
            if (usage >= settings.maxPerSubmission) continue; // no free slot
            if (usage < bestUsage) {
                bestUsage = usage;
                best = [c._id];
            } else if (usage === bestUsage) {
                best.push(c._id);
            }
        }

        if (best.length === 0) {
            return res.status(404).json({
                success: false,
                msg: 'No submission available to evaluate for this stage'
            });
        }

        const chosen = best[Math.floor(Math.random() * best.length)];

        const startedAt = new Date();
        const expiresAt = new Date(startedAt.getTime() + settings.timeLimit);

        let evaluation;
        try {
            evaluation = await Evaluation.create({
                submission: chosen,
                judge: user._id,
                stage,
                status: EvaluationStatus.STARTED,
                startedAt,
                expiresAt
            });
        } catch (err) {
            // Unique index { judge, submission, stage } lost a race — treat as
            // "try again" rather than a 500.
            if (err.code === 11000) {
                return res.status(409).json({ success: false, msg: 'Evaluation already exists, retry' });
            }
            throw err;
        }

        res.status(201).send({
            success: true,
            msg: 'Evaluation started',
            data: { evaluation, remainingMs: settings.timeLimit }
        });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// Loads a STARTED evaluation owned by the requesting judge, or sends an error
// and returns null. Enforces the route's [owner] annotation.
const loadOwnedStarted = async (req, res, user) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, msg: 'Invalid evaluation id' });
        return null;
    }
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
        res.status(404).json({ success: false, msg: 'Evaluation not found' });
        return null;
    }
    if (evaluation.judge.toString() !== user._id.toString()) {
        res.status(403).json({ success: false, msg: 'Not your evaluation' });
        return null;
    }
    if (evaluation.status !== EvaluationStatus.STARTED) {
        res.status(409).json({ success: false, msg: 'Evaluation is not in progress' });
        return null;
    }
    return evaluation;
};

// PATCH /api/evaluations/:id/score — write one category value (or N/A) or a
// feedback string on a STARTED eval the judge owns.
// Body: { category, value, na } for numeric, or { buildFeedback } / { pitchFeedback }.
const saveScore = async (req, res) => {
    try {
        const user = await authUser(req, res, 'Judge');
        if (!user) return;

        const evaluation = await loadOwnedStarted(req, res, user);
        if (!evaluation) return;

        const { category, value, na, buildFeedback, pitchFeedback } = req.body;

        if (buildFeedback !== undefined) evaluation.buildFeedback = buildFeedback;
        if (pitchFeedback !== undefined) evaluation.pitchFeedback = pitchFeedback;

        if (category !== undefined) {
            if (!SCORE_CATEGORIES.includes(category)) {
                return res.status(400).json({ success: false, msg: `Unknown category '${category}'` });
            }
            if (na === true) {
                evaluation.scores[category] = { value: null, na: true };
            } else {
                const num = Number(value);
                if (Number.isNaN(num)) {
                    return res.status(400).json({ success: false, msg: 'value must be a number (or set na:true)' });
                }
                evaluation.scores[category] = { value: num, na: false };
            }
            evaluation.markModified('scores');
        }

        await evaluation.save();
        res.status(200).send({ success: true, msg: 'Score saved', data: evaluation });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// PATCH /api/evaluations/:id/submit — validate mandatory categories, flip
// STARTED -> COMPLETED, stamp completedAt.
const submitEvaluation = async (req, res) => {
    try {
        const user = await authUser(req, res, 'Judge');
        if (!user) return;

        const evaluation = await loadOwnedStarted(req, res, user);
        if (!evaluation) return;

        const settings = await EvaluationSettings.getSettings();
        const mandatory = (settings.mandatoryCategories &&
            settings.mandatoryCategories[evaluation.stage]) || [];

        const missing = mandatory.filter(cat => {
            const s = evaluation.scores[cat];
            // Satisfied when N/A OR has a numeric value.
            return !s || (!s.na && (s.value === null || s.value === undefined));
        });
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                msg: 'Missing mandatory categories',
                data: { missing }
            });
        }

        evaluation.status = EvaluationStatus.COMPLETED;
        evaluation.completedAt = new Date();
        await evaluation.save();

        res.status(200).send({ success: true, msg: 'Evaluation submitted', data: evaluation });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// GET /api/evaluations/mine — the current judge's evaluations (with status).
const getMyEvaluations = async (req, res) => {
    try {
        const user = await authUser(req, res, 'Judge');
        if (!user) return;

        const evaluations = await Evaluation.find({ judge: user._id })
            .populate('submission', 'gamejamTitle teamId')
            .sort({ startedAt: -1 });

        res.status(200).send({ success: true, msg: 'Evaluations found', data: evaluations });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// GET /api/evaluations/completed — organizer view of COMPLETED evaluations.
// Filters: ?stage= ?judge= ?submission=
// ?groupBy=judge,stage -> aggregated count of completed per judge per stage
// (this is the global-organizer overview table; no separate endpoint exists).
const getCompletedEvaluations = async (req, res) => {
    try {
        const user = await authUser(req, res, 'GlobalOrganizer');
        if (!user) return;

        const { stage, judge, submission, groupBy } = req.query;

        const match = { status: EvaluationStatus.COMPLETED };
        if (stage) match.stage = stage;
        if (judge && mongoose.Types.ObjectId.isValid(judge)) match.judge = new mongoose.Types.ObjectId(judge);
        if (submission && mongoose.Types.ObjectId.isValid(submission)) match.submission = new mongoose.Types.ObjectId(submission);

        if (groupBy === 'judge,stage') {
            const table = await Evaluation.aggregate([
                { $match: match },
                { $group: { _id: { judge: '$judge', stage: '$stage' }, count: { $sum: 1 } } },
                { $lookup: { from: 'users', localField: '_id.judge', foreignField: '_id', as: 'judge' } },
                { $unwind: { path: '$judge', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        judgeId: '$_id.judge',
                        judgeName: '$judge.name',
                        judgeEmail: '$judge.email',
                        stage: '$_id.stage',
                        count: 1
                    }
                },
                { $sort: { judgeName: 1, stage: 1 } }
            ]);
            return res.status(200).send({ success: true, msg: 'Completed evaluations (grouped)', data: table });
        }

        const evaluations = await Evaluation.find(match)
            .populate('judge', 'name email')
            .populate('submission', 'gamejamTitle teamId')
            .sort({ completedAt: -1 });

        res.status(200).send({ success: true, msg: 'Completed evaluations', data: evaluations });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// GET /api/evaluations/started — organizer monitoring of all in-progress evals.
const getStartedEvaluations = async (req, res) => {
    try {
        const user = await authUser(req, res, 'GlobalOrganizer');
        if (!user) return;

        const evaluations = await Evaluation.find({ status: EvaluationStatus.STARTED })
            .populate('judge', 'name email')
            .populate('submission', 'gamejamTitle teamId')
            .sort({ startedAt: -1 });

        res.status(200).send({ success: true, msg: 'Started evaluations', data: evaluations });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// GET /api/evaluations/settings — read config (judge + organizer flows).
// (Not in the original 7-route list, but the settings doc must be readable to
// drive the judge timer and organizer admin screen.)
const getSettings = async (req, res) => {
    try {
        const user = await authUser(req, res);
        if (!user) return;
        const settings = await EvaluationSettings.getSettings();
        res.status(200).send({ success: true, msg: 'Settings', data: settings });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

// PUT /api/evaluations/settings — GlobalOrganizer-only config update.
const updateSettings = async (req, res) => {
    try {
        const user = await authUser(req, res, 'GlobalOrganizer');
        if (!user) return;

        const settings = await EvaluationSettings.getSettings();
        const { timeLimit, maxPerSubmission, globalEvaluationCap, perJudgeCap, mandatoryCategories } = req.body;

        if (timeLimit !== undefined) settings.timeLimit = Number(timeLimit);
        if (maxPerSubmission !== undefined) settings.maxPerSubmission = Number(maxPerSubmission);
        if (globalEvaluationCap !== undefined) settings.globalEvaluationCap = Number(globalEvaluationCap);
        if (perJudgeCap !== undefined) settings.perJudgeCap = perJudgeCap === null ? null : Number(perJudgeCap);
        if (mandatoryCategories !== undefined) {
            settings.mandatoryCategories = mandatoryCategories;
            settings.markModified('mandatoryCategories');
        }

        settings.lastUpdateUser = { userId: user._id, name: user.name, email: user.email };
        settings.lastUpdateDate = new Date();
        await settings.save();

        res.status(200).send({ success: true, msg: 'Settings updated', data: settings });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
};

module.exports = {
    getActiveTimer,
    startEvaluation,
    saveScore,
    submitEvaluation,
    getMyEvaluations,
    getCompletedEvaluations,
    getStartedEvaluations,
    getSettings,
    updateSettings,
    expireStaleEvaluations // internal: used by the cron sweep in index.js
};
