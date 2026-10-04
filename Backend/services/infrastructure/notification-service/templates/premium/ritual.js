'use strict';
/**
 * Ritual-themed emails for community.marketunderworld.com (brand slug `community`).
 *
 * The site's look is a dark, ember-lit occult terminal, so these emails skip the white
 * lifecycle shell and render as one dark page: a flickering sigil, a gate that "opens" line by
 * line, and the call to action as an offering at the threshold. The motion is CSS keyframes —
 * Apple Mail, iOS Mail and most mobile clients play it; Gmail and Outlook strip animation, and
 * there every line simply renders in its final, fully visible state (animations only ever start
 * from the hidden frame, they never depend on it). Nothing here relies on images or inline SVG.
 *
 * Copy describes only what the site really has (clubs and guest lists, locals, staffing, the
 * bounty programme, education, the shop). No numbers, rankings or member counts.
 */
const SIGIL = '&#9959;'; // ⛧
const SIGIL_TXT = '\u26E7';
const SYMBOLS = `'Apple Symbols','Segoe UI Symbol','Noto Sans Symbols2',sans-serif`;
const MONO = `'SF Mono','Menlo','Courier New',monospace`;
const SERIF = `Georgia,'Times New Roman',serif`;

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function css(b) {
  return `*{margin:0;padding:0;box-sizing:border-box;}
body{background:#050304;color:#e9dfd0;font-family:${MONO};-webkit-font-smoothing:antialiased;}
.rt{max-width:600px;margin:0 auto;background:#0a0506;border:1px solid #2a0d12;}
@media(min-width:660px){.rt{margin:40px auto;border-radius:6px;}}
.pre{display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#0a0506;}

.gate{padding:44px 48px 8px;text-align:center;border-bottom:1px solid #1d0a0e;background:#0a0506;background-image:radial-gradient(ellipse at 50% 0%,#3a0a12 0%,#0a0506 68%);}
.sigil{display:block;font-family:${SYMBOLS};font-size:64px;line-height:1;color:${b.accent};text-shadow:0 0 18px #ff2d2d,0 0 42px #8b0010;animation:flicker 3.2s infinite;}
.mark{font-family:${SERIF};font-size:13px;letter-spacing:6px;text-transform:uppercase;color:#a89580;margin:14px 0 26px;}
.embers{font-size:14px;letter-spacing:10px;color:#ff5a36;animation:ember 2.4s ease-in-out infinite;margin-bottom:26px;}

.body{padding:34px 48px 12px;}
.eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${b.accent};margin-bottom:18px;}
h1{font-family:${SERIF};font-size:28px;font-weight:400;line-height:1.25;color:#f4ead8;letter-spacing:.5px;margin-bottom:20px;}
p{font-size:14px;line-height:1.8;color:#b9ab97;margin-bottom:14px;}
.rite{margin:26px 0 6px;padding:18px 20px;border-left:2px solid ${b.accent};background:#0f0709;font-size:13px;line-height:2;color:#cdbfa9;}
.rite span{display:block;opacity:1;animation:reveal .7s ease both;}
.rite span:nth-child(2){animation-delay:.9s;}
.rite span:nth-child(3){animation-delay:1.8s;}
.rite span:nth-child(4){animation-delay:2.7s;}
.rite b{color:${b.accent};font-weight:400;}

.circle{margin:30px auto 8px;width:236px;height:236px;border:1px dashed #7a1220;border-radius:50%;position:relative;text-align:center;animation:spin 40s linear infinite;}
.circle-in{position:absolute;top:18px;left:18px;right:18px;bottom:18px;border:1px solid #4a0c16;border-radius:50%;text-align:center;animation:spin 40s linear infinite reverse;}
.circle-core{padding-top:84px;}
.code{font-family:${MONO};font-size:38px;letter-spacing:9px;padding-left:9px;color:#fff3e0;text-shadow:0 0 14px #ff2d2d;}
.code-note{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7d6e5c;margin-top:10px;}

.cta{padding:30px 48px 40px;text-align:center;}
.btn{display:inline-block;background:${b.accent};color:#fff;font-family:${MONO};font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:16px 34px;border:1px solid #ff4d4d;border-radius:2px;box-shadow:0 0 22px rgba(193,18,31,.55);animation:pulse 2.6s ease-in-out infinite;}
.fine{font-size:11px;line-height:1.7;color:#6f6253;margin-top:22px;}
.paths{padding:8px 48px 34px;}
.paths-t{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7d6e5c;margin-bottom:14px;}
.path{padding:12px 0;border-top:1px solid #1d0a0e;}
.path b{display:block;font-size:13px;font-weight:400;color:#e9dfd0;letter-spacing:1px;margin-bottom:3px;}
.path em{font-style:normal;font-size:12px;color:#8d7f6c;line-height:1.6;}

.ftr{padding:28px 48px 34px;border-top:1px solid #1d0a0e;text-align:center;}
.ftr p{font-size:11px;line-height:1.8;color:#5e5245;margin-bottom:6px;}
.ftr a{color:#8d7f6c;text-decoration:underline;}
.ftr .s{font-family:${SYMBOLS};font-size:16px;color:#4a0c16;letter-spacing:12px;}

@keyframes flicker{0%,100%{opacity:1}8%{opacity:.82}12%{opacity:1}30%{opacity:.9}34%{opacity:1}62%{opacity:.78}66%{opacity:1}}
@keyframes ember{0%,100%{opacity:.35;transform:translateY(2px)}50%{opacity:1;transform:translateY(-3px)}}
@keyframes reveal{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{box-shadow:0 0 14px rgba(193,18,31,.4)}50%{box-shadow:0 0 30px rgba(255,45,45,.75)}}
@media(prefers-reduced-motion:reduce){.sigil,.embers,.rite span,.circle,.circle-in,.btn{animation:none!important;}}
@media(max-width:600px){.gate,.body,.cta,.paths,.ftr{padding-left:24px;padding-right:24px;}h1{font-size:23px;}.code{font-size:30px;letter-spacing:6px;}}`;
}

