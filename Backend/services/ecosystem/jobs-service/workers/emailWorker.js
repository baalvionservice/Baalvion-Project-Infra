'use strict';
const { Worker } = require('bullmq');
const nodemailer  = require('nodemailer');
const redisConnection = require('../config/redis');
const { createEmailService, isSesConfigured, loadConfig, htmlToText } = require('@baalvion/email');

// Amazon SES (preferred). Job notifications leave the verified `notifications` sender when AWS
// credentials are configured; otherwise the existing SMTP / dev-json transport is used.
const SES_ENABLED = isSesConfigured(loadConfig());
let _emailService = null;
function emailService() {
    if (!_emailService) _emailService = createEmailService({ logger: console });
    return _emailService;
}

// SMTP auth is optional — dev catchers (Mailpit/MailHog) accept mail with no credentials.
const SMTP_CONFIGURED = !!process.env.SMTP_HOST;

let transporter;
if (SMTP_CONFIGURED) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        ...(process.env.SMTP_USER && process.env.SMTP_PASS
            ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
            : {}),
    });
} else {
    // No SMTP host: log emails to console.
    transporter = nodemailer.createTransport({ jsonTransport: true });
}

const FROM = process.env.EMAIL_FROM || 'noreply@baalvion.com';

// ── Email templates ───────────────────────────────────────────────────────────

const APP_URL = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://jobs.baalvion.com';
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// One shell for every notification, so the Candidate ID is impossible to forget: it
// sits in the footer of every mail we send, which is what makes it useful as a
// reference when someone writes back.
function shell({ heading, body, cta, referenceCode }) {
    const button = cta
        ? `<p style="margin:28px 0"><a href="${esc(cta.href)}" style="background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;display:inline-block;font-weight:600">${esc(cta.label)}</a></p>`
        : '';
    const ref = referenceCode
        ? `<p style="margin:0;color:#6b7280;font-size:13px">Your Candidate ID is <strong style="color:#111827;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${esc(referenceCode)}</strong> — quote it if you reply to this email.</p>`
        : '';
    return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111827;line-height:1.6">
  <h1 style="font-size:20px;margin:0 0 20px">${esc(heading)}</h1>
  ${body}
  ${button}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px">
  ${ref}
  <p style="margin:8px 0 0;color:#9ca3af;font-size:12px">Baalvion Industries Pvt Ltd · TalentOS</p>
</div>`;
}

const STATUS_COPY = {
    applied:   'received and queued for review',
    screening: 'moved to screening',
    interview: 'moved to the interview stage',
    offer:     'moved to offer',
    hired:     'marked as hired — congratulations',
    rejected:  'closed. We will not be moving forward this time',
    withdrawn: 'withdrawn at your request',
};

const PROJECT_STATUS_COPY = {
    submitted:   'received',
    shortlisted: 'shortlisted',
    accepted:    'accepted — congratulations',
    rejected:    'closed. They have gone another way this time',
};

const templates = {
    'application.submitted': (d) => ({
        subject: `Application received — ${d.jobTitle}`,
        html: shell({
            heading: 'We have your application',
            body: `<p>Hi ${esc(d.candidateName)},</p>
                   <p>Your application for <strong>${esc(d.jobTitle)}</strong> at <strong>${esc(d.companyName)}</strong> has been received. You can follow every stage of it — and message the hiring team — from your dashboard.</p>`,
            cta: { label: 'Track your application', href: `${APP_URL}/my-account` },
            referenceCode: d.referenceCode,
        }),
    }),
    'application.status_changed': (d) => ({
        subject: `Application update — ${d.jobTitle}`,
        html: shell({
            heading: 'Your application has moved',
            body: `<p>Hi ${esc(d.candidateName)},</p>
                   <p>Your application for <strong>${esc(d.jobTitle)}</strong> has been ${esc(STATUS_COPY[d.status] || `updated to ${d.status}`)}.</p>
                   ${d.notes ? `<p style="background:#f9fafb;border-left:3px solid #e5e7eb;padding:12px 16px;margin:16px 0">${esc(d.notes)}</p>` : ''}`,
            cta: { label: 'Open your dashboard', href: `${APP_URL}/my-account` },
            referenceCode: d.referenceCode,
        }),
    }),
    'employee.id_issued': (d) => ({
        subject: `Welcome to ${d.companyName} — your Employee ID`,
        html: shell({
            heading: `Welcome aboard, ${d.candidateName.split(' ')[0]}`,
            body: `<p>Your offer for <strong>${esc(d.jobTitle)}</strong> is confirmed and you are now on the ${esc(d.companyName)} roll.</p>
                   <p style="margin:20px 0;padding:16px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
                     <span style="display:block;color:#6b7280;font-size:12px;letter-spacing:.06em;text-transform:uppercase">Employee ID</span>
                     <strong style="font-size:22px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${esc(d.employeeCode)}</strong>
                   </p>
                   <p>Keep this number — it identifies you for onboarding, payroll and IT access.</p>`,
            cta: { label: 'View it on your dashboard', href: `${APP_URL}/my-account` },
            referenceCode: d.referenceCode,
        }),
    }),
    'message.received': (d) => ({
        subject: d.fromTeam
            ? `Message from ${d.companyName} — ${d.jobTitle}`
            : `New candidate message — ${d.candidateName} (${d.jobTitle})`,
        html: shell({
            heading: d.fromTeam ? 'You have a new message' : `${d.candidateName} replied`,
            body: `<p>${d.fromTeam
                        ? `The hiring team at <strong>${esc(d.companyName)}</strong> sent you a message about <strong>${esc(d.jobTitle)}</strong>.`
                        : `<strong>${esc(d.candidateName)}</strong> ${d.referenceCode ? `(${esc(d.referenceCode)}) ` : ''}wrote about <strong>${esc(d.jobTitle)}</strong>.`}</p>
                   <blockquote style="margin:16px 0;padding:12px 16px;background:#f9fafb;border-left:3px solid #111827;white-space:pre-wrap">${esc(d.body)}</blockquote>`,
            cta: {
                label: d.fromTeam ? 'Read and reply' : 'Open in the ATS',
                href: d.fromTeam ? `${APP_URL}/my-account/applications/${d.applicationId}` : `${APP_URL}/applications`,
            },
            referenceCode: d.fromTeam ? d.referenceCode : null,
        }),
    }),
    'interview.scheduled': (d) => ({
        subject: `Interview scheduled — ${d.jobTitle}`,
        html: shell({
            heading: 'Your interview is booked',
            body: `<p>Hi ${esc(d.candidateName)},</p>
                   <p>Your interview for <strong>${esc(d.jobTitle)}</strong> is scheduled for <strong>${esc(d.scheduledAt)}</strong>.</p>
                   ${d.meetingUrl ? `<p>Join link: <a href="${esc(d.meetingUrl)}">${esc(d.meetingUrl)}</a></p>` : ''}`,
            cta: { label: 'See the details', href: `${APP_URL}/my-account` },
            referenceCode: d.referenceCode,
        }),
    }),
    'interview.reminder': (d) => ({
        subject: `Reminder: your interview tomorrow — ${d.jobTitle}`,
        html: shell({
            heading: 'Interview tomorrow',
            body: `<p>Hi ${esc(d.candidateName)},</p>
                   <p>A reminder that your interview for <strong>${esc(d.jobTitle)}</strong> is tomorrow at <strong>${esc(d.scheduledAt)}</strong>.</p>
                   ${d.meetingUrl ? `<p>Join link: <a href="${esc(d.meetingUrl)}">${esc(d.meetingUrl)}</a></p>` : ''}`,
            referenceCode: d.referenceCode,
        }),
    }),
    'project.application_submitted': (d) => ({
        subject: `Application received — ${d.projectTitle}`,
        html: shell({
            heading: 'Your project application is in',
            body: `<p>Hi ${esc(d.candidateName)},</p>
                   <p>You applied to work on <strong>${esc(d.projectTitle)}</strong> at <strong>${esc(d.companyName)}</strong>${
                       d.mode === 'team'
                           ? ` as a team of ${esc(d.teamSize)}`
                           : ' on your own'
                   }. They can see your pitch now, and you'll hear from them here.</p>`,
            cta: { label: 'Track it on your dashboard', href: `${APP_URL}/my-account` },
            referenceCode: d.referenceCode,
        }),
    }),
    'project.status_changed': (d) => ({
        subject: `Project update — ${d.projectTitle}`,
        html: shell({
            heading: 'Your project application has moved',
            body: `<p>Hi ${esc(d.candidateName)},</p>
                   <p>Your application to work on <strong>${esc(d.projectTitle)}</strong> is now <strong>${esc(PROJECT_STATUS_COPY[d.status] || d.status)}</strong>.</p>`,
            cta: { label: 'Open your dashboard', href: `${APP_URL}/my-account` },
            referenceCode: d.referenceCode,
        }),
    }),
    'job.published': (d) => ({
        subject: `New opening: ${d.jobTitle}`,
        html: shell({
            heading: d.jobTitle,
            body: `<p>A new position has opened at ${esc(d.companyName)}.</p>`,
            cta: { label: 'View the role', href: `${APP_URL}/careers/open-positions` },
        }),
    }),
};

