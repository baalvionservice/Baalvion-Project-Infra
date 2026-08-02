'use strict';
/**
 * Shared email shell: one CSS block + header/footer/steps/resources fragments, parameterized by
 * brand tokens. Structure ported verbatim from the original hand-built templates (proven to
 * render correctly) — this only fixes the CSS to read real per-brand tokens instead of a single
 * hardcoded blue/green swap, and drops the unused Google Fonts @import (client-side custom fonts
 * don't reliably render in Gmail/Outlook anyway; the fallback stacks in brands.js do the real work).
 */

function css(b) {
  return `*{margin:0;padding:0;box-sizing:border-box;}
body{background:#f5f5f7;font-family:${b.fontBody};color:#1d1d1f;-webkit-font-smoothing:antialiased;}
.ew{max-width:600px;margin:0 auto;background:#ffffff;border-radius:0;overflow:hidden;border-left:1px solid #e8e8e4;border-right:1px solid #e8e8e4;}
@media(min-width:660px){.ew{margin:48px auto;border-radius:12px;border:1px solid #e8e8e4;}}

/* HEADER */
.hdr{padding:32px 56px 28px;border-bottom:1px solid #f0f0f5;background:${b.headerBg};}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
.logo-mark{width:28px;height:28px;background:rgba(255,255,255,0.12);border-radius:6px;display:flex;align-items:center;justify-content:center;border:0.5px solid rgba(255,255,255,0.2);}
.logo-mark svg{width:14px;height:14px;}
.logo-name{font-size:15px;font-weight:500;color:rgba(255,255,255,0.92);letter-spacing:-0.2px;font-family:${b.fontBody};}

/* HERO */
.hero{padding:64px 56px 52px;border-bottom:1px solid #f0f0f5;}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${b.accent};margin-bottom:18px;font-family:${b.fontBody};}
.hero h1{font-size:28px;font-weight:600;color:#1d1d1f;line-height:1.2;letter-spacing:-0.6px;margin-bottom:20px;font-family:${b.fontDisplay};}
.hero p{font-size:15px;color:#6e6e73;line-height:1.75;margin-bottom:14px;font-family:${b.fontBody};}

/* CTA */
.cta-sec{padding:44px 56px;border-bottom:1px solid #f0f0f5;}
.btn{display:inline-block;background:${b.accent};color:${b.accentContrast || '#ffffff'};font-size:14px;font-weight:500;padding:14px 32px;border-radius:980px;text-decoration:none;letter-spacing:-0.1px;font-family:${b.fontBody};}
.sub-cta{font-size:11px;color:#ababab;text-transform:uppercase;letter-spacing:1px;margin-top:22px;font-family:${b.fontBody};}

/* STEPS */
.sec{padding:52px 56px;border-bottom:1px solid #f0f0f5;}
.sec-title{font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${b.accent};margin-bottom:32px;font-family:${b.fontBody};}
.step-list{list-style:none;}
.step-item{display:flex;gap:18px;align-items:flex-start;margin-bottom:28px;}
.step-item:last-child{margin-bottom:0;}
.step-num{width:28px;height:28px;background:#f5f5f7;border-radius:50%;font-size:12px;font-weight:600;color:#6e6e73;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;font-family:${b.fontBody};}
.step-h{font-size:14px;font-weight:500;color:#1d1d1f;margin-bottom:6px;font-family:${b.fontBody};}
.step-p{font-size:13px;color:#6e6e73;line-height:1.65;font-family:${b.fontBody};}

/* RESOURCES */
.res-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.res-card{background:#f5f5f7;border:1px solid #e8e8ed;border-radius:10px;padding:20px 22px;text-decoration:none;}
.res-icon{font-size:20px;margin-bottom:12px;display:block;}
.res-h{font-size:13px;font-weight:500;color:#1d1d1f;margin-bottom:4px;font-family:${b.fontBody};}
.res-p{font-size:12px;color:#6e6e73;line-height:1.5;font-family:${b.fontBody};}

/* HIGHLIGHT BOX */
.hl-box{background:${b.headerBg};border-radius:12px;padding:36px 40px;}
.hl-box h3{font-size:18px;font-weight:500;color:rgba(255,255,255,0.95);margin-bottom:12px;line-height:1.3;letter-spacing:-0.3px;font-family:${b.fontDisplay};}
.hl-box p{font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;margin-bottom:22px;font-family:${b.fontBody};}
.hl-btn{display:inline-block;background:rgba(255,255,255,0.92);color:${b.headerBg};font-size:13px;font-weight:500;padding:12px 26px;border-radius:980px;text-decoration:none;font-family:${b.fontBody};}

/* FOOTER */
.ftr{padding:40px 56px;background:#fafafa;border-top:1px solid #e8e8ed;}
.ftr-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #e8e8ed;}
.ftr-logo{font-size:13px;font-weight:500;color:#1d1d1f;letter-spacing:-0.1px;font-family:${b.fontBody};}
.ftr-links{display:flex;gap:20px;}
.ftr-links a{font-size:12px;color:#6e6e73;text-decoration:none;font-family:${b.fontBody};}
.ftr-links a:hover{color:${b.accent};}
.ftr-meta{font-size:11px;color:#ababab;line-height:1.8;font-family:${b.fontBody};}
.ftr-meta a{color:#6e6e73;text-decoration:none;border-bottom:1px solid #e8e8ed;}

/* ARTICLE (newsletter) */
.art{padding:28px 0;border-bottom:1px solid #f0f0f5;text-decoration:none;display:block;}
.art:last-child{border-bottom:none;padding-bottom:0;}
.art-tag{font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${b.accent};margin-bottom:10px;font-family:${b.fontBody};}
.art h3{font-size:16px;font-weight:500;color:#1d1d1f;line-height:1.4;margin-bottom:8px;letter-spacing:-0.2px;font-family:${b.fontDisplay};}
.art p{font-size:13px;color:#6e6e73;line-height:1.65;font-family:${b.fontBody};}
.art-read{font-size:12px;color:${b.accent};margin-top:10px;display:block;font-family:${b.fontBody};}

/* REENGAGEMENT */
.miss-center{text-align:center;padding:64px 56px 52px;border-bottom:1px solid #f0f0f5;}
.miss-icon{font-size:48px;display:block;margin-bottom:24px;}
.miss-center h1{font-size:26px;font-weight:500;color:#1d1d1f;margin-bottom:16px;line-height:1.25;letter-spacing:-0.4px;font-family:${b.fontDisplay};}
.miss-center p{font-size:15px;color:#6e6e73;line-height:1.75;max-width:400px;margin:0 auto;font-family:${b.fontBody};}
.stat-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid #f0f0f5;}
.stat-cell{padding:32px 20px;text-align:center;border-right:1px solid #f0f0f5;}
.stat-cell:last-child{border-right:none;}
.stat-num{font-size:26px;font-weight:600;color:${b.accent};display:block;margin-bottom:5px;letter-spacing:-0.5px;font-family:${b.fontDisplay};}
.stat-lbl{font-size:10px;color:#6e6e73;text-transform:uppercase;letter-spacing:1.2px;font-family:${b.fontBody};}
.offer-box{background:${b.accentSoft};border-radius:0 10px 10px 0;padding:28px 32px;border-left:3px solid ${b.accent};}
.offer-box h3{font-size:16px;font-weight:500;color:#1d1d1f;margin-bottom:8px;font-family:${b.fontDisplay};}
.offer-box p{font-size:13px;color:#6e6e73;line-height:1.65;margin-bottom:22px;font-family:${b.fontBody};}

/* PROGRESS BAR */
.prog{display:flex;gap:5px;margin-bottom:28px;}
.prog-dot{height:3px;flex:1;border-radius:2px;}
.prog-done{background:${b.accent};}
.prog-pend{background:#f0f0f5;opacity:0.5;}

/* TIP BOX */
.tip-box{background:${b.accentSoft};border-left:3px solid ${b.accent};border-radius:0 8px 8px 0;padding:18px 22px;margin-top:28px;}
.tip-box strong{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${b.accent};display:block;margin-bottom:6px;font-family:${b.fontBody};}
.tip-box p{font-size:13px;color:#6e6e73;line-height:1.6;margin:0;font-family:${b.fontBody};}

/* WEEKLY ISSUE BADGE */
.issue-badge{display:inline-block;background:${b.accentSoft};color:${b.accent};font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;padding:6px 14px;border-radius:980px;margin-bottom:24px;font-family:${b.fontBody};}

/* OTP CODE */
.otp-wrap{text-align:center;padding:8px 0 20px;}
.otp-code{display:inline-block;font-family:${b.fontMono || `'SF Mono', 'Courier New', monospace`};font-size:40px;font-weight:600;letter-spacing:12px;color:#1d1d1f;background:#f5f5f7;border:1px solid #e8e8ed;border-radius:10px;padding:20px 16px 20px 28px;}
.otp-expiry{font-size:12px;color:#ababab;text-align:center;margin-top:18px;font-family:${b.fontBody};}

/* LEAD NOTIFICATION (internal) */
.lead-table{width:100%;border-collapse:collapse;}
.lead-table td{padding:12px 0;border-bottom:1px solid #f0f0f5;font-size:13px;color:#1d1d1f;font-family:${b.fontBody};vertical-align:top;}
.lead-table td.lead-k{color:#6e6e73;width:120px;font-weight:500;}
.lead-msg{background:#f5f5f7;border-radius:10px;padding:20px 22px;margin-top:20px;font-size:13px;line-height:1.7;color:#1d1d1f;font-family:${b.fontBody};white-space:pre-wrap;}

@media(max-width:600px){
  .hdr,.hero,.cta-sec,.sec,.ftr,.miss-center{padding-left:28px;padding-right:28px;}
  .hero{padding-top:44px;padding-bottom:36px;}
  .hero h1{font-size:22px;}
  .res-grid{grid-template-columns:1fr;}
  .ftr-top{flex-direction:column;align-items:flex-start;gap:14px;}
  .stat-row{grid-template-columns:1fr;}
  .stat-cell{border-right:none;border-bottom:1px solid #f0f0f5;}
  .otp-code{font-size:30px;letter-spacing:8px;padding:16px 12px 16px 20px;}
}`;
}

