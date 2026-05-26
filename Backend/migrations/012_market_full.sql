-- Migration 012: Market Service — full schema
-- Run once against baalvion_db after migration 011

CREATE SCHEMA IF NOT EXISTS market;

-- ─── Portfolios ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market.portfolios (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL,
    org_id              UUID,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    currency            VARCHAR(10)  DEFAULT 'USD',
    initial_value       DECIMAL(15,2) DEFAULT 0,
    current_value       DECIMAL(15,2) DEFAULT 0,
    cash_balance        DECIMAL(15,2) DEFAULT 0,
    total_gain_loss     DECIMAL(15,2) DEFAULT 0,
    total_gain_loss_pct DECIMAL(6,2)  DEFAULT 0,
    is_default          BOOLEAN       DEFAULT false,
    created_at          TIMESTAMPTZ   DEFAULT now(),
    updated_at          TIMESTAMPTZ   DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_portfolios_user ON market.portfolios (user_id);

-- ─── Portfolio Holdings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market.portfolio_holdings (
    id               SERIAL PRIMARY KEY,
    portfolio_id     INTEGER NOT NULL REFERENCES market.portfolios(id) ON DELETE CASCADE,
    symbol           VARCHAR(20)   NOT NULL,
    name             VARCHAR(200),
    asset_type       VARCHAR(50),
    quantity         DECIMAL(15,6) NOT NULL,
    avg_buy_price    DECIMAL(12,4) NOT NULL,
    current_price    DECIMAL(12,4) DEFAULT 0,
    current_value    DECIMAL(15,2) DEFAULT 0,
    gain_loss        DECIMAL(15,2) DEFAULT 0,
    gain_loss_pct    DECIMAL(6,2)  DEFAULT 0,
    last_updated_at  TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   DEFAULT now(),
    updated_at       TIMESTAMPTZ   DEFAULT now(),
    UNIQUE (portfolio_id, symbol)
);
CREATE INDEX IF NOT EXISTS idx_market_holdings_portfolio ON market.portfolio_holdings (portfolio_id);
CREATE INDEX IF NOT EXISTS idx_market_holdings_symbol    ON market.portfolio_holdings (symbol);

-- ─── Watchlists ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market.watchlists (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    is_default  BOOLEAN     DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_watchlists_user ON market.watchlists (user_id);

-- ─── Watchlist Items ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market.watchlist_items (
    id           SERIAL PRIMARY KEY,
    watchlist_id INTEGER NOT NULL REFERENCES market.watchlists(id) ON DELETE CASCADE,
    symbol       VARCHAR(20) NOT NULL,
    name         VARCHAR(200),
    asset_type   VARCHAR(50),
    current_price DECIMAL(12,4) DEFAULT 0,
    change_pct   DECIMAL(6,2)  DEFAULT 0,
    added_at     TIMESTAMPTZ   DEFAULT now(),
    notes        TEXT,
    UNIQUE (watchlist_id, symbol)
);
CREATE INDEX IF NOT EXISTS idx_market_witems_watchlist ON market.watchlist_items (watchlist_id);

-- ─── Trades ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market.trades (
    id           SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES market.portfolios(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL,
    symbol       VARCHAR(20)   NOT NULL,
    name         VARCHAR(200),
    asset_type   VARCHAR(50),
    trade_type   VARCHAR(10)   NOT NULL CHECK (trade_type IN ('buy','sell')),
    quantity     DECIMAL(15,6) NOT NULL,
    price        DECIMAL(12,4) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    fees         DECIMAL(10,2) DEFAULT 0,
    currency     VARCHAR(10)   DEFAULT 'USD',
    exchange     VARCHAR(50),
    notes        TEXT,
    traded_at    TIMESTAMPTZ   DEFAULT now(),
    created_at   TIMESTAMPTZ   DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_trades_portfolio ON market.trades (portfolio_id);
CREATE INDEX IF NOT EXISTS idx_market_trades_user      ON market.trades (user_id);
CREATE INDEX IF NOT EXISTS idx_market_trades_symbol    ON market.trades (symbol);
CREATE INDEX IF NOT EXISTS idx_market_trades_date      ON market.trades (traded_at DESC);

-- ─── Price Alerts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market.price_alerts (
    id                     SERIAL PRIMARY KEY,
    user_id                INTEGER NOT NULL,
    symbol                 VARCHAR(20)   NOT NULL,
    name                   VARCHAR(200),
    alert_type             VARCHAR(15)   NOT NULL CHECK (alert_type IN ('above','below','change_pct')),
    target_value           DECIMAL(12,4) NOT NULL,
    current_price          DECIMAL(12,4) DEFAULT 0,
    is_triggered           BOOLEAN       DEFAULT false,
    triggered_at           TIMESTAMPTZ,
    is_active              BOOLEAN       DEFAULT true,
    notification_channels  JSONB         DEFAULT '["app"]',
    created_at             TIMESTAMPTZ   DEFAULT now(),
    updated_at             TIMESTAMPTZ   DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_alerts_user   ON market.price_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_market_alerts_symbol ON market.price_alerts (symbol);
CREATE INDEX IF NOT EXISTS idx_market_alerts_active ON market.price_alerts (is_active, is_triggered);

-- ─── Market News ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market.market_news (
    id           SERIAL PRIMARY KEY,
    headline     VARCHAR(1000) NOT NULL,
    summary      TEXT,
    source       VARCHAR(200),
    url          VARCHAR(1000),
    symbols      JSONB   DEFAULT '[]',
    categories   JSONB   DEFAULT '[]',
    sentiment    VARCHAR(10) DEFAULT 'neutral' CHECK (sentiment IN ('positive','negative','neutral')),
    published_at TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_news_date      ON market.market_news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_sentiment ON market.market_news (sentiment);

-- ─── Technical Indicators ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market.technical_indicators (
    id               SERIAL PRIMARY KEY,
    symbol           VARCHAR(20) NOT NULL,
    timeframe        VARCHAR(5)  NOT NULL,
    rsi              DECIMAL(6,2),
    macd             DECIMAL(10,4),
    macd_signal      DECIMAL(10,4),
    sma_20           DECIMAL(12,4),
    sma_50           DECIMAL(12,4),
    sma_200          DECIMAL(12,4),
    ema_20           DECIMAL(12,4),
    bollinger_upper  DECIMAL(12,4),
    bollinger_lower  DECIMAL(12,4),
    volume_avg       DECIMAL(20,2),
    trend            VARCHAR(10) DEFAULT 'sideways' CHECK (trend IN ('bullish','bearish','sideways')),
    calculated_at    TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (symbol, timeframe)
);
CREATE INDEX IF NOT EXISTS idx_market_tech_symbol ON market.technical_indicators (symbol);