function gate(b) {
  return `<div class="gate">
  <span class="sigil">${SIGIL}</span>
  <p class="mark">${escapeHtml(b.brandName)}</p>
  <p class="embers">&middot; &nbsp;&#729; &nbsp;&middot; &nbsp;&#729; &nbsp;&middot;</p>
</div>`;
}

function footer(b, why) {
  return `<div class="ftr">
  <p class="s">${SIGIL} ${SIGIL} ${SIGIL}</p>
  <p>${why}</p>
  <p><a href="${b.domain}">${b.domain.replace('https://', '')}</a> &middot; <a href="${b.domain}/privacy">Privacy</a> &middot; <a href="${b.domain}/unsubscribe">Unsubscribe</a></p>
  <p>&copy; ${escapeHtml(b.brandName)} &middot; Pune, Maharashtra, India</p>
</div>`;
}

function page(b, title, preheader, inner, why) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(title)}</title>
<style>
${css(b)}
</style>
</head>
<body>
<div class="pre">${escapeHtml(preheader)}</div>
<div class="rt">
${gate(b)}
${inner}
${footer(b, why)}
</div>
</body>
</html>`;
}

function rite(lines) {
  return `<div class="rite">${lines.map((l) => `<span>${l}</span>`).join('')}</div>`;
}

function paths(items) {
  return `<div class="paths"><p class="paths-t">Where the doors lead</p>${items
    .map((i) => `<div class="path"><b>${i.h}</b><em>${i.p}</em></div>`)
    .join('')}</div>`;
}

const DOORS = [
  { h: 'Clubs &amp; guest lists', p: 'Browse venues and request a guest-list spot or a VIP table.' },
  { h: 'Locals', p: 'Find hosted nights and gatherings near you.' },
  { h: 'Staffing', p: 'Verified venues post shifts; verified candidates apply.' },
  { h: 'Education &amp; the shop', p: 'Sessions from approved teachers, and the marketplace.' },
];

function renderWelcome(b, { fullName } = {}) {
  const first = firstNameOf(fullName);
  const name = first ? escapeHtml(first) : 'traveller';
  const inner = `<div class="body">
  <p class="eyebrow">The gate is open</p>
  <h1>${first ? `${name}, you have been let in.` : 'You have been let in.'}</h1>
  <p>Your account is bound to the circle. What lies beyond the door is yours to explore.</p>
  ${rite([
    '<b>&gt;</b> binding account ........ done',
    '<b>&gt;</b> reading your name ...... ' + name,
    '<b>&gt;</b> opening the gate ....... done',
    '<b>&gt;</b> you may enter',
  ])}
</div>
<div class="cta"><a class="btn" href="${b.domain}/dashboard">Step inside</a></div>
${paths(DOORS)}`;
  return {
    subject: `${SIGIL_TXT} The gate is open${first ? `, ${first}` : ''}`,
    html: page(b, b.brandName, 'The gate is open. Your account is ready.', inner, 'You received this because an account was created with this address.'),
  };
}


function renderOnboardingDay(b, day, { fullName } = {}) {
  const first = firstNameOf(fullName);
  const steps = {
    1: { eyebrow: 'First night', h: 'Your first night inside.', p: 'Pick a city, open the clubs directory and send your first guest-list request. Venues confirm requests themselves, so it can take a little while.', cta: 'Browse the clubs', href: '/clubs', rite: ['<b>&gt;</b> choose a city', '<b>&gt;</b> pick a venue', '<b>&gt;</b> request your place'] },
    3: { eyebrow: 'Third night', h: 'The locals know the way.', p: 'Hosted nights and small gatherings live under Locals. Apply to one, or look at the staffing board if you want to work the door instead.', cta: 'See the locals', href: '/locals', rite: ['<b>&gt;</b> open Locals', '<b>&gt;</b> read the listing', '<b>&gt;</b> send your application'] },
    7: { eyebrow: 'Seventh night', h: 'One week in the dark.', p: 'Learn something from an approved teacher, browse the shop, or report a security issue through the bounty programme. Your account carries across all of it.', cta: 'Return to the circle', href: '/dashboard', rite: ['<b>&gt;</b> education sessions', '<b>&gt;</b> the marketplace', '<b>&gt;</b> the bounty programme'] },
  }[day];
  const inner = `<div class="body">
  <p class="eyebrow">${steps.eyebrow}</p>
  <h1>${steps.h}</h1>
  <p>${steps.p}</p>
  ${rite(steps.rite)}
