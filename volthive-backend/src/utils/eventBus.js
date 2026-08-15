// volthive-backend/src/utils/eventBus.js
// In-memory realtime event hub (SSE).
//
// IMPORTANT: This is an in-process hub. It is correct for the current
// deployment (single Azure Container Instance). If the backend ever scales
// to multiple instances, replace this with a shared pub/sub (Redis adapter
// or Azure SignalR) — the publish/subscribe API below should stay the same.
//
// Connection model:
//   - Each authenticated SSE client registers a connection keyed by Mongo
//     userId. publishToUser / publishToOwner deliver to those connections.
//   - Station "follows" let a client receive availability events for a
//     specific station (e.g. the BookingDrawer live-subscribes to the open
//     station while it is visible).

const connections = new Map(); // userId -> Set<writeFn>
const stationFollowers = new Map(); // stationId -> Set<userId>
const userIdStations = new Map(); // userId -> Set<stationId> (reverse index for cleanup)

/**
 * Register a live connection for a user.
 * @param {string} userId Mongo user id
 * @param {(event: object) => void} writeFn called with { event, data }
 * @returns {() => void} unsubscribe function
 */
const addConnection = (userId, writeFn) => {
  const key = String(userId);
  if (!connections.has(key)) connections.set(key, new Set());
  connections.get(key).add(writeFn);
  return () => removeConnection(key, writeFn);
};

/**
 * Remove a single connection's write function for a user.
 */
const removeConnection = (userId, writeFn) => {
  const key = String(userId);
  const set = connections.get(key);
  if (!set) return;
  set.delete(writeFn);
  if (set.size === 0) connections.delete(key);
};

/**
 * Send an event to all connections of a given user.
 */
const publishToUser = (userId, event, data) => {
  const set = connections.get(String(userId));
  if (!set) return;
  const payload = JSON.stringify({ event, data });
  for (const writeFn of set) {
    try {
      writeFn(payload);
    } catch (err) {
      console.error('eventBus.publishToUser write error:', err.message);
    }
  }
};

/**
 * Alias — owners receive their station-scoped events via publishToUser too.
 * Kept for readability at call sites (ownerId is the owner's Mongo user id).
 */
const publishToOwner = (ownerId, event, data) => publishToUser(ownerId, event, data);

/**
 * Follow a station for a user (live availability updates).
 */
const followStation = (userId, stationId) => {
  const stationKey = String(stationId);
  if (!stationFollowers.has(stationKey)) stationFollowers.set(stationKey, new Set());
  stationFollowers.get(stationKey).add(String(userId));

  if (!userIdStations.has(String(userId))) userIdStations.set(String(userId), new Set());
  userIdStations.get(String(userId)).add(stationKey);
};

/**
 * Unfollow a station for a user.
 */
const unfollowStation = (userId, stationId) => {
  const stationKey = String(stationId);
  const followers = stationFollowers.get(stationKey);
  if (followers) {
    followers.delete(String(userId));
    if (followers.size === 0) stationFollowers.delete(stationKey);
  }

  const stations = userIdStations.get(String(userId));
  if (stations) {
    stations.delete(stationKey);
    if (stations.size === 0) userIdStations.delete(String(userId));
  }
};

/**
 * Publish an event to every user currently following a station, plus the
 * station itself (by convention the event carries stationId).
 */
const publishToStation = (stationId, event, data) => {
  const followers = stationFollowers.get(String(stationId));
  if (!followers) return;
  const payload = JSON.stringify({ event, data: { ...(data || {}), stationId: String(stationId) } });
  for (const userId of followers) {
    const set = connections.get(userId);
    if (!set) continue;
    for (const writeFn of set) {
      try {
        writeFn(payload);
      } catch (err) {
        console.error('eventBus.publishToStation write error:', err.message);
      }
    }
  }
};

/**
 * Remove a user's connection entirely (used on disconnect) and release all
 * station follows held by that user.
 */
const disconnectUser = (userId) => {
  connections.delete(String(userId));

  const stations = userIdStations.get(String(userId));
  if (stations) {
    for (const stationKey of stations) {
      const followers = stationFollowers.get(stationKey);
      if (followers) {
        followers.delete(String(userId));
        if (followers.size === 0) stationFollowers.delete(stationKey);
      }
    }
    userIdStations.delete(String(userId));
  }
};

/**
 * Number of active connections (diagnostics).
 */
const connectionCount = () => {
  let count = 0;
  for (const set of connections.values()) count += set.size;
  return count;
};

module.exports = {
  addConnection,
  removeConnection,
  disconnectUser,
  publishToUser,
  publishToOwner,
  publishToStation,
  followStation,
  unfollowStation,
  connectionCount,
};
