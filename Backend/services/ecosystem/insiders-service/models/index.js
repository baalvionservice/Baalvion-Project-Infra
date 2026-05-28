'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    schema: config.db.schema,
    logging: false,
    define: { underscored: true, freezeTableName: true, schema: config.db.schema },
});

const db = { Sequelize, sequelize };

// Shared column shapes -------------------------------------------------------
const uuidPk = { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 };
const num = (field) => ({
    type: DataTypes.DECIMAL,
    get() { const v = this.getDataValue(field); return v === null || v === undefined ? v : Number(v); },
});
// created_at only (no updated_at column in the table)
const createdOnly = { timestamps: true, createdAt: 'created_at', updatedAt: false };
// both timestamps
const bothTs = { timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' };

const def = (name, table, attrs, opts = {}) =>
    sequelize.define(name, attrs, { tableName: table, ...opts });

// ── Auth ────────────────────────────────────────────────────────────────────
db.User = def('User', 'users', {
    id: uuidPk,
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    password_hash: { type: DataTypes.TEXT, allowNull: false },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verify_token: DataTypes.TEXT,
    reset_token: DataTypes.TEXT,
    reset_token_expires: DataTypes.DATE,
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    failed_login_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    locked_until: DataTypes.DATE,
    last_login_at: DataTypes.DATE,
}, bothTs);

db.RefreshToken = def('RefreshToken', 'refresh_tokens', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    token_hash: { type: DataTypes.TEXT, allowNull: false },
    user_agent: DataTypes.TEXT,
    ip: DataTypes.TEXT,
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: DataTypes.DATE,
}, createdOnly);

// ── Profiles / roles ──────────────────────────────────────────────────────────
db.Profile = def('Profile', 'profiles', {
    id: { type: DataTypes.UUID, primaryKey: true }, // == users.id (set explicitly)
    username: { type: DataTypes.TEXT, allowNull: false, unique: true },
    full_name: DataTypes.TEXT,
    avatar_url: DataTypes.TEXT,
    bio: DataTypes.TEXT,
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    streak_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_active_date: DataTypes.DATEONLY,
    // founder profile (migration 005)
    role: { type: DataTypes.STRING, defaultValue: 'founder' },
    company_name: DataTypes.TEXT,
    company_about: DataTypes.TEXT,
    contact_email: DataTypes.TEXT,
    contact_phone: DataTypes.TEXT,
    region: DataTypes.STRING,
    sector: DataTypes.STRING,
    stage: DataTypes.STRING,
    idea: DataTypes.TEXT,
    interview: { type: DataTypes.JSONB, defaultValue: [] },
    video_url: DataTypes.TEXT,
    linkedin_url: DataTypes.TEXT,
    website: DataTypes.TEXT,
    // platform v2 (migration 006)
    headline: DataTypes.TEXT,
    banner_url: DataTypes.TEXT,
    work_experience: { type: DataTypes.JSONB, defaultValue: [] },
    education: { type: DataTypes.JSONB, defaultValue: [] },
    skills: { type: DataTypes.JSONB, defaultValue: [] },
    founder_strengths: { type: DataTypes.JSONB, defaultValue: [] },
    problem: DataTypes.TEXT,
    solution: DataTypes.TEXT,
    why_now: DataTypes.TEXT,
    differentiation: DataTypes.TEXT,
    market_tam: DataTypes.TEXT,
    business_model: DataTypes.TEXT,
    target_market: DataTypes.TEXT,
    raising: { type: DataTypes.BOOLEAN, defaultValue: false },
    round_type: DataTypes.STRING,
    raise_amount: num('raise_amount'),
    valuation: num('valuation'),
    instrument: DataTypes.STRING,
    use_of_funds: DataTypes.TEXT,
    pitch_deck_url: DataTypes.TEXT,
    profile_score: { type: DataTypes.INTEGER, defaultValue: 0 },
    readiness_score: { type: DataTypes.INTEGER, defaultValue: 0 },
    onboarding_step: { type: DataTypes.INTEGER, defaultValue: 0 },
    onboarding_complete: { type: DataTypes.BOOLEAN, defaultValue: false },
}, bothTs);

db.UserRole = def('UserRole', 'user_roles', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
}, createdOnly);

