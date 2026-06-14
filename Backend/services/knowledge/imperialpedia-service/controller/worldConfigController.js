'use strict';

const db = require('../models');

/**
 * Default World config — the seed shown in the admin panel and used by the
 * public World page until an admin customizes it. Mirrors the symbols the
 * World page ships with so editors start from the real, working set.
 */
const i = (symbol, name, dec, kind, group) => ({ symbol, name, dec, kind, group: group || null });

const DEFAULT_CONFIG = {
    settings: { newsFallback: true, refreshSeconds: 120 },
    watchlist: [
        { symbol: 'AAPL', name: 'Apple' },
        { symbol: 'MSFT', name: 'Microsoft' },
        { symbol: 'NVDA', name: 'Nvidia' },
        { symbol: 'GOOGL', name: 'Alphabet' },
        { symbol: 'AMZN', name: 'Amazon' },
        { symbol: 'META', name: 'Meta' },
        { symbol: 'TSLA', name: 'Tesla' },
        { symbol: 'JPM', name: 'JPMorgan' },
    ],
    regions: [
        {
            id: 'world', label: 'World', enabled: true,
            indices: [
                i('^DJI', 'Dow Jones', 2, 'index', 'Americas'),
                i('^GSPC', 'S&P 500', 2, 'index', 'Americas'),
                i('^IXIC', 'Nasdaq', 2, 'index', 'Americas'),
                i('^BVSP', 'Bovespa', 0, 'index', 'Americas'),
                i('^FTSE', 'FTSE 100', 2, 'index', 'Europe'),
                i('^GDAXI', 'DAX', 2, 'index', 'Europe'),
                i('^FCHI', 'CAC 40', 2, 'index', 'Europe'),
                i('^N225', 'Nikkei 225', 2, 'index', 'Asia-Pacific'),
                i('^HSI', 'Hang Seng', 2, 'index', 'Asia-Pacific'),
                i('000001.SS', 'Shanghai', 2, 'index', 'Asia-Pacific'),
                i('GC=F', 'Gold', 2, 'commodity'),
                i('CL=F', 'Crude (WTI)', 2, 'commodity'),
                i('BTC-USD', 'Bitcoin', 0, 'crypto'),
                i('EURUSD=X', 'EUR/USD', 4, 'fx'),
            ],
        },
        {
            id: 'us', label: 'U.S.', enabled: true,
            indices: [
                i('^DJI', 'Dow Jones', 2, 'index', 'Americas'),
                i('^GSPC', 'S&P 500', 2, 'index', 'Americas'),
                i('^IXIC', 'Nasdaq', 2, 'index', 'Americas'),
                i('^RUT', 'Russell 2000', 2, 'index', 'Americas'),
                i('^TNX', '10-Yr Yield', 3, 'yield'),
                i('^VIX', 'VIX', 2, 'index'),
                i('GC=F', 'Gold', 2, 'commodity'),
                i('CL=F', 'Crude (WTI)', 2, 'commodity'),
            ],
        },
        {
            id: 'europe', label: 'Europe', enabled: true,
            indices: [
                i('^FTSE', 'FTSE 100', 2, 'index', 'Europe'),
                i('^GDAXI', 'DAX', 2, 'index', 'Europe'),
                i('^FCHI', 'CAC 40', 2, 'index', 'Europe'),
                i('^IBEX', 'IBEX 35', 2, 'index', 'Europe'),
                i('^STOXX', 'STOXX 600', 2, 'index', 'Europe'),
                i('FTSEMIB.MI', 'FTSE MIB', 0, 'index', 'Europe'),
                i('EURUSD=X', 'EUR/USD', 4, 'fx'),
                i('BZ=F', 'Brent', 2, 'commodity'),
            ],
        },
        {
            id: 'asia', label: 'Asia-Pacific', enabled: true,
            indices: [
                i('^N225', 'Nikkei 225', 2, 'index', 'Asia-Pacific'),
                i('^HSI', 'Hang Seng', 2, 'index', 'Asia-Pacific'),
                i('000001.SS', 'Shanghai', 2, 'index', 'Asia-Pacific'),
                i('^KS11', 'Kospi', 2, 'index', 'Asia-Pacific'),
                i('^AXJO', 'ASX 200', 2, 'index', 'Asia-Pacific'),
                i('^BSESN', 'Sensex', 2, 'index', 'Asia-Pacific'),
                i('^NSEI', 'Nifty 50', 2, 'index', 'Asia-Pacific'),
                i('JPY=X', 'USD/JPY', 2, 'fx'),
            ],
        },
        {
            id: 'china', label: 'China', enabled: true,
            indices: [
                i('000001.SS', 'Shanghai', 2, 'index', 'Asia-Pacific'),
                i('399001.SZ', 'Shenzhen', 2, 'index', 'Asia-Pacific'),
                i('^HSI', 'Hang Seng', 2, 'index', 'Asia-Pacific'),
                i('000300.SS', 'CSI 300', 2, 'index', 'Asia-Pacific'),
                i('399006.SZ', 'ChiNext', 2, 'index', 'Asia-Pacific'),
                i('CNY=X', 'USD/CNY', 4, 'fx'),
            ],
        },
        {
            id: 'emerging', label: 'Emerging Markets', enabled: true,
            indices: [
                i('^BVSP', 'Bovespa', 0, 'index', 'Americas'),
                i('^BSESN', 'Sensex', 2, 'index', 'Asia-Pacific'),
                i('^NSEI', 'Nifty 50', 2, 'index', 'Asia-Pacific'),
                i('000001.SS', 'Shanghai', 2, 'index', 'Asia-Pacific'),
                i('^HSI', 'Hang Seng', 2, 'index', 'Asia-Pacific'),
                i('BRL=X', 'USD/BRL', 4, 'fx'),
                i('INR=X', 'USD/INR', 2, 'fx'),
            ],
        },
    ],
};

async function loadRow() {
    const [row] = await db.WorldConfig.findOrCreate({
        where: { id: 1 },
        defaults: { id: 1, config: DEFAULT_CONFIG },
    });
    return row;
}

/** GET /v1/world-config — public read. */
exports.getConfig = async (req, res) => {
    try {
        const row = await loadRow();
        const config = row.config && Object.keys(row.config).length ? row.config : DEFAULT_CONFIG;
        return res.json({ success: true, data: config, updatedAt: row.updated_at, updatedBy: row.updated_by });
    } catch (err) {
        // Never block the public page — hand back the default on any failure.
        return res.json({ success: true, data: DEFAULT_CONFIG, fallback: true });
    }
};

/** PUT /v1/world-config — admin write. */
exports.updateConfig = async (req, res) => {
    try {
        const incoming = req.body && req.body.config ? req.body.config : req.body;
        if (!incoming || typeof incoming !== 'object' || !Array.isArray(incoming.regions)) {
            return res.status(400).json({ success: false, error: 'config must include a regions array' });
        }
        const config = {
            settings: {
                newsFallback: incoming.settings?.newsFallback !== false,
                refreshSeconds: Number(incoming.settings?.refreshSeconds) || 120,
            },
            watchlist: Array.isArray(incoming.watchlist) ? incoming.watchlist : [],
            regions: incoming.regions,
        };
        const row = await loadRow();
        const actor = req.auth?.email || req.auth?.sub || req.auth?.userId || 'admin';
        await row.update({ config, updated_by: String(actor) });
        return res.json({ success: true, data: config });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
