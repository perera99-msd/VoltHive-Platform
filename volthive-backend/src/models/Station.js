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
  // Real location category used by the AI (matches training categories).
  // Owner-set; normalized to a training category by the AI mapping layer.
  locationType: {
    type: String,
    default: 'Urban Center',
  },
  // Continuous-pricing aggressiveness profile used by the AI demand curve.
  // conservative: gentle surges/discounts · balanced: default · aggressive: deeper swings.
  pricingProfile: {
    type: String,
    enum: ['conservative', 'balanced', 'aggressive'],
    default: 'balanced',
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
  specialEvents: [
    {
      title: { type: String, required: true },
      date: { type: String, required: true }, // YYYY-MM-DD
      time: { type: String, default: '12:00' },
      locationName: { type: String, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      category: { type: String, default: 'Sports Event / Cricket Match' }
    }
  ],
  activePriceOverride: {
    effectiveRate: { type: Number, default: null },
    originalRate: { type: Number, default: null },
    hourSlot: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    multiplier: { type: Number, default: null },
    appliedAt: { type: Date, default: null }
  },
  // Scheduled AI price plan: an owner can apply AI-recommended rates for
  // MULTIPLE upcoming hour slots (station-wise). Each entry auto-reverts to
  // the station's normal base rate when its hour passes.
  pricePlan: [
    {
      hourSlot: { type: String, default: null },      // "HH:00"
      effectiveRate: { type: Number, default: null },
      originalRate: { type: Number, default: null },
      multiplier: { type: Number, default: null },
      expiresAt: { type: Date, default: null },
      appliedAt: { type: Date, default: null }
    }
  ],
}, { timestamps: true });

StationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', StationSchema);