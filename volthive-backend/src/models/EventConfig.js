const mongoose = require('mongoose');

const EventConfigSchema = new mongoose.Schema({
  configId: { type: String, default: 'global_cockpit', unique: true },
  autoFeedEnabled: { type: Boolean, default: true },
  activeCricketMatch: {
    eventName: { type: String, default: 'Sri Lanka vs India Asia Cup Final' },
    venue: { type: String, default: 'R. Premadasa Stadium' },
    isActive: { type: Boolean, default: true },
    expectedSurge: { type: String, default: 'Extreme Surge (+25% AI Surge)' },
    date: { type: String, default: 'Today, 07:00 PM' }
  },
  manualOverrides: {
    weather: { type: String, default: 'Clear' },
    trafficIndex: { type: Number, default: 4 },
    isPeakOverride: { type: Boolean, default: false }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventConfig', EventConfigSchema);
