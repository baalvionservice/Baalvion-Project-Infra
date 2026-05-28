const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

// ─── Helpers ────────────────────────────────────────────────────────────────

const paginate = (page, limit) => ({ offset: (page - 1) * limit, limit });

const slugify = (title) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── Articles ────────────────────────────────────────────────────────────────

const listArticles = async ({ page, limit, status, category, author_id, orgId }) => {
    const where = {};
    if (status) where.status = status;
    else where.status = 'published';
    if (category) where.category = category;
    if (author_id) where.author_id = author_id;

    const { count, rows } = await db.Article.findAndCountAll({
        where,
        order: [['published_at', 'DESC NULLS LAST'], ['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createArticle = async (data, userId, orgId) => {
    const slug = data.slug || slugify(data.title);
    const existing = await db.Article.findOne({ where: { slug } });
    if (existing) throw new AppError('CONFLICT', 'Article with this slug already exists', 409);
    return db.Article.create({ ...data, slug, author_id: userId, org_id: orgId });
};

const getArticle = async (id) => {
    const article = await db.Article.findByPk(id);
    if (!article) throw new AppError('NOT_FOUND', 'Article not found', 404);
    await article.increment('views_count');
    return article;
};

const updateArticle = async (id, data, userId) => {
    const article = await db.Article.findByPk(id);
    if (!article) throw new AppError('NOT_FOUND', 'Article not found', 404);
    if (String(article.author_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this article', 403);
    return article.update(data);
};

const deleteArticle = async (id, userId) => {
    const article = await db.Article.findByPk(id);
    if (!article) throw new AppError('NOT_FOUND', 'Article not found', 404);
    if (String(article.author_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this article', 403);
    await article.destroy();
    return { deleted: true };
};

const publishArticle = async (id, userId) => {
    const article = await db.Article.findByPk(id);
    if (!article) throw new AppError('NOT_FOUND', 'Article not found', 404);
    if (String(article.author_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this article', 403);
    if (article.status === 'published') throw new AppError('BAD_REQUEST', 'Article already published', 400);
    return article.update({ status: 'published', published_at: new Date() });
};

// ─── Market Assets ────────────────────────────────────────────────────────────

const listAssets = async ({ page, limit, search, asset_type, is_active }) => {
    const where = {};
    if (typeof is_active !== 'undefined') where.is_active = is_active !== 'false';
    else where.is_active = true;
    if (asset_type) where.asset_type = asset_type;
    if (search) {
        where[Op.or] = [
            { symbol: { [Op.iLike]: `%${search}%` } },
            { name: { [Op.iLike]: `%${search}%` } },
        ];
    }
    const { count, rows } = await db.MarketAsset.findAndCountAll({
        where,
        order: [['symbol', 'ASC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const getAssetBySymbol = async (symbol) => {
    const asset = await db.MarketAsset.findOne({
        where: { symbol: symbol.toUpperCase() },
        include: [{ model: db.AssetSummary, as: 'summaries', limit: 3, order: [['created_at', 'DESC']] }],
    });
    if (!asset) throw new AppError('NOT_FOUND', 'Asset not found', 404);
    return asset;
};

const createAsset = async (data) => {
    const existing = await db.MarketAsset.findOne({ where: { symbol: data.symbol.toUpperCase() } });
    if (existing) throw new AppError('CONFLICT', 'Asset with this symbol already exists', 409);
    return db.MarketAsset.create({ ...data, symbol: data.symbol.toUpperCase() });
};

const listSummariesForAsset = async (symbol, { page, limit }) => {
    const asset = await db.MarketAsset.findOne({ where: { symbol: symbol.toUpperCase() } });
    if (!asset) throw new AppError('NOT_FOUND', 'Asset not found', 404);
    const { count, rows } = await db.AssetSummary.findAndCountAll({
        where: { asset_id: asset.id },
        order: [['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

// ─── Asset Summaries ─────────────────────────────────────────────────────────

const createSummary = async (data, userId) => {
    const asset = await db.MarketAsset.findByPk(data.asset_id);
    if (!asset) throw new AppError('NOT_FOUND', 'Asset not found', 404);
    return db.AssetSummary.create({ ...data, analyst_id: userId });
};

const getSummary = async (id) => {
    const summary = await db.AssetSummary.findByPk(id, {
        include: [{ model: db.MarketAsset, as: 'asset' }],
    });
    if (!summary) throw new AppError('NOT_FOUND', 'Summary not found', 404);
    await summary.increment('views_count');
    return summary;
};

const updateSummary = async (id, data, userId) => {
    const summary = await db.AssetSummary.findByPk(id);
    if (!summary) throw new AppError('NOT_FOUND', 'Summary not found', 404);
    if (String(summary.analyst_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this summary', 403);
    return summary.update(data);
};

// ─── Community Posts ──────────────────────────────────────────────────────────

const listPosts = async ({ page, limit, post_type, asset_id, author_id }) => {
    const where = { status: 'published' };
    if (post_type) where.post_type = post_type;
    if (asset_id) where.asset_id = asset_id;
    if (author_id) where.author_id = author_id;
    const { count, rows } = await db.CommunityPost.findAndCountAll({
        where,
        order: [['is_pinned', 'DESC'], ['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createPost = async (data, userId, orgId) => {
    return db.CommunityPost.create({ ...data, author_id: userId, org_id: orgId });
};

const getPost = async (id) => {
    const post = await db.CommunityPost.findByPk(id, {
        include: [{ model: db.Comment, as: 'comments', where: { parent_id: null, status: 'published' }, required: false, limit: 20, order: [['created_at', 'ASC']] }],
    });
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    await post.increment('views_count');
    return post;
};

const updatePost = async (id, data, userId) => {
    const post = await db.CommunityPost.findByPk(id);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    if (String(post.author_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this post', 403);
    return post.update(data);
};

const deletePost = async (id, userId) => {
    const post = await db.CommunityPost.findByPk(id);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    if (String(post.author_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this post', 403);
    await post.update({ status: 'deleted' });
    return { deleted: true };
};

const voteOnPost = async (postId, userId, vote_type) => {
    const post = await db.CommunityPost.findByPk(postId);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);

    const existing = await db.Vote.findOne({
        where: { user_id: userId, target_type: 'post', target_id: postId },
    });

    if (existing) {
        if (existing.vote_type === vote_type) {
            // Undo vote
            await existing.destroy();
            const delta = vote_type === 'up' ? -1 : 0;
            const downDelta = vote_type === 'down' ? -1 : 0;
            await post.decrement(vote_type === 'up' ? 'upvotes_count' : 'downvotes_count');
            return { action: 'removed', vote_type };
        }
        // Switch vote
        await existing.update({ vote_type });
        if (vote_type === 'up') {
            await post.increment('upvotes_count');
            await post.decrement('downvotes_count');
        } else {
            await post.increment('downvotes_count');
            await post.decrement('upvotes_count');
        }
        return { action: 'switched', vote_type };
    }

    await db.Vote.create({ user_id: userId, target_type: 'post', target_id: postId, vote_type });
    await post.increment(vote_type === 'up' ? 'upvotes_count' : 'downvotes_count');
    return { action: 'added', vote_type };
};

const listComments = async (postId, { page, limit }) => {
    const post = await db.CommunityPost.findByPk(postId);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    const { count, rows } = await db.Comment.findAndCountAll({
        where: { post_id: postId, parent_id: null, status: 'published' },
        order: [['created_at', 'ASC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const addComment = async (postId, data, userId) => {
    const post = await db.CommunityPost.findByPk(postId);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    if (data.parent_id) {
        const parent = await db.Comment.findByPk(data.parent_id);
        if (!parent || String(parent.post_id) !== String(postId))
            throw new AppError('NOT_FOUND', 'Parent comment not found', 404);
    }
    const comment = await db.Comment.create({ ...data, post_id: postId, author_id: userId });
    await post.increment('comments_count');
    return comment;
};

// ─── Creator Profiles ─────────────────────────────────────────────────────────

const listCreators = async ({ page, limit, verified }) => {
    const where = {};
    if (typeof verified !== 'undefined') where.verified = verified !== 'false';
    const { count, rows } = await db.CreatorProfile.findAndCountAll({
        where,
        order: [['followers_count', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const getCreator = async (id) => {
    const profile = await db.CreatorProfile.findByPk(id);
    if (!profile) throw new AppError('NOT_FOUND', 'Creator not found', 404);
    return profile;
};

const getCreatorArticles = async (id, { page, limit }) => {
    const profile = await db.CreatorProfile.findByPk(id);
    if (!profile) throw new AppError('NOT_FOUND', 'Creator not found', 404);
    return listArticles({ page, limit, author_id: profile.user_id, status: 'published' });
};

const upsertCreatorProfile = async (data, userId) => {
    const [profile, created] = await db.CreatorProfile.findOrCreate({
        where: { user_id: userId },
        defaults: { ...data, user_id: userId },
    });
    if (!created) await profile.update(data);
    return profile.reload();
};

// ─── Calculators ─────────────────────────────────────────────────────────────

const calcCompoundInterest = ({ principal, rate, years, compounding_frequency }) => {
    const n = compounding_frequency;
    const r = rate / 100;
    const amount = principal * Math.pow(1 + r / n, n * years);
    const interest = amount - principal;
    return {
        principal,
        rate,
        years,
        compounding_frequency: n,
        future_value: parseFloat(amount.toFixed(2)),
        total_interest: parseFloat(interest.toFixed(2)),
    };
};

const calcRetirement = ({ current_age, retirement_age, monthly_savings, current_savings, expected_return_rate, inflation_rate }) => {
    const years = retirement_age - current_age;
    const monthlyRate = expected_return_rate / 100 / 12;
    const months = years * 12;
    // Future value of current savings
    const fvCurrentSavings = current_savings * Math.pow(1 + expected_return_rate / 100, years);
    // Future value of monthly contributions
    const fvContributions = monthly_savings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const total = fvCurrentSavings + fvContributions;
    // Real value adjusted for inflation
    const realValue = total / Math.pow(1 + inflation_rate / 100, years);
    return {
        current_age,
        retirement_age,
        years_to_retirement: years,
        future_corpus: parseFloat(total.toFixed(2)),
        inflation_adjusted_corpus: parseFloat(realValue.toFixed(2)),
        total_contributed: parseFloat((monthly_savings * months + current_savings).toFixed(2)),
    };
};

const calcLoan = ({ principal, annual_rate, tenure_months }) => {
    const r = annual_rate / 100 / 12;
    const n = tenure_months;
    const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total_payment = emi * n;
    const total_interest = total_payment - principal;
    return {
        principal,
        annual_rate,
        tenure_months,
        emi: parseFloat(emi.toFixed(2)),
        total_payment: parseFloat(total_payment.toFixed(2)),
        total_interest: parseFloat(total_interest.toFixed(2)),
    };
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────

const getLeaderboard = async (period = 'weekly', { page, limit }) => {
    const validPeriods = ['daily', 'weekly', 'monthly', 'all_time'];
    if (!validPeriods.includes(period))
        throw new AppError('BAD_REQUEST', 'Invalid period. Use daily, weekly, monthly, or all_time', 400);
    const { count, rows } = await db.LeaderboardEntry.findAndCountAll({
        where: { period },
        order: [['rank', 'ASC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, period, items: rows };
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getContentAnalytics = async (orgId) => {
    const [totalArticles, publishedArticles, totalPosts, totalViews] = await Promise.all([
        db.Article.count({ where: { org_id: orgId } }),
        db.Article.count({ where: { org_id: orgId, status: 'published' } }),
        db.CommunityPost.count({ where: { org_id: orgId } }),
        db.Article.sum('views_count', { where: { org_id: orgId } }),
    ]);
    return {
        total_articles: totalArticles,
        published_articles: publishedArticles,
        draft_articles: totalArticles - publishedArticles,
        total_posts: totalPosts,
        total_views: totalViews || 0,
    };
};

module.exports = {
    listArticles, createArticle, getArticle, updateArticle, deleteArticle, publishArticle,
    listAssets, getAssetBySymbol, createAsset, listSummariesForAsset,
    createSummary, getSummary, updateSummary,
    listPosts, createPost, getPost, updatePost, deletePost, voteOnPost, listComments, addComment,
    listCreators, getCreator, getCreatorArticles, upsertCreatorProfile,
    calcCompoundInterest, calcRetirement, calcLoan,
    getLeaderboard,
    getContentAnalytics,
};
