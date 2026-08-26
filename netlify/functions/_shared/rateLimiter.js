import { getDb } from './db.js';

/**
 * Extracts the real client IP address from Netlify headers.
 */
export function getClientIp(event) {
  const headers = event.headers || {};
  return headers['x-nf-client-connection-ip'] || headers['client-ip'] || '127.0.0.1';
}

/**
 * MongoDB-backed IP Rate Limiter for serverless functions.
 * Prevents endpoint abuse by checking request counts per IP in a sliding window.
 *
 * @param {string} ip - Requesting client IP address
 * @param {string} endpoint - Name of the endpoint to limit
 * @param {number} maxRequests - Maximum allowed requests in the window
 * @param {number} windowMs - Window duration in milliseconds (default: 60000 / 1 minute)
 * @returns {Promise<boolean>} Resolves to true if request is allowed, false if rate limit exceeded
 */
export async function checkRateLimit(ip, endpoint, maxRequests, windowMs = 60000) {
  if (!ip) return true; // Fail-open if IP cannot be determined

  try {
    const db = await getDb();
    const collection = db.collection('rate_limits');

    // Create TTL Index once (expires logs after 1 hour to keep DB clean)
    try {
      await collection.createIndex({ windowStart: 1 }, { expireAfterSeconds: 3600 });
    } catch (indexErr) {
      // Ignore index creation errors if already exists or during parallel calls
    }

    const now = Date.now();
    const windowStart = new Date(now - (now % windowMs)); // round down to window interval

    // Increment count for current window bucket
    await collection.updateOne(
      { ip, endpoint, windowStart },
      { $inc: { count: 1 } },
      { upsert: true }
    );

    // Fetch the updated count
    const doc = await collection.findOne({ ip, endpoint, windowStart });
    if (!doc) return true;

    return doc.count <= maxRequests;
  } catch (err) {
    console.error(`[RATE_LIMITER] Error checking rate limit for ${ip} on ${endpoint}:`, err.message);
    return true; // Fail-open to avoid locking out users on database glitch
  }
}
