'use strict';
/**
 * Premium, brand-themed lifecycle email renderer. Ported from the design system in
 * `Email Templates/_lib/` at the repo root (design reference / generator for static preview
 * files) — that folder isn't part of any deployable service, so the render logic lives here
 * for real. Keep the two in sync by hand when brand tokens or copy change; brands.js and
 * content.js are byte-for-byte copies, this file is the notification-service-specific
 * entry point (looks brands up by slug, exposes one render() per lifecycle email type).
 *
 * Brand tokens themselves come from the SAME registry that themes the shared login page
 * (Frontend/auth-baalvion/src/lib/themes.ts) — email, website, and login all read as one
 * product instead of three different ones.
 */
const { BRANDS } = require('./brands');
const { CONTENT } = require('./content');
const { header, footer, resourcesGrid, stepsList, shell } = require('./shell');

function resolveBrand(slug) {
  return BRANDS[slug] && CONTENT[slug] ? { b: BRANDS[slug], c: CONTENT[slug] } : { b: BRANDS.baalvion, c: CONTENT.baalvion };
}

function progress(done, total) {
  let out = '<div class="prog">';
  for (let i = 0; i < total; i++) out += `<div class="prog-dot ${i < done ? 'prog-done' : 'prog-pend'}"></div>`;
  return out + '</div>';
}

function firstNameOf(name) {
  if (!name) return null;
  return String(name).trim().split(/\s+/)[0] || null;
}

function renderWelcome(brandSlug, { fullName } = {}) {
  const { b, c } = resolveBrand(brandSlug);
  const { welcome: w, steps, resources } = c;
  const first = firstNameOf(fullName);
  const body = `${header(b)}
<div class="hero">
  <p class="eyebrow">${w.eyebrow}</p>
  <h1>${first ? `Welcome, ${first}.` : w.h1}</h1>
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
  return { subject: `Welcome to ${b.brandName}${first ? `, ${first}` : ''}!`, html: shell(b, b.brandName, body) };
}

function renderOnboardingDay(brandSlug, day, { fullName } = {}) {
  const { b, c } = resolveBrand(brandSlug);
  const d = c[`day${day}`];
  const { resources } = c;
  const partNumber = day === 1 ? 1 : day === 3 ? 2 : 3;
  const body = `${header(b)}
<div class="hero">
  <p class="eyebrow">Part ${partNumber} of 3</p>
  ${progress(partNumber, 3)}
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
  return { subject: `${d.h1} — ${b.brandName}`, html: shell(b, b.brandName, body) };
}

function renderReengagement(brandSlug, { fullName } = {}) {
  const { b, c } = resolveBrand(brandSlug);
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
  return { subject: r.h1, html: shell(b, b.brandName, body) };
}

function renderLeadNotification(brandSlug, { formName = 'Contact form', fields = [], message } = {}) {
  const { b } = resolveBrand(brandSlug);
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
  return { subject: `New ${formName.toLowerCase()} submission`, html: shell(b, `New ${formName.toLowerCase()} submission`, body) };
}

module.exports = { renderWelcome, renderOnboardingDay, renderReengagement, renderLeadNotification, BRANDS };
