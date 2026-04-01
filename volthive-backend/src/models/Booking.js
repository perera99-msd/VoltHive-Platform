const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  date: {
    type: String, // Storing as YYYY-MM-DD for simplicity
    required: true
  },
  startTime: {
    type: String, // Storing as HH:MM (24-hour)
    required: true
  },
  endTime: {
    type: String, // Storing as HH:MM (24-hour)
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);