// ── Gamification ────────────────────────────────────────────────────────────
db.Badge = def('Badge', 'badges', {
    id: uuidPk,
    name: { type: DataTypes.TEXT, allowNull: false },
    description: DataTypes.TEXT,
    icon: DataTypes.TEXT,
    points_required: { type: DataTypes.INTEGER, defaultValue: 0 },
}, createdOnly);

db.UserBadge = def('UserBadge', 'user_badges', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    badge_id: { type: DataTypes.UUID, allowNull: false },
    earned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

// ── Forums ────────────────────────────────────────────────────────────────────
db.ForumCategory = def('ForumCategory', 'forum_categories', {
    id: uuidPk,
    name: { type: DataTypes.TEXT, allowNull: false },
    description: DataTypes.TEXT,
    icon: DataTypes.TEXT,
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
}, createdOnly);

db.ForumThread = def('ForumThread', 'forum_threads', {
    id: uuidPk,
    category_id: { type: DataTypes.UUID, allowNull: false },
    author_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'open' },
    views: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_pinned: { type: DataTypes.BOOLEAN, defaultValue: false },
}, bothTs);

db.ForumPost = def('ForumPost', 'forum_posts', {
    id: uuidPk,
    thread_id: { type: DataTypes.UUID, allowNull: false },
    author_id: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    likes: { type: DataTypes.INTEGER, defaultValue: 0 },
}, bothTs);

db.PostLike = def('PostLike', 'post_likes', {
    id: uuidPk,
    post_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
}, createdOnly);

db.ThreadBookmark = def('ThreadBookmark', 'thread_bookmarks', {
    id: uuidPk,
    thread_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
}, createdOnly);

db.Tag = def('Tag', 'tags', {
    id: uuidPk,
    name: { type: DataTypes.TEXT, allowNull: false },
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    color: DataTypes.TEXT,
    icon: DataTypes.TEXT,
}, createdOnly);

db.ThreadTag = def('ThreadTag', 'thread_tags', {
    id: uuidPk,
    thread_id: { type: DataTypes.UUID, allowNull: false },
    tag_id: { type: DataTypes.UUID, allowNull: false },
}, createdOnly);

// ── Marketplace ───────────────────────────────────────────────────────────────
db.Product = def('Product', 'products', {
    id: uuidPk,
    name: { type: DataTypes.TEXT, allowNull: false },
    description: DataTypes.TEXT,
    category: { type: DataTypes.STRING, allowNull: false },
    price: { ...num('price'), allowNull: false },
    discount_price: num('discount_price'),
    image_url: DataTypes.TEXT,
    is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
}, bothTs);

db.Order = def('Order', 'orders', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    product_id: DataTypes.UUID,
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    total_amount: { ...num('total_amount'), allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
}, createdOnly);

// ── Deals & funnel ────────────────────────────────────────────────────────────
db.Deal = def('Deal', 'deals', {
    id: uuidPk,
    founder_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: false },
    pitch: { type: DataTypes.TEXT, allowNull: false },
    description: DataTypes.TEXT,
    problem: DataTypes.TEXT,
    solution: DataTypes.TEXT,
    business_model: DataTypes.TEXT,
    funding_required: num('funding_required'),
    expected_return: DataTypes.TEXT,
    stage: DataTypes.TEXT,
    category: DataTypes.TEXT,
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
}, bothTs);

db.DealInterest = def('DealInterest', 'deal_interests', {
    id: uuidPk,
    deal_id: { type: DataTypes.UUID, allowNull: false },
    investor_id: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    message: DataTypes.TEXT,
}, bothTs);

db.MemberApplication = def('MemberApplication', 'member_applications', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    full_name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false },
    role: { type: DataTypes.TEXT, allowNull: false },
    company: DataTypes.TEXT,
    bio: DataTypes.TEXT,
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    reviewer_note: DataTypes.TEXT,
}, bothTs);

// ── Elite circle ──────────────────────────────────────────────────────────────
db.EliteApplication = def('EliteApplication', 'elite_applications', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    full_name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false },
    role_title: DataTypes.TEXT,
    company: DataTypes.TEXT,
    bio: DataTypes.TEXT,
    linkedin_url: DataTypes.TEXT,
    proof_url: DataTypes.TEXT,
    invite_code: DataTypes.TEXT,
    reason_for_joining: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
}, bothTs);

