'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { parseImageDataUrl } = require('../utils/imageSafety');

// purpose -> who may upload it, and who may see it afterwards.
const PURPOSES = {
    profile_photo: { admin: false, visibility: 'restricted' }, // candidate photos: owner, admins, verified employers
    teacher_avatar: { admin: false, visibility: 'public' },
    club_image: { admin: true, visibility: 'public' },
    event_poster: { admin: true, visibility: 'public' },
};
const MEMBER_QUOTA = 12;
const ADMIN_QUOTA = 500;

async function upload(userId, isAdmin, { purpose, dataUrl }) {
    const rule = PURPOSES[purpose];
    if (!rule) throw new AppError('VALIDATION_ERROR', 'purpose: unknown upload type', 422);
    if (rule.admin && !isAdmin) throw new AppError('FORBIDDEN', 'Only admins can upload this kind of image', 403);
    const img = parseImageDataUrl(dataUrl);
    if (!img) throw new AppError('VALIDATION_ERROR', 'Use a JPEG, PNG or WebP image under 1 MB', 422);
    const owned = await db.MediaAsset.count({ where: { owner_id: userId } });
    if (owned >= (isAdmin ? ADMIN_QUOTA : MEMBER_QUOTA)) throw new AppError('QUOTA_EXCEEDED', 'You have reached your upload limit', 429);
    const row = await db.MediaAsset.create({
        owner_id: userId, purpose, visibility: rule.visibility, mime: img.mime, size_bytes: img.bytes.length, data: img.bytes,
    });
    return { id: row.id, path: `/media/${row.id}`, visibility: row.visibility, size: row.size_bytes };
}

// Returns the asset when `viewer` may see it, else throws a 404 (never reveals that it exists).
async function loadForViewer(id, viewer) {
    const row = await db.MediaAsset.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Not found', 404);
    if (row.visibility === 'public') return row;
    if (viewer.userId && (row.owner_id === viewer.userId || viewer.isAdmin)) return row;
    if (viewer.userId) {
        const employer = await db.NightEmployer.findOne({ where: { user_id: viewer.userId, status: 'verified' }, attributes: ['id'] });
        if (employer) return row;
    }
    throw new AppError('NOT_FOUND', 'Not found', 404);
}

module.exports = { upload, loadForViewer, PURPOSES };
