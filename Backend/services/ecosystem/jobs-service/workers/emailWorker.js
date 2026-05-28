'use strict';
const { Worker } = require('bullmq');
const nodemailer  = require('nodemailer');
const redisConnection = require('../config/redis');

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter;
if (SMTP_CONFIGURED) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
} else {
    // Dev: log emails to console
    transporter = nodemailer.createTransport({ jsonTransport: true });
}

const FROM = process.env.EMAIL_FROM || 'noreply@baalvion.com';

// ── Email templates ───────────────────────────────────────────────────────────

const templates = {
    'application.submitted': (d) => ({
        subject: `Application Received — ${d.jobTitle}`,
        html: `<p>Hi ${d.candidateName},</p><p>Your application for <strong>${d.jobTitle}</strong> at <strong>${d.companyName}</strong> has been received. We'll review it and get back to you soon.</p>`,
    }),
    'application.status_changed': (d) => ({
        subject: `Application Update — ${d.jobTitle}`,
        html: `<p>Hi ${d.candidateName},</p><p>Your application for <strong>${d.jobTitle}</strong> has been updated to: <strong>${d.status}</strong>.</p>${d.notes ? `<p>Notes: ${d.notes}</p>` : ''}`,
    }),
    'interview.scheduled': (d) => ({
        subject: `Interview Scheduled — ${d.jobTitle}`,
        html: `<p>Hi ${d.candidateName},</p><p>Your interview for <strong>${d.jobTitle}</strong> has been scheduled for <strong>${d.scheduledAt}</strong>.</p>${d.meetingUrl ? `<p>Join link: <a href="${d.meetingUrl}">${d.meetingUrl}</a></p>` : ''}`,
    }),
    'interview.reminder': (d) => ({
        subject: `Interview Reminder — Tomorrow: ${d.jobTitle}`,
        html: `<p>Hi ${d.candidateName},</p><p>Reminder: your interview for <strong>${d.jobTitle}</strong> is tomorrow at <strong>${d.scheduledAt}</strong>.</p>${d.meetingUrl ? `<p>Join link: <a href="${d.meetingUrl}">${d.meetingUrl}</a></p>` : ''}`,
    }),
    'job.published': (d) => ({
        subject: `New Job Opening: ${d.jobTitle}`,
        html: `<p>A new position <strong>${d.jobTitle}</strong> has been published at ${d.companyName}. Apply now!</p>`,
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
        const msg = { from: FROM, to, subject, html };

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
