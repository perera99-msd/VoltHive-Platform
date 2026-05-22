// volthive-backend/src/models/Station.js
const mongoose = require('mongoose');

const ChargerSchema = new mongoose.Schema({
  plugType: { 
    type: String, 
    required: true,
  },
  powerKW: { 
    type: Number, 
    required: true 
  },
  basePricePerKwh: {
    type: Number,
    required: true,
    default: 85
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'PENDING_APPROVAL', 'RESERVED', 'CHARGING', 'OFFLINE'],
    default: 'AVAILABLE'
  },
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
  ownerName: {
    type: String,
    default: 'VoltHive Partner'
  },
  stationName: {
    type: String,
    required: [true, 'Station name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: '',
  },
  phone: {
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
  chargers: [ChargerSchema], 
  
  // Legacy base price kept for fallback calculations if needed
  basePricePerKwh: {
    type: Number,
    default: 85
  },
  rateConfig: {
    baseRate: { type: Number, default: 85 },
    customRates: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 },
        startTime: String,
        endTime: String,
        rate: Number,
      }
    ]
  },
  isBookingEnabled: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

StationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', StationSchema);