</div>
<div class="cta"><a class="btn" href="${b.domain}${steps.href}">${steps.cta}</a></div>
${paths(DOORS)}`;
  return {
    subject: `${SIGIL_TXT} ${steps.h}`,
    html: page(b, b.brandName, steps.p.slice(0, 90), inner, `You received this because you have an account${first ? ` (${escapeHtml(first)})` : ''}. You can unsubscribe below.`),
  };
}

function renderReengagement(b) {
  const inner = `<div class="body">
  <p class="eyebrow">The embers are cooling</p>
  <h1>The circle has been quiet without you.</h1>
  <p>It has been a while since you came through the gate. Your account is exactly as you left it.</p>
  ${rite(['<b>&gt;</b> account ........ waiting', '<b>&gt;</b> gate ........... still open'])}
</div>
<div class="cta"><a class="btn" href="${b.domain}/dashboard">Return</a>
  <p class="fine">If you would rather not hear from us, <a href="${b.domain}/unsubscribe" style="color:#8d7f6c;">unsubscribe</a> and we will stop.</p>
</div>
${paths(DOORS)}`;
  return { subject: `${SIGIL_TXT} The circle has been quiet without you`, html: page(b, b.brandName, 'Your account is waiting.', inner, 'You received this because you have an account.') };
}

function renderVerify(b, { verifyUrl, email } = {}) {
  const inner = `<div class="body">
  <p class="eyebrow">Seal the binding</p>
  <h1>Confirm this address.</h1>
  <p>Confirm that <span style="color:#f4ead8;">${escapeHtml(email || 'this address')}</span> is yours so the gate can recognise you.</p>
  ${rite(['<b>&gt;</b> address ........ unconfirmed', '<b>&gt;</b> awaiting your mark'])}
</div>
<div class="cta"><a class="btn" href="${escapeHtml(verifyUrl)}">Seal it</a>
  <p class="fine">The link works for 24 hours. If you did not create an account, close this message; nothing happens without the link.</p>
</div>`;
  return { subject: `${SIGIL_TXT} Seal the binding: confirm your email`, html: page(b, 'Confirm your email', 'Confirm your email address.', inner, 'You received this because this address was used to create an account.') };
}

function renderReset(b, { resetUrl } = {}) {
  const inner = `<div class="body">
  <p class="eyebrow">Break and remake</p>
  <h1>Choose a new key.</h1>
  <p>Someone asked to reset the password for this account. If that was you, the link below opens the way to a new one.</p>
  ${rite(['<b>&gt;</b> old key ........ still valid until you act', '<b>&gt;</b> new key ........ yours to choose'])}
</div>
<div class="cta"><a class="btn" href="${escapeHtml(resetUrl)}">Forge a new key</a>
  <p class="fine">The link works for one hour. If you did not ask for this, ignore this message: your password has not changed.</p>
</div>`;
  return { subject: `${SIGIL_TXT} Reset your password`, html: page(b, 'Reset your password', 'Reset the password for your account.', inner, 'You received this because a password reset was requested for this address.') };
}

function renderLead(b, { formName = 'Contact form', fields = [], message } = {}) {
  const rows = fields.map((f) => `<p><span style="color:#7d6e5c;">${escapeHtml(f.k)}</span> &nbsp; ${escapeHtml(f.v)}</p>`).join('');
  const inner = `<div class="body"><p class="eyebrow">New submission</p><h1>${escapeHtml(formName)}</h1>${rows}${message ? `<div class="rite" style="white-space:pre-wrap;">${escapeHtml(message)}</div>` : ''}</div>`;
  return { subject: `New ${formName.toLowerCase()} submission`, html: page(b, formName, `New ${formName.toLowerCase()} submission`, inner, 'Internal notification.') };
}

function firstNameOf(name) {
  if (!name) return null;
  return String(name).trim().split(/\s+/)[0] || null;
}

module.exports = { renderWelcome, renderOnboardingDay, renderReengagement, renderVerify, renderReset, renderLead };
