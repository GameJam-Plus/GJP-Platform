const mongoose = require('mongoose');
const { Schema } = mongoose;

const evaluationSchema = mongoose.Schema({
    submission: {
        type: Schema.Types.ObjectId,
        ref: 'Submission',
        required: true
    },
    judge: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stage: {
        type: String,
        enum: ['INCUBATION', 'ACCELERATION', 'GLOBAL_FINAL'],
        required: true
    },
    status: {
        type: String,
        enum: ['STARTED', 'COMPLETED'],
        default: 'STARTED',
        required: true
    },
    startedAt: {
        type: Date,
        required: true
    },
    completedAt: {
        type: Date
    },
    // startedAt + EvaluationSettings.timeLimit; the countdown source of truth.
    expiresAt: {
        type: Date,
        required: true
    },

    // Numeric rubric. Each category supports an explicit N/A state:
    //   not scored -> value null, na false
    //   scored     -> value Number, na false
    //   N/A        -> value null, na true
    scores: {
        art: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        audio: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        gameDesign: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        narrative: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        buildInnovation: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        pitchVisuals: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        oratory: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        storytelling: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        businessPlan: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        },
        pitchInnovation: {
            value: { type: Number, default: null },
            na: { type: Boolean, default: false }
        }
    },

    buildFeedback: {
        type: String
    },
    pitchFeedback: {
        type: String
    }
});

// A judge may not hold two evaluations of the same submission + stage.
evaluationSchema.index({ judge: 1, submission: 1, stage: 1 }, { unique: true });

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

module.exports = Evaluation;
