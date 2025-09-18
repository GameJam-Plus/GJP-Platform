const mongoose = require('mongoose');
const { Schema } = mongoose;

const userOnJamSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    siteId: {
        type: Schema.Types.ObjectId, ref: 'Site'
    },
    jamId: {
        type: Schema.Types.ObjectId, ref: 'Jam'
    },
    jammerData: {
        name: { type: String, required: false },
        email: { type: String, required: false },
        discordUsername: { type: String, required: false },
        countryOfOrigin: { type: String, required: false },
        countryOfResidence: { type: String, required: false },
        city: { type: String, required: false },
        //pronouns: { type: String, required: false },
        ethnicity: { type: String, required: false },
        gender: { type: String, required: false },
        intersex: { type: String, required: false },
        identity: { type: Array, required: false },
        orientation: { type: Array, required: false },
        disability: { type: Array, required: false },
        student: { type: String, required: false },
        school: { type: String, required: false },
        degree: { type: String, required: false },
        studies: { type: Array, required: false },
        industry: { type: Array, required: false },
        participation: { type: String, required: false },
        termsOfConduct: { type: Boolean, required: false },
        termsOfImage: { type: Boolean, required: false },
        termsOfIP: { type: Boolean, required: false }
    }
});

module.exports = mongoose.model("UserOnJam", userOnJamSchema);