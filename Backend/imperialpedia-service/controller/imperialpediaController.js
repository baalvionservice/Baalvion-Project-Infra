const {
    paginationSchema,
    createArticleSchema,
    updateArticleSchema,
    createAssetSchema,
    createSummarySchema,
    updateSummarySchema,
    createPostSchema,
    updatePostSchema,
    createCommentSchema,
    voteSchema,
    creatorProfileSchema,
    compoundInterestSchema,
    retirementSchema,
    loanSchema,
} = require('../validators/schemas');
const svc = require('../service/imperialpediaService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');

// ─── Articles ────────────────────────────────────────────────────────────────

const listArticles = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { status, category, author_id } = req.query;
        const data = await svc.listArticles({ page, limit, status, category, author_id });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createArticle = async (req, res, next) => {
    try {
        const body = createArticleSchema.parse(req.body);
        const article = await svc.createArticle(body, req.user.id, req.user.orgId);
        return sendSuccess(req, res, article, 201);
    } catch (e) { return next(e); }
};

const getArticle = async (req, res, next) => {
    try {
        const article = await svc.getArticle(req.params.id);
        return sendSuccess(req, res, article);
    } catch (e) { return next(e); }
};

const updateArticle = async (req, res, next) => {
    try {
        const body = updateArticleSchema.parse(req.body);
        const article = await svc.updateArticle(req.params.id, body, req.user.id);
        return sendSuccess(req, res, article);
    } catch (e) { return next(e); }
};

const deleteArticle = async (req, res, next) => {
    try {
        const result = await svc.deleteArticle(req.params.id, req.user.id);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

const publishArticle = async (req, res, next) => {
    try {
        const article = await svc.publishArticle(req.params.id, req.user.id);
        return sendSuccess(req, res, article);
    } catch (e) { return next(e); }
};

// ─── Market Assets ────────────────────────────────────────────────────────────

const listAssets = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { search, asset_type, is_active } = req.query;
        const data = await svc.listAssets({ page, limit, search, asset_type, is_active });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const getAsset = async (req, res, next) => {
    try {
        const asset = await svc.getAssetBySymbol(req.params.symbol);
        return sendSuccess(req, res, asset);
    } catch (e) { return next(e); }
};

const createAsset = async (req, res, next) => {
    try {
        const body = createAssetSchema.parse(req.body);
        const asset = await svc.createAsset(body);
        return sendSuccess(req, res, asset, 201);
    } catch (e) { return next(e); }
};

const listAssetSummaries = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.listSummariesForAsset(req.params.symbol, { page, limit });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

// ─── Asset Summaries ─────────────────────────────────────────────────────────

const createSummary = async (req, res, next) => {
    try {
        const body = createSummarySchema.parse(req.body);
        const summary = await svc.createSummary(body, req.user.id);
        return sendSuccess(req, res, summary, 201);
    } catch (e) { return next(e); }
};

const getSummary = async (req, res, next) => {
    try {
        const summary = await svc.getSummary(req.params.id);
        return sendSuccess(req, res, summary);
    } catch (e) { return next(e); }
};

const updateSummary = async (req, res, next) => {
    try {
        const body = updateSummarySchema.parse(req.body);
        const summary = await svc.updateSummary(req.params.id, body, req.user.id);
        return sendSuccess(req, res, summary);
    } catch (e) { return next(e); }
};

// ─── Community Posts ──────────────────────────────────────────────────────────

const listPosts = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { post_type, asset_id, author_id } = req.query;
        const data = await svc.listPosts({ page, limit, post_type, asset_id, author_id });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createPost = async (req, res, next) => {
    try {
        const body = createPostSchema.parse(req.body);
        const post = await svc.createPost(body, req.user.id, req.user.orgId);
        return sendSuccess(req, res, post, 201);
    } catch (e) { return next(e); }
};

const getPost = async (req, res, next) => {
    try {
        const post = await svc.getPost(req.params.id);
        return sendSuccess(req, res, post);
    } catch (e) { return next(e); }
};

const updatePost = async (req, res, next) => {
    try {
        const body = updatePostSchema.parse(req.body);
        const post = await svc.updatePost(req.params.id, body, req.user.id);
        return sendSuccess(req, res, post);
    } catch (e) { return next(e); }
};

const deletePost = async (req, res, next) => {
    try {
        const result = await svc.deletePost(req.params.id, req.user.id);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

const voteOnPost = async (req, res, next) => {
    try {
        const { vote_type } = voteSchema.parse(req.body);
        const result = await svc.voteOnPost(req.params.id, req.user.id, vote_type);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

const listComments = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.listComments(req.params.id, { page, limit });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const addComment = async (req, res, next) => {
    try {
        const body = createCommentSchema.parse(req.body);
        const comment = await svc.addComment(req.params.id, body, req.user.id);
        return sendSuccess(req, res, comment, 201);
    } catch (e) { return next(e); }
};

// ─── Creators ─────────────────────────────────────────────────────────────────

const listCreators = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { verified } = req.query;
        const data = await svc.listCreators({ page, limit, verified });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const getCreator = async (req, res, next) => {
    try {
        const profile = await svc.getCreator(req.params.id);
        return sendSuccess(req, res, profile);
    } catch (e) { return next(e); }
};

const getCreatorArticles = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.getCreatorArticles(req.params.id, { page, limit });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const upsertCreatorProfile = async (req, res, next) => {
    try {
        const body = creatorProfileSchema.parse(req.body);
        const profile = await svc.upsertCreatorProfile(body, req.user.id);
        return sendSuccess(req, res, profile);
    } catch (e) { return next(e); }
};

// ─── Calculators ─────────────────────────────────────────────────────────────

const calcCompoundInterest = async (req, res, next) => {
    try {
        const body = compoundInterestSchema.parse(req.body);
        const result = svc.calcCompoundInterest(body);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

const calcRetirement = async (req, res, next) => {
    try {
        const body = retirementSchema.parse(req.body);
        const result = svc.calcRetirement(body);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

const calcLoan = async (req, res, next) => {
    try {
        const body = loanSchema.parse(req.body);
        const result = svc.calcLoan(body);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────

const getLeaderboard = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { period } = req.query;
        const data = await svc.getLeaderboard(period, { page, limit });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getContentAnalytics = async (req, res, next) => {
    try {
        const data = await svc.getContentAnalytics(req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (e) { return next(e); }
};

module.exports = {
    listArticles, createArticle, getArticle, updateArticle, deleteArticle, publishArticle,
    listAssets, getAsset, createAsset, listAssetSummaries,
    createSummary, getSummary, updateSummary,
    listPosts, createPost, getPost, updatePost, deletePost, voteOnPost, listComments, addComment,
    listCreators, getCreator, getCreatorArticles, upsertCreatorProfile,
    calcCompoundInterest, calcRetirement, calcLoan,
    getLeaderboard,
    getContentAnalytics,
};
