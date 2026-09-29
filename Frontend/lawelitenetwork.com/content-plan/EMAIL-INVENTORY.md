# Email address inventory — Law Elite Network (generated 2026-09-21; updated after Prompt 10 to Model A)

Every email address string in src/, docs/seed-data.json, next.config.ts and .env.example. Nothing was changed; the owner decides which domain to use. Counts are string matches, so a visible address and its mailto link count separately. All addresses are hardcoded in page/component source (no shared config).

| Address | Domain | Uses | Where (file:line) |
|---|---|---|---|
| Founder@baalvion.com | baalvion.com | 6 (contact address) | src/app/privacy-policy/page.tsx:164; src/app/privacy-policy/page.tsx:164; src/app/privacy-policy/page.tsx:182; src/app/privacy-policy/page.tsx:182; src/app/contact-us/page.tsx:29; src/app/contact-us/page.tsx:30 |
| name@firm.com | firm.com | 4 (placeholder / demo (form hint, login demo)) | src/app/forgot-password/page.tsx:65; src/components/forms/LoginForm.tsx:164; src/components/forms/LoginForm.tsx:242; src/components/forms/SignupForm.tsx:120 |
| accessibility@lawelitenetwork.com | lawelitenetwork.com | 2 (contact address) | src/app/accessibility/page.tsx:73; src/app/accessibility/page.tsx:73 |
| advertise@lawelitenetwork.com | lawelitenetwork.com | 2 (contact address) | src/app/editorial-disclosure-policy/page.tsx:170; src/app/editorial-disclosure-policy/page.tsx:170 |
| corrections@lawelitenetwork.com | lawelitenetwork.com | 7 (contact address) | src/app/conflict-of-interest-policy/page.tsx:80; src/app/conflict-of-interest-policy/page.tsx:80; src/app/corrections/page.tsx:40; src/app/corrections/page.tsx:40; src/app/corrections/page.tsx:85; src/app/corrections/page.tsx:85; src/components/knowledge/ReportAnError.tsx:19 |
| dmca@lawelitenetwork.com | lawelitenetwork.com | 4 (contact address) | src/app/editorial-disclosure-policy/page.tsx:122; src/app/editorial-disclosure-policy/page.tsx:122; src/app/editorial-disclosure-policy/page.tsx:168; src/app/editorial-disclosure-policy/page.tsx:168 |
| editorial@lawelitenetwork.com | lawelitenetwork.com | 4 (contact address) | src/app/about-us/page.tsx:224; src/app/about-us/page.tsx:224; src/app/editorial-standards/page.tsx:224; src/app/editorial-standards/page.tsx:224 |
| legal@lawelitenetwork.com | lawelitenetwork.com | 6 (contact address) | src/app/terms-of-service/page.tsx:161; src/app/terms-of-service/page.tsx:161; src/app/terms-of-service/page.tsx:281; src/app/terms-of-service/page.tsx:281; src/app/editorial-disclosure-policy/page.tsx:172; src/app/editorial-disclosure-policy/page.tsx:172 |
| permissions@lawelitenetwork.com | lawelitenetwork.com | 4 (contact address) | src/app/editorial-disclosure-policy/page.tsx:117; src/app/editorial-disclosure-policy/page.tsx:117; src/app/editorial-disclosure-policy/page.tsx:169; src/app/editorial-disclosure-policy/page.tsx:169 |
| privacy@lawelitenetwork.com | lawelitenetwork.com | 2 (contact address) | src/app/cookie-policy/page.tsx:82; src/app/cookie-policy/page.tsx:82 |
| tips@lawelitenetwork.com | lawelitenetwork.com | 1 (contact address) | src/components/knowledge/ArticleSidebar.tsx:83 |
| admin@test.com | test.com | 1 (placeholder / demo (form hint, login demo)) | src/app/login/page.tsx:22 |
| client@test.com | test.com | 1 (placeholder / demo (form hint, login demo)) | src/app/login/page.tsx:20 |
| lawyer@test.com | test.com | 1 (placeholder / demo (form hint, login demo)) | src/app/login/page.tsx:21 |

## Contact-address counts by domain
- lawelitenetwork.com: 32 occurrences
- baalvion.com: 6 occurrences

## Other contact details in the same files
- Phone +91 89512 84770 (tel: link) in src/app/privacy-policy/page.tsx.


## Final state after Prompt 10 (Model A)
Model A: public/editorial contact is @lawelitenetwork.com; corporate/legal ownership contact is @baalvion.com. No new mailbox was invented; every address below already existed in the source.

| Change | Where | Before | After |
|---|---|---|---|
| Public contact card (general, membership, editorial, press, privacy/legal) | src/app/contact-us/page.tsx:29-30 | Founder@baalvion.com | editorial@lawelitenetwork.com |
| Data-rights requests | src/app/privacy-policy/page.tsx:164 | Founder@baalvion.com | privacy@lawelitenetwork.com |
| Privacy contact list | src/app/privacy-policy/page.tsx:182-183 | Email: Founder@baalvion.com | Privacy enquiries: privacy@lawelitenetwork.com, plus "Company (owner) contact: Founder@baalvion.com" (kept, next to the Baalvion Industries operating office) |

Remaining @baalvion.com: Founder@baalvion.com, 2 occurrences (visible text + mailto), privacy-policy only, as the company/owner contact. Everything else contact-related is @lawelitenetwork.com (editorial@, corrections@, legal@, privacy@, accessibility@, permissions@, dmca@, advertise@, tips@). Placeholder/test addresses (name@firm.com, admin@/client@/lawyer@test.com) were not touched. Every mailto: href equals its visible text. Human check: confirm the @lawelitenetwork.com mailboxes (esp. privacy@ and editorial@, now the primary public contacts) are provisioned and monitored; nothing in the repo can prove that.


## Final state after the legal-contact change (supersedes the Prompt 10 table above)
Corporate/ownership/legal: **legal@baalvion.com**. Law Elite Network editorial/operational: existing @lawelitenetwork.com addresses. Founder@baalvion.com and legal@lawelitenetwork.com no longer appear anywhere. No mailbox was invented (legal@baalvion.com was supplied by the owner).

| Where | Address now |
|---|---|
| src/app/contact-us/page.tsx | editorial@lawelitenetwork.com (general card); legal@baalvion.com (Registered Office block) |
| src/app/privacy-policy/page.tsx | privacy@lawelitenetwork.com (rights + enquiries); legal@baalvion.com (corporate/legal contact) |
| src/app/terms-of-service/page.tsx (2 places) | legal@baalvion.com |
| src/app/editorial-disclosure-policy/page.tsx (ownership/structure question) | legal@baalvion.com; dmca@, permissions@, advertise@ stay @lawelitenetwork.com |
| corrections@, editorial@, privacy@, accessibility@, tips@ (corrections page, editorial-standards, about-us, cookie-policy, accessibility, ReportAnError, ArticleSidebar) | unchanged, @lawelitenetwork.com |

@baalvion.com occurrences: legal@baalvion.com only (5 places, each visible text = mailto). Placeholder/test addresses untouched. There is no separate disclaimer/legal-notice page and the footer carries no email address. Still unverifiable from the repo: that the @lawelitenetwork.com and legal@baalvion.com mailboxes exist.
