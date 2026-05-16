// volthive-backend/src/models/Station.js
const mongoose = require('mongoose');

const ChargerSchema = new mongoose.Schema({
  plugType: { 
    type: String, 
    required: true,
    enum: ['CCS2', 'Type 2', 'CHAdeMO', 'CCS1', 'Type 1', 'GB/T']
  },
  powerKW: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'PENDING_APPROVAL', 'RESERVED', 'CHARGING', 'OFFLINE'],
    default: 'AVAILABLE'
  },
  // If the charger is currently in use, we link the active booking ID here
  activeBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  }
});

const StationSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stationName: {
    type: String,
    required: [true, 'Station name is required'],
    trim: true,
  },
  address: {
    type: String,
    default: '',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  chargers: [ChargerSchema], // Array of physical chargers
  basePricePerKwh: {
    type: Number,
    required: true,
  },
  rateConfig: {
    baseRate: { type: Number, default: 85 },
    customRates: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday
        startTime: String, // e.g., "18:00"
        endTime: String,   // e.g., "22:00"
        rate: Number,
      }
    ]
  },
  isBookingEnabled: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Index for fast geospatial queries (Smart Match)
StationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', StationSchema);