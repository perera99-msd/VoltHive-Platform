const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const stationRoutes = require('./routes/stationRoutes'); // Added station routes

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes); // Enabled station endpoints

// Basic Health Check
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'VoltHive API is running smoothly.' 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});