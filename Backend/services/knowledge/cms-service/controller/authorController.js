'use strict';
const authorService = require('../service/authorService');
const { sendSuccess } = require('../utils/response');

const listAuthors = async (req, res, next) => {
    try {
        const authors = await authorService.listAuthors(req.params.websiteId);
        return sendSuccess(req, res, authors);
    } catch (err) { return next(err); }
};

const createAuthor = async (req, res, next) => {
    try {
        const author = await authorService.createAuthor(req.params.websiteId, req.validated);
        return sendSuccess(req, res, author, 201);
    } catch (err) { return next(err); }
};

const updateAuthor = async (req, res, next) => {
    try {
        const author = await authorService.updateAuthor(req.params.websiteId, req.params.authorId, req.validated);
        return sendSuccess(req, res, author);
    } catch (err) { return next(err); }
};

const deleteAuthor = async (req, res, next) => {
    try {
        await authorService.deleteAuthor(req.params.websiteId, req.params.authorId);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

module.exports = { listAuthors, createAuthor, updateAuthor, deleteAuthor };
