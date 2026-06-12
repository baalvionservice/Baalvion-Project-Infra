'use strict';
/**
 * @file onboardingController.js
 * @description PUBLIC onboarding intake. A visitor who completes a department
 * onboarding wizard on the frontend submits here. We create an organization in
 * the `pending` state with no owner — it surfaces in the platform-owner review
 * queue (GET /platform/organizations?status=pending) for manual approval.
 *
 * SECURITY: unauthenticated by design (the applicant has no session yet). It can
 * only create a PENDING org — it never grants access, never sets an owner, and
 * never activates. Activation happens only via the authenticated platform queue.
 */

const { orgRepo } = require('../repositories');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// Department slug (frontend) → organization type (auth schema).
const DEPARTMENT_TYPE = {
  enterprise: 'buyer',
  banking: 'bank',
  customs: 'customs_authority',
  logistics: 'logistics_provider',
};

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);

exports.submitApplication = async (req, res, next) => {
  try {
    const body = req.body || {};
    const department = str(body.department, 40);
    const type = DEPARTMENT_TYPE[department];
    if (!type) throw new AppError('VALIDATION_ERROR', 'Unknown onboarding department', 400);

    const organizationName = str(body.organizationName, 255);
    if (!organizationName) throw new AppError('VALIDATION_ERROR', 'Organization name is required', 400);

    const contactEmail = str(body.contactEmail, 255);
    if (!isEmail(contactEmail)) throw new AppError('VALIDATION_ERROR', 'A valid contact email is required', 400);

    const org = await orgRepo.createWithProfile({
      name: organizationName,
      type,
      ownerId: null,
      legalName: str(body.legalName, 255) || organizationName,
      displayName: str(body.contactName, 255) || null,
      jurisdiction: str(body.jurisdiction, 120) || null,
      contactEmail,
      contactPhone: str(body.contactPhone, 40) || null,
      status: 'pending',
    });

    // The reference the applicant tracks; access is granted only after review.
    sendSuccess(req, res, {
      applicationId: org.id,
      reference: org.slug,
      status: 'pending',
      department,
    }, 201);
  } catch (err) { next(err); }
};
