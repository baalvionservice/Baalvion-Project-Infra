const { z } = require('zod');

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createPortfolioSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    currency: z.string().max(10).default('INR'),
    is_default: z.boolean().optional(),
    is_public: z.boolean().optional(),
});

const updatePortfolioSchema = createPortfolioSchema.partial();

const addHoldingSchema = z.object({
    symbol: z.string().min(1).max(50),
    name: z.string().max(255).optional(),
    asset_type: z.string().max(50).default('stock'),
    quantity: z.number().positive(),
    avg_buy_price: z.number().positive(),
    current_price: z.number().min(0).optional(),
    invested_amount: z.number().positive(),
    first_bought_at: z.string().datetime().optional(),
});

const createWatchlistSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    is_default: z.boolean().optional(),
});

const updateWatchlistSchema = createWatchlistSchema.partial();

const addWatchlistItemSchema = z.object({
    symbol: z.string().min(1).max(50),
    name: z.string().max(255).optional(),
    asset_type: z.string().max(50).default('stock'),
    notes: z.string().optional(),
});

const createTradeSchema = z.object({
    portfolio_id: z.number().int().positive(),
    symbol: z.string().min(1).max(50),
    name: z.string().max(255).optional(),
    trade_type: z.enum(['buy', 'sell']),
    quantity: z.number().positive(),
    price: z.number().positive(),
    total_amount: z.number().positive(),
    fees: z.number().min(0).default(0),
    currency: z.string().max(10).default('INR'),
    exchange: z.string().max(100).optional(),
    broker: z.string().max(100).optional(),
    notes: z.string().optional(),
    traded_at: z.string().datetime().optional(),
});

const createAlertSchema = z.object({
    symbol: z.string().min(1).max(50),
    name: z.string().max(255).optional(),
    alert_type: z.enum(['above', 'below', 'pct_change_up', 'pct_change_down']),
    target_value: z.number(),
    currency: z.string().max(10).default('INR'),
    notify_email: z.boolean().default(true),
});

const updateAlertSchema = z.object({
    alert_type: z.enum(['above', 'below', 'pct_change_up', 'pct_change_down']).optional(),
    target_value: z.number().optional(),
    is_active: z.boolean().optional(),
    notify_email: z.boolean().optional(),
});

const createNewsSchema = z.object({
    headline: z.string().min(1).max(1000),
    summary: z.string().optional(),
    source_name: z.string().max(255).optional(),
    source_url: z.string().url().optional(),
    published_at: z.string().datetime().optional(),
    related_symbols: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    image_url: z.string().url().optional(),
});

const newsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    symbol: z.string().optional(),
    category: z.string().optional(),
});

module.exports = {
    paginationSchema,
    createPortfolioSchema,
    updatePortfolioSchema,
    addHoldingSchema,
    createWatchlistSchema,
    updateWatchlistSchema,
    addWatchlistItemSchema,
    createTradeSchema,
    createAlertSchema,
    updateAlertSchema,
    createNewsSchema,
    newsQuerySchema,
};
