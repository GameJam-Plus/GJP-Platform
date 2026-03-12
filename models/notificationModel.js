const mongoose = require('mongoose');
const { Schema } = mongoose;
const notificationSchema = new Schema({
  titlePT: {
    type: String,
    default: ''
  },
  titleES: {
    type: String,
    default: ''
  },
  titleEN: {
    type: String,
    default: ''
  },
  descriptionPT: {
    type: String,
    default: ''
  },
  descriptionES: {
    type: String,
    default: ''
  },
  descriptionEN: {
    type: String,
    default: ''
  },
  createdBy: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      default: ''
    }
  },
  readBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
