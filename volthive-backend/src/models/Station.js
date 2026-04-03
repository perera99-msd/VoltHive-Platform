// volthive-backend/src/models/Station.js
const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stationName: { type: String, required: true },
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
  
}, { timestamps: true });

// Create a 2dsphere index for Map / Distance calculations
stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);