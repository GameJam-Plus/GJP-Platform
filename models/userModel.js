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
        required: false
    },
    linkedin: {
        type: String,
        required: false
    },
    telefoneWhatsApp: {
        type: String,
        required: false
    },
    ethnicity: {
        type: String,
        required: false
    },
    instagram: {
        type: String,
        required: false
    },      
    gender: {
        type: String,
        enum: ["Male", "Female", "Non-binary", "Prefer not to declare"],
        required: false
    },
    intersex: {
        type: String,
        required: false
    }, 
    identity: {
        type: Array,
        required: false
    }, 
    orientation: {
        type: Array,
        required: false
    }, 
    disability: {
        type: Array,
        required: false
    }, 
    participation: {
        type: String,
        required: false
    }, 
    student: {
        type: String,
        required: false
    }, 
    school: {
        type: String,
        required: false
    }, 
    darkMode: {
        type: Boolean,
        required: false,
        default: false
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
