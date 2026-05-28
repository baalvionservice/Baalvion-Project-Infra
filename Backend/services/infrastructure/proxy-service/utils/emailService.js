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

module.exports = { sendInvitationEmail };
