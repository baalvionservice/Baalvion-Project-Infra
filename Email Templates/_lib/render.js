'use strict';
const { header, footer, resourcesGrid, stepsList, shell } = require('./shell');

function progress(done, total) {
  let out = '<div class="prog">';
  for (let i = 0; i < total; i++) out += `<div class="prog-dot ${i < done ? 'prog-done' : 'prog-pend'}"></div>`;
  return out + '</div>';
}

function renderWelcome(b, c) {
  const { welcome: w, steps, resources } = c;
  const body = `${header(b)}
<div class="hero">
  <p class="eyebrow">${w.eyebrow}</p>
  <h1>${w.h1}</h1>
  ${w.p.map((p) => `<p>${p}</p>`).join('\n  ')}
</div>
<div class="cta-sec">
  <a href="${b.domain}${w.ctaHref}" class="btn">${w.ctaText}</a>
  <p class="sub-cta">or explore everything included below</p>
</div>
<div class="sec">
  <p class="sec-title">What to do next</p>
  ${stepsList(steps)}
</div>
<div class="sec">
  <p class="sec-title">Explore</p>
  ${resourcesGrid(b, resources)}
</div>
${footer(b)}`;
  return shell(b, b.brandName, body);
}

function renderOnboardingDay(b, c, day, partNumber, doneCount) {
  const d = c[`day${day}`];
  const { steps, resources } = c;
  const body = `${header(b)}
<div class="hero">
  <p class="eyebrow">Part ${partNumber} of 3</p>
  ${progress(doneCount, 3)}
  <h1>${d.h1}</h1>
  <p>${d.p}</p>
  <div class="tip-box">
    <strong>${d.tipLabel}</strong>
    <p>${d.tip}</p>
  </div>
</div>
<div class="cta-sec">
  <p class="sec-title">${d.ctaSecTitle}</p>
  <p style="font-size:14px;color:#6e6e73;line-height:1.7;margin-bottom:28px;">${d.ctaSecP}</p>
  <a href="${b.domain}/dashboard" class="btn">${d.ctaText}</a>
</div>
<div class="sec">
  <p class="sec-title">Quick access</p>
  ${resourcesGrid(b, resources)}
</div>
${footer(b)}`;
  return shell(b, b.brandName, body);
}

function renderNewsletter(b, c) {
  const n = c.newsletter;
  const { resources } = c;
  const body = `${header(b)}
<div class="hero">
  <div class="issue-badge">Weekly Issue</div>
  <p class="eyebrow">This week</p>
  <h1>${n.h1}</h1>
  <p>${n.p} Delivered every Monday from <strong style="color:${b.accent}">${n.fromEmail}</strong>.</p>
</div>
<div class="sec">
  <p class="sec-title">This week's highlights</p>
  ${n.articles
    .map(
      (a) =>
        `<a href="${b.domain}" class="art">
    <p class="art-tag">${a.tag}</p>
    <h3>${a.h}</h3>
    <p>${a.p}</p>
    <span class="art-read">${a.read}</span>
  </a>`
    )
    .join('\n  ')}
</div>
<div class="sec">
  <div class="hl-box">
    <h3>${n.hlH}</h3>
    <p>${n.hlP}</p>
    <a href="${b.domain}/dashboard" class="hl-btn">${n.hlBtn}</a>
  </div>
</div>
<div class="sec">
  <p class="sec-title">From the community</p>
  ${resourcesGrid(b, resources)}
</div>
${footer(b)}`;
  return shell(b, b.brandName, body);
}

function renderReengagement(b, c) {
  const r = c.reengagement;
  const { steps } = c;
  const body = `${header(b)}
<div class="miss-center">
  <span class="miss-icon">👋</span>
  <h1>${r.h1}</h1>
  <p>${r.p}</p>
</div>
<div class="stat-row">
  ${r.stats.map((s) => `<div class="stat-cell"><span class="stat-num">${s.num}</span><span class="stat-lbl">${s.lbl}</span></div>`).join('\n  ')}
</div>
<div class="sec">
  <p class="sec-title">What changed while you were away</p>
  <div class="offer-box">
    <h3>${r.offerH}</h3>
    <p>${r.offerP}</p>
    <a href="${b.domain}/dashboard" class="btn" style="margin-top:0;">${r.offerBtn}</a>
  </div>
</div>
<div class="sec">
  <p class="sec-title">Jump back in</p>
  ${stepsList(steps)}
</div>
<div class="sec" style="border-bottom:none;text-align:center;padding-top:32px;padding-bottom:40px;">
  <p style="font-size:12px;color:#ababab;margin-bottom:12px;">If you no longer want to hear from us, we understand.</p>
  <a href="${b.domain}/unsubscribe" style="font-size:12px;color:#ababab;text-decoration:underline;">Unsubscribe from all emails</a>
</div>
${footer(b)}`;
  return shell(b, b.brandName, body);
}

/**
 * OTP / verification-code email. `code` and `minutes` are runtime values (passed in at send
 * time by the backend), not brand copy — this is also the shape used by
 * auth-service/service/emailLoginService.js's buildOtpEmail().
 */
function renderOtp(b, { code, minutes = 5, firstName }) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const body = `${header(b)}
<div class="hero" style="padding-bottom:8px;">
  <p class="eyebrow">Verify it's you</p>
  <h1>Your sign-in code</h1>
  <p>${greeting} use this one-time code to finish signing in to ${b.brandName}.</p>
</div>
<div class="cta-sec" style="border-bottom:none;">
  <div class="otp-wrap">
    <span class="otp-code">${code}</span>
  </div>
  <p class="otp-expiry">This code expires in ${minutes} minutes. If you didn't request this, you can safely ignore this email.</p>
</div>
${footer(b)}`;
  return shell(b, `${code} is your ${b.brandName} verification code`, body);
}

/**
 * Internal lead / contact-form notification — goes to the TEAM, not the lead. Same visual
 * system so internal mail looks as considered as customer-facing mail, but content is a
 * structured field table rather than brand copy.
 */
function renderLeadNotification(b, { formName = 'Contact form', fields = [], message }) {
  const body = `${header(b)}
<div class="hero" style="padding-bottom:24px;">
  <p class="eyebrow">New submission</p>
  <h1>${formName}</h1>
  <p>A new submission just came in from ${b.domain.replace('https://', '')}.</p>
</div>
<div class="sec">
  <table class="lead-table" role="presentation">
    ${fields.map((f) => `<tr><td class="lead-k">${f.k}</td><td>${f.v}</td></tr>`).join('\n    ')}
  </table>
  ${message ? `<div class="lead-msg">${message}</div>` : ''}
</div>
${footer(b)}`;
  return shell(b, `New ${formName.toLowerCase()} submission`, body);
}

module.exports = {
  renderWelcome,
  renderOnboardingDay,
  renderNewsletter,
  renderReengagement,
  renderOtp,
  renderLeadNotification,
};
