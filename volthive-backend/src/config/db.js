const mongoose = require('mongoose');

const connectDB = async () => {
  const tried = [];
  const candidates = [];
  const isDbRequired = process.env.DB_REQUIRED === 'true';
  if (process.env.MONGO_URI) candidates.push(process.env.MONGO_URI);
  if (process.env.LOCAL_MONGO_URI) candidates.push(process.env.LOCAL_MONGO_URI);
  candidates.push('mongodb://127.0.0.1:27017/Volthive_DB');

  for (const uri of candidates) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      tried.push({ uri, message: error.message });
      console.error(`MongoDB connect failed for ${uri}: ${error.message}`);
    }
  }

  console.error('All MongoDB connection attempts failed:', tried);
  if (isDbRequired) {
    process.exit(1);
  }

  console.error('Continuing without DB connection (development fallback).');
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

mongoose.connection.on('error', (error) => {
  console.error(`MongoDB runtime error: ${error.message}`);
});

module.exports = connectDB;