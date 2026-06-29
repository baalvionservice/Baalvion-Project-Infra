'use strict';

/**
 * Shared, responsive, dark-mode-aware email shell.
 *
 * Design notes:
 *  - Layout uses table-free block markup with max-width:600px and fluid widths so it
 *    reflows cleanly on mobile (<480px) via the @media block.
 *  - Dark mode is handled three ways for broad client support:
 *      1. `color-scheme` / `supported-color-schemes` meta + CSS so Apple Mail / iOS adapt.
 *      2. `@media (prefers-color-scheme: dark)` overrides for clients that honour it.
 *      3. Neutral, high-contrast defaults so even clients that ignore both stay legible.
 *  - Inline styles back every critical color because Gmail strips <style> in some contexts;
 *    the <style> block then *enhances* (dark mode, hover) where supported.
 */

const escapeHtml = (value) =>
    String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const BRAND = {
    name: 'Baalvion',
    light: { bg: '#f4f5f7', surface: '#ffffff', ink: '#09090b', muted: '#52525b', faint: '#a1a1aa', border: '#e4e4e7', accent: '#09090b' },
    dark: { bg: '#0b0b0e', surface: '#161619', ink: '#f4f4f5', muted: '#a1a1aa', faint: '#71717a', border: '#27272a', accent: '#ffffff' },
};

/**
 * @param {Object} opts
 * @param {string} opts.content    Already-escaped/trusted inner HTML (template body)
 * @param {string} [opts.preview]  Inbox preview text (hidden preheader)
 * @param {string} [opts.appUrl]   Brand link target
 * @param {string} [opts.footerNote] Optional extra footer line (already escaped)
 * @returns {string}
 */
function baseLayout({ content, preview = '', appUrl = 'https://baalvion.com', footerNote = '' }) {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(BRAND.name)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin:0; padding:0; width:100%!important; background:${BRAND.light.bg}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    a { color:inherit; }
    .wrapper { width:100%; background:${BRAND.light.bg}; padding:24px 12px; }
    .container { max-width:600px; margin:0 auto; background:${BRAND.light.surface}; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid ${BRAND.light.border}; }
    .header { background:${BRAND.light.accent}; padding:26px 40px; }
    .header-logo { color:#ffffff; font-size:19px; font-weight:700; letter-spacing:-0.4px; text-decoration:none; }
    .content { padding:40px; }
    .h1 { font-size:23px; line-height:1.25; font-weight:700; color:${BRAND.light.ink}; margin:0 0 16px; }
    .text { font-size:15px; color:${BRAND.light.muted}; line-height:1.65; margin:0 0 16px; }
    .muted { font-size:13px; color:${BRAND.light.faint}; line-height:1.6; }
    .btn { display:inline-block; background:${BRAND.light.accent}; color:#ffffff!important; text-decoration:none; padding:13px 30px; border-radius:8px; font-size:15px; font-weight:600; margin:18px 0; }
    .btn-danger { background:#dc2626; }
    .divider { border:none; border-top:1px solid ${BRAND.light.border}; margin:28px 0; }
    .code-box { background:#f4f5f7; border:1px solid ${BRAND.light.border}; border-radius:10px; padding:22px; text-align:center; font-size:34px; font-weight:700; letter-spacing:10px; color:${BRAND.light.ink}; margin:22px 0; font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace; }
    .panel { background:#f4f5f7; border-radius:10px; padding:20px; margin:16px 0; }
    .alert-box { border-left:4px solid #ef4444; background:#fef2f2; padding:16px 20px; border-radius:0 8px 8px 0; margin:16px 0; color:#7f1d1d; }
    .success-box { border-left:4px solid #22c55e; background:#f0fdf4; padding:16px 20px; border-radius:0 8px 8px 0; margin:16px 0; color:#14532d; }
    .kv { font-size:13px; color:${BRAND.light.muted}; margin:5px 0; }
    .kv strong { color:${BRAND.light.ink}; }
    .footer { background:#f9fafb; padding:24px 40px; border-top:1px solid ${BRAND.light.border}; }
    .footer-text { font-size:12px; color:${BRAND.light.faint}; line-height:1.6; margin:0; }
    .ln-table { width:100%; border-collapse:collapse; margin:16px 0; }
    .ln-th { padding:8px 0; font-size:11px; color:${BRAND.light.faint}; border-bottom:1px solid ${BRAND.light.border}; text-transform:uppercase; letter-spacing:0.6px; text-align:left; }
    .ln-td { padding:11px 0; font-size:14px; color:${BRAND.light.ink}; border-bottom:1px solid #f4f4f5; }
    .ln-total { padding:14px 0 0; font-size:16px; font-weight:700; color:${BRAND.light.ink}; }

    @media (max-width:480px) {
      .content { padding:28px 22px!important; }
      .header { padding:22px 22px!important; }
      .footer { padding:20px 22px!important; }
      .h1 { font-size:21px!important; }
      .code-box { font-size:28px!important; letter-spacing:8px!important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .wrapper { background:${BRAND.dark.bg}!important; }
      .container { background:${BRAND.dark.surface}!important; border-color:${BRAND.dark.border}!important; box-shadow:none!important; }
      .header { background:#000000!important; }
      .h1 { color:${BRAND.dark.ink}!important; }
      .text { color:${BRAND.dark.muted}!important; }
      .muted, .footer-text { color:${BRAND.dark.faint}!important; }
      .btn { background:#ffffff!important; color:#09090b!important; }
      .btn-danger { background:#ef4444!important; color:#ffffff!important; }
      .panel { background:#1f1f23!important; }
      .code-box { background:#1f1f23!important; border-color:${BRAND.dark.border}!important; color:${BRAND.dark.ink}!important; }
      .divider, .ln-th, .ln-td { border-color:${BRAND.dark.border}!important; }
      .kv { color:${BRAND.dark.muted}!important; }
      .kv strong, .ln-td, .ln-total { color:${BRAND.dark.ink}!important; }
      .footer { background:#101013!important; border-color:${BRAND.dark.border}!important; }
      .alert-box { background:#2a1414!important; color:#fca5a5!important; }
      .success-box { background:#0f2417!important; color:#86efac!important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BRAND.light.bg};">
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preview)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <div class="wrapper" style="background:${BRAND.light.bg};padding:24px 12px;">
    <div class="container">
      <div class="header" style="background:${BRAND.light.accent};padding:26px 40px;">
        <a href="${escapeHtml(appUrl)}" class="header-logo" style="color:#ffffff;font-size:19px;font-weight:700;text-decoration:none;">${escapeHtml(BRAND.name)}</a>
      </div>
      <div class="content" style="padding:40px;">${content}</div>
      <div class="footer" style="background:#f9fafb;padding:24px 40px;border-top:1px solid ${BRAND.light.border};">
        <p class="footer-text" style="font-size:12px;color:${BRAND.light.faint};line-height:1.6;margin:0;">
          ${footerNote ? `${footerNote}<br />` : 'You received this email because you have an account with Baalvion.<br />'}
          &copy; ${year} Baalvion. All rights reserved.<br />
          <a href="${escapeHtml(appUrl)}" style="color:#71717a;">${escapeHtml(appUrl.replace(/^https?:\/\//, ''))}</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { baseLayout, escapeHtml, BRAND };
