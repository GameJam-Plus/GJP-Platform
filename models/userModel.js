const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    discordUsername: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    instagram: {
        type: String,
        required: true
    },
    linkedin: {
        type: String,
        required: false
    },
    telefoneWhatsApp: {
        type: String,
        required: false
    },
    diploma: {
        type: String,
        required: false
    },
    ethnicity: {
        type: String,
        required: true
    },
    instagram: {
        type: String,
        required: true
    },      
    gender: {
        type: String,
        enum: ["Male", "Female", "Non-binary", "Prefer not to declare"],
        required: true
    },
    intersex: {
        type: String,
        required: true
    }, 
    genderIdentity: {
        type: Array,
        required: true
    }, 
    sexualOrientation: {
        type: Array,
        required: true
    }, 
    disability: {
        type: Array,
        required: true
    }, 
    participation: {
        type: String,
        required: true
    }, 
    student: {
        type: String,
        required: true
    }, 
    nameStuding: {
        type: String,
        required: false
    }, 
    socialMedia: {
        type: String,
        required: false
    },
    region: {
        _id: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region',
            required: false
        },
        name: { 
            type: String, 
            required: false 
        }
    },
    site: {
        _id: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Site',
            required: false
        },
        name: { 
            type: String, 
            required: false 
        }
    },
    roles: [{
        type: String,
        required: false
    }],
    coins: { 
        type: Number, 
        required: false
    },
    chatsIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }],
    creationDate: {
        type: Date,
        required: true
    },
    lastUpdateDate: {
        type: Date,
        required: false
    }
    
});

module.exports = mongoose.model("User", userSchema);
