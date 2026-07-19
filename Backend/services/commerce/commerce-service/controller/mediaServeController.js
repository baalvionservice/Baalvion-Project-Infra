'use strict';
// Decrypt-and-stream route for encrypted product media (see lib/encryption.js,
// service/productMediaService.js). Public/unauthenticated — same trust level as the plaintext
// static URLs it replaces for encrypted rows; encryption protects the object at rest, it is not
// an access-control boundary. Non-image media (never encrypted) and thumbnails (always plaintext)
// keep serving directly from storage/static hosting and never hit this route.
const mediaService = require('../service/productMediaService');

exports.serveMedia = async (req, res, next) => {
    try {
        const { buffer, contentType } = await mediaService.getMediaForServe(req.params.mediaId);
        res.setHeader('content-type', contentType);
        // Not CDN-cacheable at the edge the way a static object URL was — this is the documented
        // cost of encryption-at-rest for full-resolution images (see Phase 2 plan notes). A short
        // private cache still saves repeat same-viewer decrypts within a session.
        res.setHeader('cache-control', 'private, max-age=300');
        return res.status(200).send(buffer);
    } catch (err) { return next(err); }
};
