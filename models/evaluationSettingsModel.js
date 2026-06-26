const mongoose = require('mongoose');
const { Schema } = mongoose;

// Single platform-level config document (one doc, key 'GLOBAL'). Editable by
// GlobalOrganizers; read by both judge- and organizer-facing evaluation flows.
const evaluationSettingsSchema = mongoose.Schema({
    // Singleton guard — only ever one document with key 'GLOBAL'.
    key: {
        type: String,
        default: 'GLOBAL',
        unique: true,
        immutable: true
    },

    // Per-evaluation countdown in milliseconds (expiresAt = startedAt + timeLimit).
    timeLimit: {
        type: Number,
        required: true,
        default: 60 * 60 * 1000
    },

    // N — max evaluations a single submission may receive, PER STAGE. Always
    // checked live with countDocuments, never stored on the submission.
    maxPerSubmission: {
        type: Number,
        required: true,
        default: 3
    },

    // Global cap on total live evaluations (STARTED + COMPLETED) platform-wide.
    globalEvaluationCap: {
        type: Number,
        required: true,
        default: 100000
    },

    // Max evaluations one judge may hold/own. 0 / null = unlimited.
    perJudgeCap: {
        type: Number,
        default: null
    },

    // Required numeric categories per stage — this is where stages differ. The
    // Evaluation schema carries the full set; only these must be filled to
    // COMPLETE a given stage.
    mandatoryCategories: {
        INCUBATION: {
            type: [String],
            default: ['gameDesign', 'narrative', 'art', 'audio']
        },
        ACCELERATION: {
            type: [String],
            default: ['gameDesign', 'art', 'audio', 'buildInnovation']
        },
        GLOBAL_FINAL: {
            type: [String],
            default: ['pitchVisuals', 'oratory', 'storytelling', 'businessPlan', 'pitchInnovation']
        }
    },

    lastUpdateUser: {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        name: {
            type: String
        },
        email: {
            type: String
        }
    },
    lastUpdateDate: {
        type: Date
    }
});

// Returns the one settings doc, creating it with defaults on first access so
// the judge flow never 404s on a fresh database.
evaluationSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ key: 'GLOBAL' });
    if (!settings) {
        settings = await this.create({ key: 'GLOBAL' });
    }
    return settings;
};

module.exports = mongoose.model("EvaluationSettings", evaluationSettingsSchema);
