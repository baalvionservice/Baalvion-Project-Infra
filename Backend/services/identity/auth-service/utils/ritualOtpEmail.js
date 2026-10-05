'use strict';
/**
 * Ritual-themed sign-in code email for community.marketunderworld.com (brand `community`).
 * Same look as notification-service/templates/premium/ritual.js, which owns the welcome,
 * verification and reset emails. auth-service sends the code itself (it must not depend on a
 * queue), and cannot import another service's files, so the styling is kept in sync by hand.
 * Animation is progressive: clients that strip CSS animation show the final state.
 */
const SIGIL = '&#9959;';
const SYMBOLS = `'Apple Symbols','Segoe UI Symbol','Noto Sans Symbols2',sans-serif`;
const MONO = `'SF Mono','Menlo','Courier New',monospace`;
const SERIF = `Georgia,'Times New Roman',serif`;
const BRAND = { brandName: 'Market Underworld', domain: 'https://community.marketunderworld.com', accent: '#c1121f' };

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


function buildRitualOtpEmail(code, minutes, firstName) {
  const b = BRAND;
  const first = firstName ? String(firstName).trim().split(/\s+/)[0] : null;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(code)} is your sign-in code</title>
<style>
${css(b)}
</style>
</head>
<body>
<div class="pre">Your sign-in code is ${escapeHtml(code)}.</div>
<div class="rt">
<div class="gate">
  <span class="sigil">${SIGIL}</span>
  <p class="mark">${escapeHtml(b.brandName)}</p>
  <p class="embers">&middot; &nbsp;&#729; &nbsp;&middot; &nbsp;&#729; &nbsp;&middot;</p>
</div>
<div class="body" style="text-align:center;">
  <p class="eyebrow">Speak the word</p>
  <h1>${first ? `${escapeHtml(first)}, here is your word.` : 'Here is your word.'}</h1>
  <p>Use this one-time code to finish signing in.</p>
  <div class="circle"><div class="circle-in"><div class="circle-core"><div class="code">${escapeHtml(code)}</div><div class="code-note">expires in ${escapeHtml(minutes)} min</div></div></div></div>
  <p class="fine" style="margin-top:22px;">If you did not ask to sign in, ignore this message. No one can enter without the code.</p>
</div>
<div class="ftr">
  <p class="s">${SIGIL} ${SIGIL} ${SIGIL}</p>
  <p>You received this because a sign-in was requested for this address.</p>
  <p>&copy; ${escapeHtml(b.brandName)} &middot; Pune, Maharashtra, India</p>
</div>
</div>
</body>
</html>`;
  return { subject: `${code} is your ${b.brandName} sign-in code`, html };
}

module.exports = { buildRitualOtpEmail };