// ── Worker ────────────────────────────────────────────────────────────────────

const emailWorker = new Worker(
    'jobs-email-notifications',
    async (job) => {
        const { type = job.name, to, data } = job.data;
        if (!to) throw new Error('Missing recipient email');

        const tpl = templates[type];
        if (!tpl) throw new Error(`Unknown email type: ${type}`);

        const { subject, html } = tpl(data || {});

        if (SES_ENABLED) {
            const res = await emailService().sendRaw({ to, subject, html, category: 'notifications', template: type });
            console.log(`[EmailWorker] Sent ${type} → ${to} via SES (${res.status})`);
            return { sent: res.status === 'sent', messageId: res.messageId };
        }

        const msg = { from: FROM, to, subject, html, text: htmlToText(html) };

        if (!SMTP_CONFIGURED) {
            console.log(`[EmailWorker] (dev) ${type} → ${to} | Subject: ${subject}`);
            return { sent: false, dev: true };
        }

        await transporter.sendMail(msg);
        console.log(`[EmailWorker] Sent ${type} → ${to}`);
        return { sent: true };
    },
    {
        connection: redisConnection,
        concurrency: 5,
        limiter: { max: 50, duration: 60_000 }, // 50 emails/min
    }
);

emailWorker.on('failed', (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
});

emailWorker.on('completed', (job) => {
    console.log(`[EmailWorker] Job ${job.id} (${job.name}) completed`);
});

module.exports = emailWorker;