db.EliteBadge = def('EliteBadge', 'elite_badges', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    badge_name: { type: DataTypes.TEXT, allowNull: false },
    badge_color: { type: DataTypes.TEXT, allowNull: false },
    tier: { type: DataTypes.TEXT, allowNull: false },
    earned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, createdOnly);

db.EliteLeaderboard = def('EliteLeaderboard', 'elite_leaderboard', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    username: { type: DataTypes.TEXT, allowNull: false },
    total_points: { type: DataTypes.INTEGER, defaultValue: 0 },
    threads_created: { type: DataTypes.INTEGER, defaultValue: 0 },
    upvotes_received: { type: DataTypes.INTEGER, defaultValue: 0 },
    engagement_score: num('engagement_score'),
    rank: DataTypes.INTEGER,
    badge: DataTypes.TEXT,
}, bothTs);

db.EliteSubscription = def('EliteSubscription', 'elite_subscriptions', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    tier: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
    started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expires_at: DataTypes.DATE,
}, bothTs);

// ── Notifications / activity / settings / analytics ───────────────────────────
db.Notification = def('Notification', 'notifications', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.TEXT, allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    link: DataTypes.TEXT,
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, createdOnly);

db.UserActivity = def('UserActivity', 'user_activities', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    activity_type: { type: DataTypes.TEXT, allowNull: false },
    metadata: DataTypes.JSONB,
}, createdOnly);

db.AppSetting = def('AppSetting', 'app_settings', {
    id: uuidPk,
    key: { type: DataTypes.TEXT, allowNull: false, unique: true },
    value: { type: DataTypes.JSONB, allowNull: false },
}, bothTs);

db.TagAnalyticsReport = def('TagAnalyticsReport', 'tag_analytics_reports', {
    id: uuidPk,
    report_type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'weekly' },
    period_start: { type: DataTypes.DATE, allowNull: false },
    period_end: { type: DataTypes.DATE, allowNull: false },
    report_data: { type: DataTypes.JSONB, allowNull: false },
}, createdOnly);

// ── Investors directory + intelligence ────────────────────────────────────────
db.Investor = def('Investor', 'investors', {
    id: uuidPk,
    user_id: DataTypes.UUID,
    name: { type: DataTypes.TEXT, allowNull: false },
    firm: DataTypes.TEXT,
    title: DataTypes.TEXT,
    avatar_url: DataTypes.TEXT,
    thesis: DataTypes.TEXT,
    focus_sectors: { type: DataTypes.JSONB, defaultValue: [] },
    stages: { type: DataTypes.JSONB, defaultValue: [] },
    check_min: num('check_min'),
    check_max: num('check_max'),
    location: DataTypes.TEXT,
    website: DataTypes.TEXT,
    linkedin_url: DataTypes.TEXT,
    portfolio: { type: DataTypes.JSONB, defaultValue: [] },
    deals_backed: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    // intelligence fields (migration 003)
    firm_type: DataTypes.STRING,
    region: DataTypes.STRING,
    headquarters: DataTypes.TEXT,
    aum_usd: num('aum_usd'),
    email: DataTypes.TEXT,
    phone: DataTypes.TEXT,
    enrichment_status: { type: DataTypes.STRING, defaultValue: 'enriched' },
    enrichment_confidence: DataTypes.STRING,
    dedupe_key: DataTypes.TEXT,
}, bothTs);

db.InvestorSocial = def('InvestorSocial', 'investor_socials', {
    id: uuidPk,
    investor_id: { type: DataTypes.UUID, allowNull: false },
    platform: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    handle: DataTypes.TEXT,
    followers: DataTypes.INTEGER,
    source: DataTypes.TEXT,
    last_checked_at: DataTypes.DATE,
}, createdOnly);

db.Investment = def('Investment', 'investments', {
    id: uuidPk,
    investor_id: { type: DataTypes.UUID, allowNull: false },
    target_company: { type: DataTypes.TEXT, allowNull: false },
    round: DataTypes.STRING,
    amount_usd: num('amount_usd'),
    invested_on: DataTypes.DATEONLY,
    source_url: DataTypes.TEXT,
    source_name: DataTypes.TEXT,
}, createdOnly);

