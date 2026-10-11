'use strict';
/**
 * notificationPublisher – shared utility for backend services to publish
 * platform-wide activity events to the admin dashboard in real time.
 *
 * Usage (any backend service):
 *   const { publishAdminEvent } = require('@/utils/notificationPublisher');
 *   await publishAdminEvent(redisClient, {
 *     type: 'order',
 *     action: 'order.completed',
 *     severity: 'info',
 *     summary: 'New order #1234 placed',
 *     userId: 'user_abc',
 *     userEmail: 'buyer@example.com',
 *     href: '/crm/orders/1234',
 *     meta: { orderId: '1234', total: 199.99 },
 *   });
 *
 * The admin-service liveEventConsumer.js picks this up via Redis pub/sub
 * and broadcasts it to all connected admin WebSocket clients instantly.
 */

const CHANNEL = 'admin:live_events';

/**
 * @param {import('ioredis').Redis} redisClient
 * @param {{
 *   type: string,
 *   action: string,
 *   severity?: 'info'|'warning'|'error'|'critical',
 *   summary?: string,
 *   href?: string,
 *   userId?: string,
 *   userEmail?: string,
 *   userName?: string,
 *   ip?: string,
 *   orgId?: string,
 *   country?: string,
 *   meta?: Record<string, unknown>,
 * }} event
 */
async function publishAdminEvent(redisClient, event) {
  if (!redisClient) return;  // Graceful no-op when Redis is unavailable
  try {
    const payload = {
      id:        require('crypto').randomUUID(),
      timestamp: new Date().toISOString(),
      severity:  'info',
      ...event,
    };
    await redisClient.publish(CHANNEL, JSON.stringify(payload));
  } catch (err) {
    // Non-fatal: analytics events must never crash the business logic.
    console.warn('[notificationPublisher] Failed to publish admin event:', err?.message);
  }
}

/**
 * Convenience factory that pre-fills the type so each service only needs
 * to call publish() without repeating the type each time.
 *
 * @param {import('ioredis').Redis} redisClient
 * @param {string} type
 */
function createPublisher(redisClient, type) {
  return (event) => publishAdminEvent(redisClient, { ...event, type });
}

module.exports = { publishAdminEvent, createPublisher, CHANNEL };
