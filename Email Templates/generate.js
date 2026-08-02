'use strict';
/**
 * Generates every static lifecycle email (welcome, onboarding D1/D3/D7, weekly newsletter,
 * re-engagement) for every brand in _lib/brands.js, using real per-brand tokens instead of the
 * placeholder blue/green swap the previous hand-built files used. Also writes an _otp-sample.html
 * and _lead-sample.html per brand so the OTP/lead-notification templates (wired into backend
 * services separately) can be eyeballed here too.
 *
 * Run: node generate.js   (from this directory, or `node "Email Templates/generate.js"` from repo root)
 */
const fs = require('fs');
const path = require('path');
const { BRANDS } = require('./_lib/brands');
const { CONTENT } = require('./_lib/content');
const {
  renderWelcome,
  renderOnboardingDay,
  renderNewsletter,
  renderReengagement,
  renderOtp,
  renderLeadNotification,
} = require('./_lib/render');

const ROOT = __dirname;
let written = 0;

for (const slug of Object.keys(BRANDS)) {
  const b = BRANDS[slug];
  const c = CONTENT[slug];
  if (!c) {
    console.warn(`SKIP ${slug}: no content entry in _lib/content.js`);
    continue;
  }

  const dir = path.join(ROOT, b.folder);
  fs.mkdirSync(dir, { recursive: true });

  const files = {
    '1_welcome.html': renderWelcome(b, c),
    '2_onboarding_day1.html': renderOnboardingDay(b, c, 1, 1, 1),
    '2_onboarding_day3.html': renderOnboardingDay(b, c, 3, 2, 2),
    '2_onboarding_day7.html': renderOnboardingDay(b, c, 7, 3, 3),
    '3_weekly_newsletter.html': renderNewsletter(b, c),
    '4_reengagement.html': renderReengagement(b, c),
    '5_otp_sample.html': renderOtp(b, { code: '482913', minutes: 5, firstName: 'Alex' }),
    '6_lead_notification_sample.html': renderLeadNotification(b, {
      formName: 'Contact form',
      fields: [
        { k: 'Name', v: 'Jordan Lee' },
        { k: 'Email', v: 'jordan@example.com' },
        { k: 'Company', v: 'Example Ventures' },
        { k: 'Submitted', v: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC' },
      ],
      message: "We're evaluating your platform for a Q3 rollout across three regions. Could someone from your team reach out to discuss enterprise pricing and onboarding timelines?",
    }),
  };

  for (const [name, html] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), html, 'utf8');
    written++;
  }
  console.log(`✓ ${slug} → ${dir} (${Object.keys(files).length} files)`);
}

console.log(`\nDone. ${written} files written across ${Object.keys(BRANDS).length} brands.`);
