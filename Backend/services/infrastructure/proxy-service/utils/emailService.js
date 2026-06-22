'use strict';
const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Dev: auto-create Ethereal test account (emails viewable at ethereal.email)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[Email] Using Ethereal test account:', testAccount.user);
  }
  return transporter;
};

const sendInvitationEmail = async ({ toEmail, toName, inviterName, orgName, role, inviteUrl }) => {
  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || '"Baalvion NetStack" <noreply@baalvion.com>',
    to: toEmail,
    subject: `You've been invited to join ${orgName} on Baalvion NetStack`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0f1117;color:#e2e8f0;border-radius:12px">
        <h2 style="color:#38bdf8;margin-bottom:8px">You're invited!</h2>
        <p style="margin-bottom:16px">
          <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong>
          as <strong>${role}</strong> on Baalvion NetStack.
        </p>
        <a href="${inviteUrl}"
           style="display:inline-block;padding:12px 28px;background:#38bdf8;color:#0f1117;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
          Accept Invitation
        </a>
        <p style="margin-top:24px;font-size:13px;color:#64748b">
          This link expires in 7 days. If you did not expect this invitation, you can ignore this email.
        </p>
        <hr style="border-color:#1e293b;margin:24px 0">
        <p style="font-size:12px;color:#475569">Baalvion Industries Private Limited</p>
      </div>
    `,
    text: `You've been invited to join ${orgName} as ${role}.\n\nAccept here: ${inviteUrl}\n\nLink expires in 7 days.`,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`[Email] Invitation sent to ${toEmail}`);
    console.log(`[Email] Preview URL: ${preview}`);
  }
  return { messageId: info.messageId, previewUrl: preview || null };
};

const BRAND = process.env.OTP_EMAIL_BRAND || 'Baalvion NetStack';

/**
 * Whether a real SMTP transport is configured (SMTP_HOST set). Email-OTP login — where delivery
 * IS the auth — must check this and fail loudly in production rather than dropping the code into
 * the Ethereal dev sink (which would tell the customer "code sent" while nothing is delivered).
 */
const isMailerConfigured = () => !!process.env.SMTP_HOST;

const sendOtpEmail = async ({ toEmail, code, expiresInMinutes }) => {
  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || '"Baalvion NetStack" <noreply@baalvion.com>',
    to: toEmail,
    subject: `${code} is your ${BRAND} login code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f1117;color:#e2e8f0;border-radius:12px">
        <h2 style="color:#38bdf8;margin:0 0 12px">Sign in to ${BRAND}</h2>
        <p style="margin:0 0 8px">Use this one-time code to finish signing in:</p>
        <p style="font-size:34px;font-weight:800;letter-spacing:8px;margin:16px 0;color:#38bdf8">${code}</p>
        <p style="margin:0 0 4px;color:#94a3b8">This code expires in ${expiresInMinutes} minutes.</p>
        <p style="margin-top:20px;font-size:13px;color:#64748b">If you didn't request this, you can ignore this email — no one can sign in without the code.</p>
      </div>`,
    text: `Your ${BRAND} login code is ${code}. It expires in ${expiresInMinutes} minutes. If you didn't request this, ignore this email.`,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    // Strip CR/LF from the user-supplied address before logging so a crafted email can't forge
    // additional log lines (log injection / CWE-117). `preview` is system-generated (ethereal test URL).
    const safeEmail = String(toEmail).replace(/[\r\n]+/g, ' ');
    console.log(`[Email] OTP login code sent to ${safeEmail} — preview: ${preview}`);
  }
  return { messageId: info.messageId, previewUrl: preview || null };
};

module.exports = { sendInvitationEmail, sendOtpEmail, isMailerConfigured };
