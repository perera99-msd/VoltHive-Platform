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
const bookingRoutes = require('./routes/bookingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chargerRoutes = require('./routes/chargerRoutes');
const chatRoutes = require('./routes/chatRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const { connectionCount, publishToUser, publishToStation } = require('./utils/eventBus');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Parse and normalize CORS allowed origins
 */
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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || (NODE_ENV === 'development' ? 10000 : 2000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'development' || req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    });
  }
});

// ============================================
// SECURITY & MIDDLEWARE SETUP
// ============================================
connectDB();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false, // Adjust based on your needs
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
app.use(compression({
  // Never buffer/compress the SSE stream — it must flush chunks immediately.
  filter: (req, res) => {
    if (req.path && req.path.startsWith('/api/events')) return false;
    return compression.filter(req, res);
  }
}));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use('/api', apiLimiter);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', eventsRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProd = NODE_ENV === 'production';

  // Log error (but don't expose stack trace in production)
  console.error('Request Error:', {
    status: statusCode,
    message: err.message,
    path: req.path,
    method: req.method,
    ...(isProd ? {} : { stack: err.stack })
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack, error: err })
  });
});

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, () => {
  console.log(`✅ VoltHive Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🛡️  CORS Origins: ${allowedOrigins.join(', ')}`);

  // ============================================
  // SSE STREAM SAFETY
  // Node 18+ defaults requestTimeout to 300s, which would silently kill
  // long-lived SSE connections. Disable request/header timeouts and keep the
  // socket alive for the event stream.
  // ============================================
  server.requestTimeout = 0;
  server.headersTimeout = 0;
  server.keepAliveTimeout = 65 * 1000;

  // ============================================
  // BACKGROUND TASK: 15-MIN UNCONFIRMED -> EXPIRED
  // (Booking record is KEPT in DB, never deleted)
  // ============================================
  const Booking = require('./models/Booking');
  const Station = require('./models/Station');

  setInterval(async () => {
    try {
      const now = Date.now();
      const pending = await Booking.find({ status: 'Pending' });

      for (const booking of pending) {
        const slotStart = new Date(`${booking.date}T${booking.startTime}:00`).getTime();
        const createdLimit = new Date(booking.createdAt).getTime() + 15 * 60 * 1000;

        // Expire if the slot already started, OR the 15-min approval window
        // passed AND the slot is imminent (starts within the next 15 min).
        // Advance bookings (e.g. tomorrow) are NOT auto-expired prematurely.
        const slotImminent = Number.isFinite(slotStart) && slotStart <= now + 15 * 60 * 1000;
        const shouldExpire = (Number.isFinite(slotStart) && slotStart <= now) || (now >= createdLimit && slotImminent);
        if (!shouldExpire) continue;

        booking.status = 'Expired';
        booking.removableAt = new Date(Date.now() + 10 * 60 * 1000); // visible 10 more min, then purged
        await booking.save();

        // Release the charger ONLY if it still points at THIS booking.
        const station = await Station.findById(booking.station);
        if (station && station.chargers) {
          const charger = station.chargers.id(booking.chargerId);
          if (charger && charger.activeBookingId && String(charger.activeBookingId) === String(booking._id)) {
            if (charger.status === 'PENDING_APPROVAL' || charger.status === 'RESERVED') {
              charger.status = 'AVAILABLE';
              charger.activeBookingId = null;
              await station.save();
            }
          }
        }

        // ── Realtime: notify driver + station followers of expiry ──
        const expiredEventData = {
          bookingId: booking._id,
          stationId: String(booking.station),
          stationName: station ? station.stationName : '',
          chargerId: booking.chargerId,
          status: 'Expired',
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          updatedAt: new Date().toISOString(),
        };
        publishToUser(booking.driver, 'booking.expired', expiredEventData);
        publishToStation(String(booking.station), 'availability.updated', expiredEventData);

        console.log(`⏳ Expired unconfirmed booking ${booking._id} (Exceeded 15 min approval window or slot passed).`);
      }
    } catch (err) {
      console.error('Error in 15-min expiry job:', err.message);
    }
  }, 60 * 1000); // Check every 60 seconds

  // ============================================
  // BACKGROUND TASK: PURGE DISCARDABLE BOOKINGS
  // Rejected / auto-expired bookings stay visible for 10 minutes (see
  // removableAt) and are then removed from the DB. Confirmed & Completed
  // bookings persist forever.
  // ============================================
  setInterval(async () => {
    try {
      const now = new Date();
      const doomed = await Booking.find({ removableAt: { $lt: now, $ne: null } });
      for (const b of doomed) {
        await b.deleteOne();
        console.log(`🗑️  Purged booking ${b._id} (10-min grace passed).`);
      }
    } catch (err) {
      console.error('Error in booking purge job:', err.message);
    }
  }, 60 * 1000); // Check every 60 seconds

  // ============================================
  // BACKGROUND TASK: CONFIRMED NO-SHOW -> AUTO FREE SLOT
  // A Confirmed booking whose time slot has fully ended (+15-min grace) and
  // whose session never started (actualStartedAt null) is treated as a no-show:
  // the charger slot is auto-released so other drivers can use it. The record
  // is marked No_Show + removableAt (10 min) so the purge job removes it.
  // Sessions that actually started (Active_Charging) are NEVER touched.
  // ============================================
  setInterval(async () => {
    try {
      const now = Date.now();
      const NO_SHOW_GRACE_MIN = 15; // allow drivers to be late past slot end
      const confirmed = await Booking.find({ status: 'Confirmed', actualStartedAt: null });

      for (const booking of confirmed) {
        const slotEnd = new Date(`${booking.date}T${booking.endTime}:00`).getTime();
        if (!Number.isFinite(slotEnd)) continue;
        if (slotEnd + NO_SHOW_GRACE_MIN * 60 * 1000 > now) continue;

        const station = await Station.findById(booking.station);
        const charger = station && station.chargers ? station.chargers.id(booking.chargerId) : null;

        // Only release if this booking still holds the charger's RESERVED lock.
        const ownsCharger = !!charger && !!charger.activeBookingId &&
          String(charger.activeBookingId) === String(booking._id) &&
          charger.status === 'RESERVED';
        if (!ownsCharger) continue;

        charger.status = 'AVAILABLE';
        charger.activeBookingId = null;
        await station.save();

        booking.status = 'No_Show';
        booking.removableAt = new Date(Date.now() + 10 * 60 * 1000); // visible 10 more min, then purged
        await booking.save();

        // ── Realtime: notify driver + station followers ──
        const noShowEventData = {
          bookingId: booking._id,
          stationId: String(booking.station),
          stationName: station.stationName,
          chargerId: booking.chargerId,
          status: 'No_Show',
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          updatedAt: new Date().toISOString(),
        };
        publishToUser(booking.driver, 'booking.updated', noShowEventData);
        publishToOwner(station.ownerId, 'booking.updated', noShowEventData);
        publishToStation(String(booking.station), 'availability.updated', noShowEventData);

        console.log(`🚫 Confirmed no-show booking ${booking._id} — slot auto-released (slot ${booking.date} ${booking.startTime}-${booking.endTime} passed + ${NO_SHOW_GRACE_MIN} min grace).`);
      }
    } catch (err) {
      console.error('Error in confirmed no-show job:', err.message);
    }
  }, 60 * 1000); // Check every 60 seconds

  // ============================================
  // BACKGROUND TASK: REVERT EXPIRED AI PRICES
  // When a scheduled AI price's hour passes (single override OR any slot in
  // the station's price plan), clear it so drivers automatically see the
  // previous (base) rate again.
  // ============================================
  setInterval(async () => {
    try {
      const now = new Date();

      // 1. Legacy single override
      const stale = await Station.find({
        'activePriceOverride': { $ne: null },
        'activePriceOverride.expiresAt': { $lt: now }
      });
      for (const st of stale) {
        st.activePriceOverride = null;
        await st.save();
        console.log(`↩️  Reverted expired AI price override for station ${st._id}.`);
      }

      // 2. Scheduled price plan — remove any expired hour slots
      const planStale = await Station.find({ 'pricePlan.expiresAt': { $lt: now } });
      for (const st of planStale) {
        st.pricePlan = (st.pricePlan || []).filter(p => !p.expiresAt || new Date(p.expiresAt).getTime() > now.getTime());
        await st.save();
        console.log(`↩️  Cleaned expired AI price-plan slots for station ${st._id}.`);
      }
    } catch (err) {
      console.error('Error in price-override revert job:', err.message);
    }
  }, 60 * 1000); // Check every 60 seconds
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});