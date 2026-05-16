const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  role: { 
    type: String, 
    enum: ['driver', 'owner'], 
    required: true 
  },
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true 
  },
  // --- OWNER SPECIFIC FIELDS ---
  telephone: { 
    type: String 
  },
  nicOrBrc: { 
    type: String 
  },
  address: { 
    type: String 
  },
  district: { 
    type: String 
  },
  town: { 
    type: String 
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);