function header(b) {
  return `<div class="hdr">
  <a href="${b.domain}" class="logo">
    <div class="logo-mark"><svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">${b.logoMark}</svg></div>
    <span class="logo-name">${b.brandName}</span>
  </a>
</div>`;
}

function resourcesGrid(b, resources) {
  return `<div class="res-grid">${resources
    .map(
      (r) =>
        `<a href="${r.href || b.domain}" class="res-card"><span class="res-icon">${r.icon}</span><p class="res-h">${r.h}</p><p class="res-p">${r.p}</p></a>`
    )
    .join('\n')}</div>`;
}

function stepsList(steps) {
  return `<ul class="step-list">${steps
    .map(
      (s, i) =>
        `<li class="step-item"><div class="step-num">${i + 1}</div><div><p class="step-h">${s.h}</p><p class="step-p">${s.p}</p></div></li>`
    )
    .join('\n')}</ul>`;
}

function footer(b) {
  return `<div class="ftr">
  <div class="ftr-top">
    <span class="ftr-logo">${b.brandName}</span>
    <div class="ftr-links">
      <a href="${b.domain}">Website</a>
      <a href="${b.domain}/privacy">Privacy</a>
      <a href="${b.domain}/unsubscribe">Unsubscribe</a>
    </div>
  </div>
  <p class="ftr-meta">
    You received this email because you signed up at <a href="${b.domain}">${b.domain.replace('https://', '')}</a>.<br>
    &copy; ${b.brandName} &middot; Pune, Maharashtra, India<br>
    <a href="${b.domain}/unsubscribe">Unsubscribe</a> &nbsp;&middot;&nbsp; <a href="${b.domain}/preferences">Email preferences</a>
  </p>
</div>`;
}

function shell(b, title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${title}</title>
<style>
${css(b)}
</style>
</head>
<body>
<div class="ew">
${bodyHtml}
</div>
</body>
</html>`;
}

module.exports = { css, header, footer, resourcesGrid, stepsList, shell };
