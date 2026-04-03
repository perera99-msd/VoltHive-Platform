const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const stationRoutes = require('./routes/stationRoutes');
const bookingRoutes = require('./routes/bookingRoutes'); // Make sure this is here from Sprint 3!
const aiRoutes = require('./routes/aiRoutes'); // 1. Import AI Routes

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes); // 2. Enable AI endpoint

app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'VoltHive API is running smoothly.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});