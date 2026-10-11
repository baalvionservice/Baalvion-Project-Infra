'use strict';
const { sendSuccess } = require('../utils/response');
const { publishAdminEvent } = require('@baalvion/notification-publisher');
const redis = require('../config/redis');
const logger = require('../utils/logger');

// Lazy DB reference
let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

// Ensure the visitors table exists (idempotent, non-fatal)
let _schemaReady;
async function ensureSchema() {
    if (_schemaReady) return;
    try {
        const { sequelize } = getDb();
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS admin.site_visitors (
                id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id      TEXT        NOT NULL,
                ip              TEXT,
                real_ip         TEXT,
                country         TEXT,
                country_code    TEXT,
                region          TEXT,
                city            TEXT,
                isp             TEXT,
                org             TEXT,
                timezone        TEXT,
                latitude        NUMERIC(10,6),
                longitude       NUMERIC(10,6),
                user_agent      TEXT,
                browser         TEXT,
                browser_version TEXT,
                os              TEXT,
                device_type     TEXT,
                screen_width    INTEGER,
                screen_height   INTEGER,
                language        TEXT,
                referrer        TEXT,
                landing_path    TEXT,
                page_title      TEXT,
                entered_site    BOOLEAN     NOT NULL DEFAULT FALSE,
                entered_at      TIMESTAMPTZ,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_site_visitors_created_at ON admin.site_visitors (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_site_visitors_ip ON admin.site_visitors (ip);
            CREATE INDEX IF NOT EXISTS idx_site_visitors_country ON admin.site_visitors (country);
        `);
        _schemaReady = true;
    } catch (err) {
        logger.warn({ err: err.message }, '[trackController] Could not ensure schema — tracking will still work via pub/sub');
    }
}

// Parse user-agent string into browser/OS/device
function parseUserAgent(ua = '') {
    if (!ua) return { browser: 'Unknown', browserVersion: '', os: 'Unknown', deviceType: 'Desktop' };

    let browser = 'Unknown';
    let browserVersion = '';
    let os = 'Unknown';
    let deviceType = 'Desktop';

    // Device type
    if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua)) {
        deviceType = /iPad/i.test(ua) ? 'Tablet' : 'Mobile';
    }

    // Browser
    if (/Edg\//i.test(ua)) {
        browser = 'Edge';
        browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || '';
    } else if (/OPR\//i.test(ua)) {
        browser = 'Opera';
        browserVersion = ua.match(/OPR\/([0-9.]+)/)?.[1] || '';
    } else if (/Chrome\//i.test(ua)) {
        browser = 'Chrome';
        browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
    } else if (/Firefox\//i.test(ua)) {
        browser = 'Firefox';
        browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
    } else if (/Safari\//i.test(ua)) {
        browser = 'Safari';
        browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
    }

    // OS
    if (/Windows NT 10/i.test(ua))        os = 'Windows 10/11';
    else if (/Windows NT/i.test(ua))       os = 'Windows';
    else if (/Mac OS X/i.test(ua))         os = 'macOS';
    else if (/Android/i.test(ua))          os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Linux/i.test(ua))            os = 'Linux';

    return { browser, browserVersion, os, deviceType };
}

// Geolocate real IP using free ip-api.com
async function geolocate(ip) {
    try {
        // Skip private/localhost IPs
        if (!ip || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) {
            return {};
        }
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp,org,lat,lon,timezone`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return {};
        const data = await res.json();
        if (data.status !== 'success') return {};
        return {
            country:     data.country,
            countryCode: data.countryCode,
            region:      data.regionName,
            city:        data.city,
            isp:         data.isp,
            org:         data.org,
            latitude:    data.lat,
            longitude:   data.lon,
            timezone:    data.timezone,
        };
    } catch {
        return {};
    }
}

// ─── POST /v1/track/visitor ─────────────────────────────────────────────────
exports.trackVisitor = async (req, res, next) => {
    try {
        await ensureSchema();

        // Real IP from headers (handles proxies/CDN/Nginx)
        const realIp =
            (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
            (req.headers['x-real-ip'] || '').trim() ||
            req.socket?.remoteAddress ||
            req.ip;

        const {
            sessionId,
            userAgent,
            screenWidth,
            screenHeight,
            language,
            referrer,
            landingPath,
            pageTitle,
            enteredSite = false,
        } = req.body;

        // Parse user agent
        const { browser, browserVersion, os, deviceType } = parseUserAgent(userAgent);

        // Geolocate real IP
        const geo = await geolocate(realIp);

        const visitorData = {
            session_id:       sessionId || require('crypto').randomUUID(),
            ip:               req.body.ip || realIp,
            real_ip:          realIp,
            country:          geo.country     || req.body.country  || 'Unknown',
            country_code:     geo.countryCode || '',
            region:           geo.region      || req.body.region   || '',
            city:             geo.city        || '',
            isp:              geo.isp         || '',
            org:              geo.org         || '',
            timezone:         geo.timezone    || '',
            latitude:         geo.latitude    || null,
            longitude:        geo.longitude   || null,
            user_agent:       userAgent       || '',
            browser,
            browser_version:  browserVersion,
            os,
            device_type:      deviceType,
            screen_width:     screenWidth     || null,
            screen_height:    screenHeight    || null,
            language:         language        || '',
            referrer:         referrer        || '',
            landing_path:     landingPath     || '/',
            page_title:       pageTitle       || '',
            entered_site:     enteredSite,
            entered_at:       enteredSite ? new Date().toISOString() : null,
        };

        // Save to DB (non-fatal)
        try {
            const { sequelize } = getDb();
            await sequelize.query(`
                INSERT INTO admin.site_visitors (
                    session_id, ip, real_ip, country, country_code, region, city, isp, org, timezone,
                    latitude, longitude, user_agent, browser, browser_version, os, device_type,
                    screen_width, screen_height, language, referrer, landing_path, page_title,
                    entered_site, entered_at
                ) VALUES (
                    :session_id, :ip, :real_ip, :country, :country_code, :region, :city, :isp, :org, :timezone,
                    :latitude, :longitude, :user_agent, :browser, :browser_version, :os, :device_type,
                    :screen_width, :screen_height, :language, :referrer, :landing_path, :page_title,
                    :entered_site, :entered_at
                ) ON CONFLICT DO NOTHING
            `, { replacements: visitorData, type: 'INSERT' });
        } catch (dbErr) {
            logger.warn({ err: dbErr.message }, '[trackController] DB insert failed — still publishing event');
        }

        // Publish real-time event to admin WebSocket
        const summary = enteredSite
            ? `🔓 ${deviceType} from ${geo.city || geo.region || geo.country || realIp} entered the site`
            : `👁 ${deviceType} from ${geo.city || geo.region || geo.country || realIp} landed on site`;

        await publishAdminEvent(redis.getClient?.(), {
            type:      'visitor',
            action:    enteredSite ? 'visitor.entered' : 'visitor.landed',
            severity:  'info',
            summary,
            ip:        realIp,
            country:   geo.country,
            meta: {
                sessionId:      visitorData.session_id,
                ip:             realIp,
                country:        geo.country,
                countryCode:    geo.countryCode,
                region:         geo.region,
                city:           geo.city,
                isp:            geo.isp,
                timezone:       geo.timezone,
                browser:        `${browser} ${browserVersion}`.trim(),
                os,
                deviceType,
                screen:         screenWidth && screenHeight ? `${screenWidth}×${screenHeight}` : null,
                language,
                referrer,
                landingPath,
                enteredSite,
                enteredAt:      visitorData.entered_at,
            },
        });

        sendSuccess(req, res, { tracked: true });
    } catch (err) {
        next(err);
    }
};

// ─── GET /v1/track/visitors — admin-only list ────────────────────────────────
exports.getVisitors = async (req, res, next) => {
    try {
        const { sequelize } = getDb();
        const limit  = Math.min(parseInt(req.query.limit  || '100', 10), 500);
        const offset = Math.max(parseInt(req.query.offset || '0',   10), 0);
        const onlyEntered = req.query.entered === 'true';

        const [rows] = await sequelize.query(`
            SELECT
                id, session_id, ip, real_ip, country, country_code, region, city, isp,
                browser, browser_version, os, device_type, screen_width, screen_height,
                language, referrer, landing_path, page_title,
                entered_site, entered_at, created_at
            FROM admin.site_visitors
            ${onlyEntered ? 'WHERE entered_site = true' : ''}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        `, { replacements: { limit, offset } });

        const [[{ total }]] = await sequelize.query(`
            SELECT COUNT(*) AS total FROM admin.site_visitors
            ${onlyEntered ? 'WHERE entered_site = true' : ''}
        `);

        sendSuccess(req, res, { visitors: rows, total: parseInt(total, 10), limit, offset });
    } catch (err) {
        next(err);
    }
};
