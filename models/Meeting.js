const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    meetId: {
      type: String,
      default: function () { return this._id.toString(); }, // Set eventId to match _id
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    meetingLink: {
      type: String, 
      trim: true,
    },
    reminderTime: {
      type: String,
    },
  },
  { timestamps: true }
);
  
  module.exports = mongoose.model('Meeting', meetingSchema);
  