// volthive-backend/src/models/Station.js
const mongoose = require('mongoose');

const rateEntrySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  rate: { type: Number, min: 0, required: true },
}, { _id: false });

const rateConfigSchema = new mongoose.Schema({
  baseRate: { type: Number, min: 0, default: 0 },
  customRates: { type: [rateEntrySchema], default: [] },
}, { _id: false });

const stationSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stationName: { type: String, required: true },
  address: { type: String, default: '' },
  network: { type: String, default: 'Independent' }, // e.g., Tesla, ChargePoint, Independent
  
  // Geospatial Data for the "Best Value" Distance Calculation
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude] - Must be this order!
  },
  
  // Specs from your new dataset
  chargerType: { type: String, required: true }, // Level 2, DC Fast, CCS2, etc.
  powerOutputKW: { type: Number, required: true },
  
  // Ports & Availability
  portsTotal: { type: Number, required: true, default: 1 },
  portsAvailable: { type: Number, required: true, default: 1 },
  
  // THE CRUCIAL RULE-BASED FLAG
  isBookingEnabled: { 
    type: Boolean, 
    default: false // If false, frontend only shows "Call" or "Get Directions"
  },
  
  // Pricing
  basePricePerKwh: { type: Number, required: true },
  rateConfig: { type: rateConfigSchema, default: () => ({ baseRate: 0, customRates: [] }) },
  
}, { timestamps: true });

// Create a 2dsphere index for Map / Distance calculations
stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);