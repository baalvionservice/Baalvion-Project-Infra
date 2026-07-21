'use strict';
const { CommerceSellerApplication } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const storeService = require('./storeService');
const config = require('../config/appConfig');

/**
 * Self-service seller onboarding entry point. Any authenticated user may submit — actual
 * store creation still requires super_admin/country_admin approval (createStore's
 * canAdministerCountry check is NOT bypassed; approveApplication runs it via storeService).
 */
async function createApplication(authCtx, body) {
    if (!authCtx.userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    if (!authCtx.orgId) throw new AppError('BAD_REQUEST', 'orgId is required on the caller identity', 400);

    const existingPending = await CommerceSellerApplication.findOne({
        where: { applicantUserId: authCtx.userId, status: 'pending' },
    });
    if (existingPending) throw new AppError('CONFLICT', 'You already have a pending seller application', 409);

    const application = await CommerceSellerApplication.create({
        ...body,
        applicantUserId: authCtx.userId,
        applicantOrgId: authCtx.orgId,
    });
    return application.toJSON();
}

async function listMyApplications(userId) {
    const applications = await CommerceSellerApplication.findAll({
        where: { applicantUserId: userId },
        order: [['createdAt', 'DESC']],
    });
    return applications.map((a) => a.toJSON());
}

async function listApplications(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = {};
    if (query.status) where.status = query.status;
    const { rows, count } = await CommerceSellerApplication.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
    });
    return buildPaginated(rows, count, { page, limit });
}

async function getApplication(id) {
    const application = await CommerceSellerApplication.findByPk(id);
    if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);
    return application.toJSON();
}

/**
 * Approve: grants the ORIGINAL APPLICANT team roles on the platform's single shared
 * marketplace store (config.marketplace.defaultStoreId) — NOT a new store of their own.
 *
 * Market Underworld's public storefront/cart/checkout are all hardcoded to one store id
 * (see market-underworld's MARKET_UNDERWORLD_STORE_ID); a seller who got their own separate
 * store would be invisible to every buyer, since nothing in the storefront queries across
 * multiple stores. Every approved seller instead becomes a team member of that one shared
 * catalog: `product_manager` (create/edit/publish/delete listings — capability 80, below
 * store_admin's 100, so they can never touch store settings or the team roster) plus
 * `ops_manager` (fulfil orders for what they sell). Cross-seller tampering on the shared
 * catalog is blocked separately by requireProductOwner (commerceAccess.js) on every
 * product-mutating route — a product_manager can only touch products where
 * createdBy === their own user id.
 */
async function approveApplication(authCtx, applicationId) {
    const application = await CommerceSellerApplication.findByPk(applicationId);
    if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);
    if (application.status !== 'pending') throw new AppError('CONFLICT', `Application is already ${application.status}`, 409);

    const storeId = config.marketplace.defaultStoreId;
    await storeService.addMember(storeId, { userId: application.applicantUserId, role: 'product_manager' }, authCtx.token);
    await storeService.addMember(storeId, { userId: application.applicantUserId, role: 'ops_manager' }, authCtx.token);

    await application.update({
        status: 'approved',
        reviewedBy: authCtx.userId,
        reviewedAt: new Date(),
        createdStoreId: storeId,
    });
    return { application: application.toJSON(), storeId };
}

// Admin marks the applicant's submitted identity info (legalFullName/dateOfBirth/phoneNumber) as
// manually verified. Independent of approve/reject — an admin can verify identity and approve in
// either order, or approve without explicitly toggling this if they've confirmed it out of band.
async function verifyIdentity(applicationId) {
    const application = await CommerceSellerApplication.findByPk(applicationId);
    if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);
    await application.update({ identityVerified: true });
    return application.toJSON();
}

async function rejectApplication(authCtx, applicationId, reason) {
    const application = await CommerceSellerApplication.findByPk(applicationId);
    if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);
    if (application.status !== 'pending') throw new AppError('CONFLICT', `Application is already ${application.status}`, 409);

    await application.update({
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: authCtx.userId,
        reviewedAt: new Date(),
    });
    return application.toJSON();
}

module.exports = { createApplication, listMyApplications, listApplications, getApplication, approveApplication, rejectApplication, verifyIdentity };
