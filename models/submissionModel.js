const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = mongoose.Schema({
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
    title:{
        type:String,
        required:true
    },
    contact:{
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    link: {
        type: String,
        required: true
    },
    description:{
        type:String,
        required:true
    },
    pitch: {
        type:String
    },
    themes: [{
        type: String,
        required: true
    }],
    categories: [{
        type: String,
        required: true
    }],
    topics: [{
        type: String,
        required: true
    }],
    genres: [{
        type: String,
        required: true
    }],
    platforms: [{
        type: String,
        required: true
    }],
    graphics: {
        type: String
    },
    engine: {
        type: String
    },
    recommendation: {
        type: Number
    },
    enjoyment: {
        type: Number
    },
    suggestions: {
        type: String
    },
    authorization: {
        type: Boolean
    },
    incubation: {
        type: Boolean
    },
    acceleration: {
        type: Boolean
    },
    submissionTime: {
        type: Date,
        required: true
    },
    submissionDelta: {
        type: Number,
        required: true
    },
    pitchTime: {
        type: Date
    },
    pitchTimeDelta: {
        type: Number
    }
});

module.exports = mongoose.model("Submission", submissionSchema);