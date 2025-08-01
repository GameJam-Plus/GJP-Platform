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
    gender: {
        type: String,
        enum: ["Masculino", "Feminino", "Não-binário", "Prefiro não dizer", "Outro"],
        required: true
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
