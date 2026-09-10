'use strict';
const authorService = require('../service/authorService');
const revalidateService = require('../service/revalidateService');
const { sendSuccess } = require('../utils/response');

// Author edits never triggered a revalidation, so on an ISR frontend a corrected
// bio sat behind the cache until the route's TTL expired — a day on
// Imperialpedia's /authors and /authors/[slug]. Found the hard way: 18 bios were
// corrected in the database and the live masthead kept serving the old text.
// Author records surface on the roster, on each profile page, and as bylines on
// every article, so the site-wide CMS cache tag (which /api/revalidate drops on
// any call) is what actually matters here; the paths just make the intent legible
// in logs. Fire-and-forget and fail-open, same as the content publish path.
function revalidateAuthorPages(websiteId, author) {
    const paths = ['/authors', '/'];
    if (author && author.slug) paths.push(`/authors/${author.slug}`);
    revalidateService.dispatch(websiteId, { paths });
}

const listAuthors = async (req, res, next) => {
    try {
        const authors = await authorService.listAuthors(req.params.websiteId);
        return sendSuccess(req, res, authors);
    } catch (err) { return next(err); }
};

const createAuthor = async (req, res, next) => {
    try {
        const author = await authorService.createAuthor(req.params.websiteId, req.validated);
        revalidateAuthorPages(req.params.websiteId, author);
        return sendSuccess(req, res, author, 201);
    } catch (err) { return next(err); }
};

const updateAuthor = async (req, res, next) => {
    try {
        const author = await authorService.updateAuthor(req.params.websiteId, req.params.authorId, req.validated);
        revalidateAuthorPages(req.params.websiteId, author);
        return sendSuccess(req, res, author);
    } catch (err) { return next(err); }
};

const deleteAuthor = async (req, res, next) => {
    try {
        await authorService.deleteAuthor(req.params.websiteId, req.params.authorId);
        revalidateAuthorPages(req.params.websiteId, null);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

module.exports = { listAuthors, createAuthor, updateAuthor, deleteAuthor };
