const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const stationRoutes = require('./routes/stationRoutes');
const bookingRoutes = require('./routes/bookingRoutes'); // Make sure this is here from Sprint 3!
const aiRoutes = require('./routes/aiRoutes'); // 1. Import AI Routes

const app = express();
const PORT = process.env.PORT || 5000;

const normalizeAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000';
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = normalizeAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server calls and tools like curl/postman (no origin header)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

connectDB();

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes); // 2. Enable AI endpoint

app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'VoltHive API is running smoothly.' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});