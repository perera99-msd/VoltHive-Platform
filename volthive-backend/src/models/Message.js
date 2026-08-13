// volthive-backend/src/models/Message.js
// Chat message between a driver and a station's owner.
// A "conversation" is implicitly the pair (stationId, driverId).
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
    index: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sender: {
    type: String,
    enum: ['driver', 'owner'],
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Fast lookups: all messages for a conversation, newest first
messageSchema.index({ stationId: 1, driverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
