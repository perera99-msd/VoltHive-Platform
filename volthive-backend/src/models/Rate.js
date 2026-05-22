const mongoose = require('mongoose');

const CustomRateSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, default: '' },
  rate: { type: Number, required: true }
});

const RateSchema = new mongoose.Schema({
  chargerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  baseRate: { type: Number, required: true },
  customRates: [CustomRateSchema]
}, { timestamps: true });

module.exports = mongoose.model('Rate', RateSchema);
