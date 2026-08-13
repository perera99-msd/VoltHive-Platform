// volthive-backend/src/routes/chatRoutes.js
// Chat between drivers and station owners (WhatsApp-style threads).
// A conversation is the pair (stationId, driverId). Each side has its own
// read/unread state for the messages the OTHER side sent.
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Station = require('../models/Station');
const Message = require('../models/Message');

// Resolve the authenticated User doc; responds 401/403 on failure.
const resolveUser = async (req, res) => {
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return null;
  }
  return user;
};

const isOwner = (user) => user && user.role === 'owner';

// ─────────────────────────────────────────────────────────────
// DRIVER SIDE
// ─────────────────────────────────────────────────────────────

// GET /api/chat/driver/conversations
// All stations this driver has ever chatted with, with last message + unread.
router.get('/driver/conversations', verifyToken, async (req, res) => {
  try {
    const driver = await resolveUser(req, res);
    if (!driver) return;
    if (driver.role !== 'driver') return res.status(403).json({ error: 'Drivers only.' });

    const msgs = await Message.find({ driverId: driver._id }).sort({ createdAt: -1 }).limit(500);
    const stationIds = [...new Set(msgs.map(m => String(m.stationId)))];
    const stations = await Station.find({ _id: { $in: stationIds } });

    const byStation = new Map();
    for (const m of msgs) {
      const key = String(m.stationId);
      if (!byStation.has(key)) byStation.set(key, { unread: 0, lastMessage: null, lastTime: null });
      const entry = byStation.get(key);
      if (m.sender === 'owner' && !m.read) entry.unread += 1;
      if (!entry.lastMessage) { entry.lastMessage = m.text; entry.lastTime = m.createdAt; }
    }

    const conversations = stations.map((st) => {
      const key = String(st._id);
      const entry = byStation.get(key) || { unread: 0, lastMessage: null, lastTime: null };
      return {
        stationId: st._id,
        stationName: st.stationName,
        address: st.address || '',
        phone: st.phone || '',
        lastMessage: entry.lastMessage,
        lastTime: entry.lastTime,
        unread: entry.unread,
      };
    }).sort((a, b) => (new Date(b.lastTime || 0)) - (new Date(a.lastTime || 0)));

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/driver/:stationId  — full thread + station info, marks owner msgs read
router.get('/driver/:stationId', verifyToken, async (req, res) => {
  try {
    const driver = await resolveUser(req, res);
    if (!driver) return;
    const station = await Station.findById(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found.' });

    const messages = await Message.find({ stationId: station._id, driverId: driver._id }).sort({ createdAt: 1 });
    // Mark owner->driver messages as read (driver opened the thread)
    await Message.updateMany(
      { stationId: station._id, driverId: driver._id, sender: 'owner', read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      station: {
        id: station._id,
        stationName: station.stationName,
        address: station.address || '',
        phone: station.phone || '',
      },
      messages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/driver/:stationId  body { text }
router.post('/driver/:stationId', verifyToken, async (req, res) => {
  try {
    const driver = await resolveUser(req, res);
    if (!driver) return;
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Message text is required.' });
    if (text.length > 1000) return res.status(400).json({ error: 'Message is too long (max 1000 chars).' });

    const station = await Station.findById(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found.' });

    const message = await Message.create({
      stationId: station._id,
      driverId: driver._id,
      sender: 'driver',
      text,
      read: false,
    });
    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/driver/:stationId/read — mark owner replies as read
router.post('/driver/:stationId/read', verifyToken, async (req, res) => {
  try {
    const driver = await resolveUser(req, res);
    if (!driver) return;
    await Message.updateMany(
      { stationId: req.params.stationId, driverId: driver._id, sender: 'owner', read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// OWNER SIDE
// ─────────────────────────────────────────────────────────────

// GET /api/chat/owner/conversations — all driver threads across the owner's stations
router.get('/owner/conversations', verifyToken, async (req, res) => {
  try {
    const owner = await resolveUser(req, res);
    if (!owner) return;
    if (!isOwner(owner)) return res.status(403).json({ error: 'Owners only.' });

    const stations = await Station.find({ ownerId: owner._id });
    const stationIds = stations.map(s => s._id);
    const msgs = await Message.find({ stationId: { $in: stationIds } }).sort({ createdAt: -1 }).limit(1000);

    const driverIds = [...new Set(msgs.map(m => String(m.driverId)))];
    const drivers = await User.find({ _id: { $in: driverIds } });
    const driverName = (id) => {
      const d = drivers.find(x => String(x._id) === String(id));
      return d ? d.name : 'Driver';
    };

    const key = (m) => `${String(m.stationId)}::${String(m.driverId)}`;
    const threads = new Map();
    for (const m of msgs) {
      const k = key(m);
      if (!threads.has(k)) threads.set(k, { stationId: m.stationId, driverId: m.driverId, unread: 0, lastMessage: null, lastTime: null });
      const t = threads.get(k);
      if (m.sender === 'driver' && !m.read) t.unread += 1;
      if (!t.lastMessage) { t.lastMessage = m.text; t.lastTime = m.createdAt; }
    }

    const stationMap = new Map(stations.map(s => [String(s._id), s]));
    const conversations = [...threads.values()].map((t) => {
      const st = stationMap.get(String(t.stationId));
      return {
        stationId: t.stationId,
        stationName: st ? st.stationName : 'Station',
        driverId: t.driverId,
        driverName: driverName(t.driverId),
        lastMessage: t.lastMessage,
        lastTime: t.lastTime,
        unread: t.unread,
      };
    }).sort((a, b) => (new Date(b.lastTime || 0)) - (new Date(a.lastTime || 0)));

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/owner/:stationId — driver threads for one station
router.get('/owner/:stationId', verifyToken, async (req, res) => {
  try {
    const owner = await resolveUser(req, res);
    if (!owner) return;
    if (!isOwner(owner)) return res.status(403).json({ error: 'Owners only.' });

    const station = await Station.findById(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found.' });
    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ error: 'You can only view your own station chats.' });
    }

    const msgs = await Message.find({ stationId: station._id }).sort({ createdAt: -1 }).limit(500);
    const driverIds = [...new Set(msgs.map(m => String(m.driverId)))];
    const drivers = await User.find({ _id: { $in: driverIds } });
    const driverName = (id) => {
      const d = drivers.find(x => String(x._id) === String(id));
      return d ? d.name : 'Driver';
    };

    const threads = new Map();
    for (const m of msgs) {
      const id = String(m.driverId);
      if (!threads.has(id)) threads.set(id, { driverId: m.driverId, unread: 0, lastMessage: null, lastTime: null });
      const t = threads.get(id);
      if (m.sender === 'driver' && !m.read) t.unread += 1;
      if (!t.lastMessage) { t.lastMessage = m.text; t.lastTime = m.createdAt; }
    }

    res.status(200).json({
      success: true,
      station: { id: station._id, stationName: station.stationName },
      data: [...threads.values()].map(t => ({ ...t, driverName: driverName(t.driverId) }))
        .sort((a, b) => (new Date(b.lastTime || 0)) - (new Date(a.lastTime || 0))),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/owner/:stationId/:driverId — full thread (marks driver msgs read)
router.get('/owner/:stationId/:driverId', verifyToken, async (req, res) => {
  try {
    const owner = await resolveUser(req, res);
    if (!owner) return;
    if (!isOwner(owner)) return res.status(403).json({ error: 'Owners only.' });

    const station = await Station.findById(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found.' });
    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ error: 'You can only view your own station chats.' });
    }

    const driver = await User.findById(req.params.driverId);
    const messages = await Message.find({ stationId: station._id, driverId: req.params.driverId }).sort({ createdAt: 1 });
    await Message.updateMany(
      { stationId: station._id, driverId: req.params.driverId, sender: 'driver', read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      station: { id: station._id, stationName: station.stationName },
      driver: { id: driver ? driver._id : req.params.driverId, name: driver ? driver.name : 'Driver' },
      messages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/owner/:stationId/:driverId  body { text }
router.post('/owner/:stationId/:driverId', verifyToken, async (req, res) => {
  try {
    const owner = await resolveUser(req, res);
    if (!owner) return;
    if (!isOwner(owner)) return res.status(403).json({ error: 'Owners only.' });

    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Message text is required.' });
    if (text.length > 1000) return res.status(400).json({ error: 'Message is too long (max 1000 chars).' });

    const station = await Station.findById(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found.' });
    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ error: 'You can only reply on your own station chats.' });
    }

    const message = await Message.create({
      stationId: station._id,
      driverId: req.params.driverId,
      sender: 'owner',
      text,
      read: false,
    });
    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
