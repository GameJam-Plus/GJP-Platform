const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = mongoose.Schema({
    // General information
    jamId: {
        type: Schema.Types.ObjectId,
        ref: 'Jam',
        required: true
    },
    siteId: {
        type: Schema.Types.ObjectId,
        ref: 'Site',
        required: true
    },
    teamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },

    // Gamejam form
    gamejamJammerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gamejamTitle: { type: String, required: true },
    gamejamBuild: { type: String, required: true },
    gamejamContact: {
        _id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true }
    },
    gamejamDescription: { type: String, required: true },
    gamejamGenres: [{ type: String, required: true }],
    gamejamTopics: [{ type: String, required: true }],
    gamejamThemes: [{ type: String, required: true }],
    gamejamCategories: [{ type: String, required: true }],
    gamejamPlatforms: [{ type: String, required: true }],
    gamejamGraphics: { type: String, required: true },
    gamejamEngine: { type: String, required: true },
    goingToIncubation: { type: Boolean, required: false },
    gamejamRecommendation: { type: Number, required: true },
    gamejamEnjoyment: { type: Number, required: true },
    gamejamSuggestions: { type: String, required: false },
    gamejamAuthorization: { type: Boolean, required: true },
    gamejamSubmissionTime: { type: Date, required: true },
    gamejamSubmissionDelta: { type: Number, required: true },

    // Gamejam pitch form
    gamejamPitchJammerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    gamejamPitch: { type: String, required: false },
    gamejamPitchTime: { type: Date, required: false },
    gamejamPitchDelta: { type: Number, required: false },

    // Incubation form
    incubationJammerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    incubationTitle: { type: String, required: false },
    incubationBuild: { type: String, required: false },
    incubationContact: {
        _id: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        name: { type: String, required: false },
        email: { type: String, required: false }
    },
    incubationDescription: { type: String, required: false },
    incubationGenres: [{ type: String, required: false }],
    incubationTopics: [{ type: String, required: false }],
    incubationThemes: [{ type: String, required: false }],
    incubationCategories: [{ type: String, required: false }],
    incubationPlatforms: [{ type: String, required: false }],
    incubationGraphics: { type: String, required: false },
    incubationEngine: { type: String, required: false },
    goingToAcceleration: { type: Boolean, required: false },
    incubationRecommendation: { type: Number, required: false },
    incubationEnjoyment: { type: Number, required: false },
    incubationSuggestions: { type: String, required: false },
    incubationAuthorization: { type: Boolean, required: false },
    incubationSubmissionTime: { type: Date, required: false },
    incubationSubmissionDelta: { type: Number, required: false },

    // Incubation pitch form
    incubationPitchJammerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    incubationPitch: { type: String, required: false },
    incubationPitchTime: { type: Date, required: false },
    incubationPitchDelta: { type: Number, required: false },

    // Acceleration form
    acclerationJammerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    accelerationTitle: { type: String, required: false },
    accelerationBuild: { type: String, required: false },
    accelerationContact: {
        _id: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        name: { type: String, required: false },
        email: { type: String, required: false }
    },
    accelerationDescription: { type: String, required: false },
    accelerationGenres: [{ type: String, required: false }],
    accelerationTopics: [{ type: String, required: false }],
    accelerationThemes: [{ type: String, required: false }],
    accelerationCategories: [{ type: String, required: false }],
    accelerationPlatforms: [{ type: String, required: false }],
    accelerationGraphics: { type: String, required: false },
    accelerationEngine: { type: String, required: false },
    accelerationRecommendation: { type: Number, required: false },
    accelerationEnjoyment: { type: Number, required: false },
    accelerationSuggestions: { type: String, required: false },
    accelerationAuthorization: { type: Boolean, required: false },
    accelerationSubmissionTime: { type: Date, required: false },
    accelerationSubmissionDelta: { type: Number, required: false },

    // Acceleration pitch form
    accelerationPitchJammerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    accelerationPitch: { type: String, required: false },
    accelerationPitchTime: { type: Date, required: false },
    accelerationPitchDelta: { type: Number, required: false },

    // Deprecated/legacy fields (to be removed later)
    accelerationGameplayVideo: { type: String, required: false },
    accelerationSoundtrack: { type: String, required: false }
});

module.exports = mongoose.model("Submission", submissionSchema);