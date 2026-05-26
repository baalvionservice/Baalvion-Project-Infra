'use strict';

// Base email layout — all templates wrap their content in this
const baseLayout = (content, previewText = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Baalvion</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin:0; padding:0; background:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width:600px; margin:32px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
    .header { background:#09090b; padding:28px 40px; }
    .header-logo { color:#ffffff; font-size:18px; font-weight:700; letter-spacing:-0.5px; text-decoration:none; }
    .body { padding:40px; }
    .h1 { font-size:22px; font-weight:700; color:#09090b; margin:0 0 16px; }
    .text { font-size:15px; color:#52525b; line-height:1.6; margin:0 0 16px; }
    .btn { display:inline-block; background:#09090b; color:#ffffff !important; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:14px; font-weight:600; margin:16px 0; }
    .btn-danger { background:#dc2626; }
    .divider { border:none; border-top:1px solid #e4e4e7; margin:28px 0; }
    .code-box { background:#f4f5f7; border:1px solid #e4e4e7; border-radius:6px; padding:20px; text-align:center; font-size:32px; font-weight:700; letter-spacing:8px; color:#09090b; margin:20px 0; }
    .footer { background:#f9fafb; padding:24px 40px; border-top:1px solid #e4e4e7; }
    .footer-text { font-size:12px; color:#a1a1aa; line-height:1.6; margin:0; }
    .alert-box { border-left:4px solid #ef4444; background:#fef2f2; padding:16px 20px; border-radius:0 6px 6px 0; margin:16px 0; }
    .success-box { border-left:4px solid #22c55e; background:#f0fdf4; padding:16px 20px; border-radius:0 6px 6px 0; margin:16px 0; }
    .meta-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f4f4f5; font-size:13px; }
    .meta-label { color:#a1a1aa; }
    .meta-value { color:#09090b; font-weight:500; }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${previewText}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>` : ''}
  <div class="container">
    <div class="header">
      <a href="{{appUrl}}" class="header-logo">Baalvion</a>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p class="footer-text">
        You received this email because you have an account at Baalvion.<br />
        &copy; ${new Date().getFullYear()} Baalvion. All rights reserved.<br />
        <a href="{{appUrl}}/settings/notifications" style="color:#71717a">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;

module.exports = { baseLayout };
