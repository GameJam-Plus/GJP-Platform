const mongoose = require('mongoose');
const { Schema } = mongoose;

const jamSchema = mongoose.Schema({
    title: {
        type:String,
        required:true
    },
    open: {
        type:Boolean,
        required:true
    },
    public: {
        type:Boolean,
        required:true
    },
    toolboxGuides: {
        type: String
    },
    toolboxArts: {
        type: String
    },
    toolboxPresentations: {
        type: String
    },
    themes: [{
        titlePT: {
            type: String
        },
        titleES: {
            type: String
        },
        titleEN: {
            type: String
        },
        descriptionPT: {
            type: String
        },
        descriptionES: {
            type: String
        },
        descriptionEN: {
            type: String
        },
        manualPT: {
            type: String
        },
        manualES: {
            type: String
        },
        manualEN: {
            type: String
        },
    }],
    categories: [{
        titlePT: {
            type: String
        },
        titleES: {
            type: String
        },
        titleEN: {
            type: String
        },
        descriptionPT: {
            type: String
        },
        descriptionES: {
            type: String
        },
        descriptionEN: {
            type: String
        },
        manualPT: {
            type: String
        },
        manualES: {
            type: String
        },
        manualEN: {
            type: String
        },
        isSpecial: {
            type: Boolean
        }
    }],
    stages: [{
        stageName: {
            type: String
        },
        stageType: {
            type: String,
            enum: ['None', 'Preparation', 'Development', 'Submission', 'Evaluation', 'Event'],
            default: 'None'
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        extraDelaySubmission: {
            type: String,
            default: null
        },
        extraDelayPitch: {
            type: String,
            default: null
        },
        roles: [{
            roleName: {
                type: String
            }
        }]
    }],
    creatorUser:  {
        userId: {
            type: Schema.Types.ObjectId, 
            ref: 'GlobalOrganizer',
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
    creationDate: {
        type: Date,
        required: true
    },
    lastUpdateUser:  {
        userId: {
            type: Schema.Types.ObjectId, 
            ref: 'GlobalOrganizer'
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

module.exports = mongoose.model("Jam", jamSchema);