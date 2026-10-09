'use strict';
const logger = require('../utils/logger');
const redis = require('../config/redis');
const { broadcast } = require('../realtime');
const config = require('../config/appConfig');
const Redis = require('ioredis');

let subClient = null;

async function startLiveEventConsumer() {
    if (!config.redis.host) {
        logger.info('[live-events] Redis not configured, skipping consumer');
        return;
    }
    
    try {
        subClient = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password || undefined,
            lazyConnect: true,
        });
        
        await subClient.connect();
        
        await subClient.subscribe('admin:live_events', (err, count) => {
            if (err) {
                logger.error({ err }, '[live-events] Failed to subscribe to admin:live_events');
            } else {
                logger.info({ count }, '[live-events] Subscribed to admin:live_events');
            }
        });

        subClient.on('message', (channel, message) => {
            if (channel === 'admin:live_events') {
                try {
                    const eventData = JSON.parse(message);
                    // Broadcast the 'event' message to all connected WebSocket clients
                    broadcast('event', eventData);
                } catch (err) {
                    logger.error({ err }, '[live-events] Error parsing event message');
                }
            }
        });
        
    } catch (err) {
        logger.error({ err }, '[live-events] Error connecting subscription client');
    }
}

async function stopLiveEventConsumer() {
    if (subClient) {
        await subClient.quit();
        subClient = null;
    }
}

module.exports = { startLiveEventConsumer, stopLiveEventConsumer };
