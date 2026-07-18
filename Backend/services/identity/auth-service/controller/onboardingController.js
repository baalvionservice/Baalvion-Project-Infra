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
const { sendMail } = require('../utils/mailer');

// Department slug (frontend) → organization type (auth schema).
const DEPARTMENT_TYPE = {
  enterprise: 'buyer',
  banking: 'bank',
  customs: 'customs_authority',
  logistics: 'logistics_provider',
  buyer: 'buyer',
  seller: 'seller',
  government: 'regulator',
};

// Contact-page inquiry subject → the department inbox that owns it.
const CONTACT_RECIPIENT = {
  onboarding: 'onboarding@baalvion.com',
  technical: 'support.integration@baalvion.com',
  governance: 'governance@baalvion.com',
  other: 'onboarding@baalvion.com',
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

const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/**
 * PUBLIC contact-form intake. No auth (a visitor has no session yet). Forwards
 * the inquiry by email to the department inbox the subject maps to — no DB
 * row, this mirrors the mailto: addresses the contact page already displays.
 */
exports.submitContactInquiry = async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = str(body.name, 200);
    if (!name) throw new AppError('VALIDATION_ERROR', 'Full name is required', 400);

    const email = str(body.email, 255);
    if (!isEmail(email)) throw new AppError('VALIDATION_ERROR', 'A valid email is required', 400);

    const institution = str(body.institution, 255) || 'Not provided';
    const subjectKey = str(body.subject, 40);
    const recipient = CONTACT_RECIPIENT[subjectKey] || CONTACT_RECIPIENT.other;

    const message = str(body.message, 4000);
    if (!message) throw new AppError('VALIDATION_ERROR', 'A message is required', 400);

    const html = `
      <p><strong>New institutional inquiry</strong></p>
      <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
         <strong>Email:</strong> ${escapeHtml(email)}<br/>
         <strong>Institution:</strong> ${escapeHtml(institution)}<br/>
         <strong>Subject:</strong> ${escapeHtml(subjectKey || 'other')}</p>
      <p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
    `;
    await sendMail({
      to: recipient,
      subject: `[Contact] ${institution} — ${subjectKey || 'inquiry'}`,
      html,
      text: `Name: ${name}\nEmail: ${email}\nInstitution: ${institution}\nSubject: ${subjectKey || 'other'}\n\n${message}`,
    });

    sendSuccess(req, res, { received: true }, 201);
  } catch (err) { next(err); }
};
