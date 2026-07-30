'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { loadOwnedCase } = require('../utils/caseAccess');

const listNotes = async (req, res, next) => {
    try {
        const { error } = await loadOwnedCase(req);
        if (error) return next(error);
        const notes = await db.CaseNote.findAll({
            where: { case_id: req.params.id },
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, notes);
    } catch (err) { return next(err); }
};

const createNote = async (req, res, next) => {
    try {
        const { error, legalCase } = await loadOwnedCase(req);
        if (error) return next(error);
        const { text, tags, isPrivate } = req.body || {};
        if (!text || !String(text).trim()) return next(new AppError('VALIDATION_ERROR', 'text is required', 422));
        const note = await db.CaseNote.create({
            case_id: legalCase.id,
            author_id: req.user.id,
            text: String(text).trim(),
            tags: Array.isArray(tags) ? tags : [],
            is_private: isPrivate !== false,
        });
        return sendSuccess(req, res, note, 201);
    } catch (err) { return next(err); }
};

const deleteNote = async (req, res, next) => {
    try {
        const { error } = await loadOwnedCase(req);
        if (error) return next(error);
        const note = await db.CaseNote.findOne({ where: { id: req.params.noteId, case_id: req.params.id } });
        if (!note) return next(new AppError('NOT_FOUND', 'Note not found', 404));
        await note.destroy();
        return sendSuccess(req, res, { success: true });
    } catch (err) { return next(err); }
};

module.exports = { listNotes, createNote, deleteNote };
