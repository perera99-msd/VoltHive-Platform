const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  // GeoJSON format for MongoDB geospatial queries
  location: {
    type: { 
      type: String, 
      enum: ['Point'], 
      default: 'Point' 
    },
    coordinates: { 
      type: [Number], // Note: MongoDB requires [longitude, latitude] order
      required: true 
    } 
  },
  address: { 
    type: String, 
    required: true 
  },
  chargers: [{
    plugType: { 
      type: String, 
      enum: ['Type 2', 'CCS', 'CHAdeMO'], 
      required: true 
    },
    powerKW: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['Available', 'In Use', 'Offline', 'Reserved'], 
      default: 'Available' 
    }
  }],
  pricePerKWh: { 
    type: Number, 
    required: true 
  }
}, { 
  timestamps: true 
});

// Create a geospatial index for map queries
stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);