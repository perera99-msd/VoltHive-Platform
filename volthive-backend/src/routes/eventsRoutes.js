// volthive-backend/src/routes/eventsRoutes.js
// Server-Sent Events (SSE) endpoint + station follow/unfollow.
//
// GET  /api/events              — live event stream (Bearer auth)
// POST /api/events/follow       — { stationId } subscribe to station availability
// POST /api/events/unfollow     — { stationId } unsubscribe from station availability
//
// The client uses a fetch-based reader so the token travels in the
// Authorization header (never in the URL). Events are JSON:
//   { event: 'booking.updated'|'message.new'|..., data: {...} }
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Station = require('../models/Station');
const {
  addConnection,
  disconnectUser,
  followStation,
  unfollowStation,
} = require('../utils/eventBus');

const resolveUser = async (uid) => User.findOne({ firebaseUid: uid });

// ─────────────────────────────────────────────────────────────
// GET /api/events — SSE stream
// ─────────────────────────────────────────────────────────────
router.get('/events', async (req, res) => {
  // Auth: Bearer token in Authorization header (set by fetch-based client).
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  const user = await resolveUser(decoded.uid);
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  // SSE headers.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering
  });
  res.flushHeaders();

  const writeEvent = (payload) => {
    res.write(`data: ${payload}\n\n`);
  };

  // Register this connection.
  const unsubscribe = addConnection(user._id, writeEvent);

  // Send an initial "connected" event so the client knows it is live.
  res.write(`data: ${JSON.stringify({ event: 'connected', data: { userId: String(user._id), role: user.role } })}\n\n`);

  // Heartbeat every 25s to keep the connection alive through proxies.
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25 * 1000);

  // Cleanup on disconnect.
  const onClose = () => {
    clearInterval(heartbeat);
    unsubscribe();
    disconnectUser(user._id);
    res.end();
  };
  req.on('close', onClose);
  res.on('close', onClose);
});

// ─────────────────────────────────────────────────────────────
// POST /api/events/follow  — subscribe to a station's live updates
// ─────────────────────────────────────────────────────────────
router.post('/events/follow', verifyToken, async (req, res) => {
  try {
    const stationId = String(req.body?.stationId || '');
    if (!stationId) return res.status(400).json({ error: 'stationId is required.' });

    const user = await resolveUser(req.user.uid);
    if (!user) return res.status(401).json({ error: 'User account not found.' });

    const station = await Station.findById(stationId).select('_id');
    if (!station) return res.status(404).json({ error: 'Station not found.' });

    followStation(user._id, stationId);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/events/unfollow — unsubscribe from a station
// ─────────────────────────────────────────────────────────────
router.post('/events/unfollow', verifyToken, async (req, res) => {
  try {
    const stationId = String(req.body?.stationId || '');
    const user = await resolveUser(req.user.uid);
    if (!user) return res.status(401).json({ error: 'User account not found.' });

    if (stationId) unfollowStation(user._id, stationId);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
