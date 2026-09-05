'use strict';
// mergeParams so :collection from the catch-all mount is visible here.
const router = require('express').Router({ mergeParams: true });
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');
const {
    listDocs, getDoc, createDoc, updateDoc, deleteDoc,
} = require('../controller/collectionController');

// Names that LOOK like a typed resource but are not the mounted path. Because this
// router is the trailing catch-all, a caller that guesses '/policies' instead of
// '/insurance_policies' gets a cheerful 200 with an empty list and writes into a
// generic document bucket — the failure mode that silently detached both the KYC
// and the insurance UIs from their real state machines. Fail loudly instead, and
// say where the real resource lives.
const SHADOWED = {
    policies: 'insurance_policies',
    claims: 'insurance_claims',
    insurance: 'insurance_policies',
    insurance_risk_thresholds: 'insurance_policies/quote',
    verifications: 'identity_verifications',
    verification_requests: 'identity_verifications',
    kyc: 'identity_verifications',
    shipments_tracking: 'tracking_search',
};

router.use((req, res, next) => {
    const real = SHADOWED[req.params.collection];
    if (!real) return next();
    return next(new AppError(
        'SHADOWED_COLLECTION',
        `'${req.params.collection}' is not a generic collection — use /v1/${real} instead.`,
        404,
    ));
});

router.get('/',       optionalAuth, listDocs);
router.get('/:id',    optionalAuth, getDoc);
router.post('/',      authMiddleware, createDoc);
router.put('/:id',    authMiddleware, updateDoc);
router.patch('/:id',  authMiddleware, updateDoc);
router.delete('/:id', authMiddleware, deleteDoc);

module.exports = router;
