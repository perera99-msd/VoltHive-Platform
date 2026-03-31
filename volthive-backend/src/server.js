const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db'); // Import the DB connection
const userRoutes = require('./routes/userRoutes'); // Import the new user routes

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

// Basic Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'VoltHive API is running smoothly.' 
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});