// volthive-backend/src/models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
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
  // We must track EXACTLY which charger the driver is plugged into
  chargerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  startTime: {
    type: String, // Expected arrival time e.g., "14:00"
    required: true
  },
  endTime: {
    type: String, // Expected departure time e.g., "14:30"
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Active_Charging', 'Completed', 'Cancelled', 'No_Show'],
    default: 'Pending'
  },
  
  // --- NEW: THE POS CALCULATION METRICS ---
  
  // The price locked in at the time of booking (AI Dynamic Price)
  lockedPricePerKwh: {
    type: Number,
    required: true
  },
  // Actual physical plug-in time (clicked by Owner)
  actualStartedAt: {
    type: Date,
    default: null
  },
  // Actual physical unplug time (clicked by Owner)
  actualEndedAt: {
    type: Date,
    default: null
  },
  // Estimated energy delivered
  energyConsumedKWh: {
    type: Number,
    default: 0
  },
  // Final bill calculated upon 'Completed' status
  totalCostLKR: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);