db.InvestorNews = def('InvestorNews', 'investor_news', {
    id: uuidPk,
    investor_id: { type: DataTypes.UUID, allowNull: false },
    url: DataTypes.TEXT,
    headline: { type: DataTypes.TEXT, allowNull: false },
    summary: DataTypes.TEXT,
    source: DataTypes.STRING,
    sentiment: DataTypes.STRING,
    published_at: DataTypes.DATE,
}, createdOnly);

db.ConnectionRequest = def('ConnectionRequest', 'connection_requests', {
    id: uuidPk,
    from_user_id: { type: DataTypes.UUID, allowNull: false }, // founder
    investor_id: { type: DataTypes.UUID, allowNull: false },
    deal_id: DataTypes.UUID,
    message: DataTypes.TEXT,
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    response_message: DataTypes.TEXT,
}, bothTs);

db.Membership = def('Membership', 'memberships', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    plan: { type: DataTypes.STRING, defaultValue: 'founder' },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
    amount_usd: num('amount_usd'),
    currency: { type: DataTypes.STRING, defaultValue: 'USD' },
    payment_ref: DataTypes.TEXT,
    started_at: DataTypes.DATE,
    expires_at: DataTypes.DATE,
}, bothTs);

db.MemberConnection = def('MemberConnection', 'member_connections', {
    id: uuidPk,
    from_user_id: { type: DataTypes.UUID, allowNull: false },
    to_user_id: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    message: DataTypes.TEXT,
}, bothTs);

// ── Platform v2 ────────────────────────────────────────────────────────────────
db.CompanyMember = def('CompanyMember', 'company_members', {
    id: uuidPk,
    founder_id: { type: DataTypes.UUID, allowNull: false },
    member_user_id: DataTypes.UUID,
    name: { type: DataTypes.TEXT, allowNull: false },
    member_role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'team' },
    title: DataTypes.TEXT,
    avatar_url: DataTypes.TEXT,
    linkedin_url: DataTypes.TEXT,
    is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
}, createdOnly);

db.TractionMetric = def('TractionMetric', 'traction_metrics', {
    id: uuidPk,
    founder_id: { type: DataTypes.UUID, allowNull: false },
    metric_key: { type: DataTypes.STRING, allowNull: false },
    label: DataTypes.TEXT,
    value: { ...num('value'), allowNull: false },
    unit: DataTypes.STRING,
    as_of: DataTypes.DATEONLY,
    source: DataTypes.TEXT,
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, createdOnly);

db.Verification = def('Verification', 'verifications', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    evidence: { type: DataTypes.JSONB, defaultValue: {} },
    verified_at: DataTypes.DATE,
}, createdOnly);

db.DataRoomAccess = def('DataRoomAccess', 'data_room_access', {
    id: uuidPk,
    founder_id: { type: DataTypes.UUID, allowNull: false },
    investor_user_id: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'granted' },
    granted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expires_at: DataTypes.DATE,
}, createdOnly);

db.SavedStartup = def('SavedStartup', 'saved_startups', {
    id: uuidPk,
    investor_user_id: { type: DataTypes.UUID, allowNull: false },
    founder_id: { type: DataTypes.UUID, allowNull: false },
    list_name: { type: DataTypes.STRING, defaultValue: 'Watchlist' },
}, createdOnly);

db.InvestorPipeline = def('InvestorPipeline', 'investor_pipeline', {
    id: uuidPk,
    investor_user_id: { type: DataTypes.UUID, allowNull: false },
    founder_id: { type: DataTypes.UUID, allowNull: false },
    stage: { type: DataTypes.STRING, allowNull: false, defaultValue: 'sourced' },
    note: DataTypes.TEXT,
}, bothTs);

db.Payment = def('Payment', 'payments', {
    id: uuidPk,
    user_id: { type: DataTypes.UUID, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: false },
    tier: { type: DataTypes.STRING, allowNull: false },
    amount_usd: { ...num('amount_usd'), allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: 'USD' },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'created' },
    proration: { type: DataTypes.BOOLEAN, defaultValue: false },
    provider_order_id: DataTypes.TEXT,
    provider_ref: DataTypes.TEXT,
    meta: { type: DataTypes.JSONB, defaultValue: {} },
}, bothTs);

// Registry: table name -> model (used by the generic query engine).
db.byTable = {};
Object.values(db).forEach((m) => {
    if (m && m.tableName) db.byTable[m.tableName] = m;
});

module.exports = db;
