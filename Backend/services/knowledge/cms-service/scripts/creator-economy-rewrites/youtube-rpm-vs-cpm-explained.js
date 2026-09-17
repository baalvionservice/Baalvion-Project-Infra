'use strict';
/*
 * De-templated rewrite for /creator-economy/youtube-rpm-vs-cpm-explained.
 * Deliberately distinct from rpm-and-cpm-calculator-for-youtube-and-web-creators
 * (which covers rate ranges, eligibility, and platform mechanics broadly):
 * this one is a step-by-step worked-math explainer of the actual formulas.
 */

const bodyHtml = `
<p>Most explanations of RPM and CPM stop at "RPM is what you earn, CPM is what advertisers pay" without ever showing the arithmetic. Here's the actual math behind both numbers, worked through with real figures.</p>

<h2>CPM, step by step</h2>
<p>This is the number advertisers themselves talk about and negotiate around — it's the price of the inventory, independent of any particular creator's payout structure.</p>
<p>CPM stands for cost per mille (mille = thousand). The formula is:</p>
<p><strong>CPM = (ad revenue ÷ monetized playbacks) × 1,000</strong></p>
<p>Say an advertiser's campaign generates $80 in ad revenue across 4,000 monetized playbacks (playbacks that actually served an ad). CPM = (80 ÷ 4,000) × 1,000 = <strong>$20</strong>. Note the denominator: monetized playbacks, not total views. A view that never served an ad — skipped, blocked, or simply unmonetized — isn't counted here at all.</p>

<h2>RPM, step by step</h2>
<p>This is the number that actually lands on your dashboard as "your" earnings per thousand views — the one creators mean when they casually say "my RPM," even though it's really answering a broader question than CPM does.</p>
<p>RPM stands for revenue per mille. The formula looks similar but uses a completely different denominator:</p>
<p><strong>RPM = (total revenue ÷ total views) × 1,000</strong></p>
<p>"Total revenue" here includes ad revenue plus YouTube Premium revenue and channel memberships — everything, not just ads. "Total views" means every view the video got, whether or not it ever served an ad. Using the same $80 in ad revenue from above, but now against 10,000 total views (the 4,000 monetized plus 6,000 that never served an ad, for whatever reason): RPM = (80 ÷ 10,000) × 1,000 = <strong>$8</strong>.</p>

<h2>Same video, two very different numbers</h2>
<p>That single video posted a $20 CPM and an $8 RPM — a $12 gap, entirely explained by the different denominator (4,000 monetized playbacks vs. 10,000 total views) and RPM's broader revenue definition. Neither number is wrong; they're answering different questions. CPM answers "what's this ad inventory worth to an advertiser?" RPM answers "what did this video actually earn me, per thousand people who watched it, all-in?"</p>

<h2>The number in YouTube Studio isn't final until the month closes</h2>
<p>YouTube Studio shows RPM and revenue figures labeled "estimated" throughout the current calendar month, before they're finalized — accrued earnings finalize and post to your balance by roughly the 3rd–10th of the following month (the same finalization step the AdSense payment schedule runs on). Checking your RPM for a video mid-month, while that month's earnings are still labeled "estimated," is checking a number that hasn't finished settling — it can move slightly as invalid-traffic filtering and billing reconciliation complete before finalization.</p>

<h2>Why RPM is consistently lower, and by roughly how much</h2>
<p>Because RPM's denominator (total views) is always ≥ CPM's denominator (monetized playbacks only), and its numerator, while larger, rarely grows proportionally as much, RPM typically works out to 40–55% of CPM in practice. If your dashboard shows a $20 CPM and an RPM well outside that 40–55% band — much higher or much lower — it's worth checking whether an unusual share of your views are ad-blocked, geographically low-value, or otherwise unmonetized, since that ratio drifting is usually the reason.</p>
`.trim();

const faq = [
  {
    question: 'What exactly counts as a "monetized playback" in the CPM formula?',
    answer:
      'A playback where an ad was actually served and eligible to generate revenue — not every view of your video. Skipped ads, ad-blocked views, and views in unmonetized regions don’t count as monetized playbacks, which is why CPM’s denominator is always smaller than RPM’s.',
  },
  {
    question: 'Does RPM include YouTube Premium and membership revenue, or just ads?',
    answer:
      'RPM’s "total revenue" numerator includes ad revenue, YouTube Premium revenue attributable to the video, and channel memberships — everything, not just ads. CPM, by contrast, is calculated purely on ad revenue against monetized ad playbacks.',
  },
  {
    question: 'Why does the RPM on a video I just published keep changing when I check it?',
    answer:
      'Because it’s still labeled "estimated" until the month closes and finalizes — by roughly the 3rd–10th of the following month, the same finalization window the AdSense payment schedule runs on. Estimated figures can shift slightly as invalid-traffic filtering and billing reconciliation complete before that number locks in.',
  },
  {
    question: 'If my CPM and RPM ratio doesn’t fall in the normal 40–55% range, does that mean something is wrong?',
    answer:
      'Not necessarily wrong, but worth investigating — that ratio drifting outside the typical range usually means an unusual share of your views are ad-blocked, unmonetized in your specific case, or from a low-CPM geography relative to your channel’s norm, rather than a platform error.',
  },
];

const keyTakeaways = [
  'CPM = (ad revenue ÷ monetized playbacks) × 1,000 — counts only playbacks that actually served an ad.',
  'RPM = (total revenue ÷ total views) × 1,000 — counts every view, and includes Premium/membership revenue alongside ads in the numerator.',
  'Worked example: $80 in ad revenue across 4,000 monetized playbacks and 10,000 total views produces a $20 CPM but only an $8 RPM on the exact same video — the gap is entirely the denominator and revenue-scope difference, not an error.',
  'RPM normally works out to 40–55% of CPM; a ratio well outside that band on your own dashboard is worth investigating (ad-block rate, geography, unmonetized views) rather than assuming a platform mistake.',
  'Revenue and RPM figures are labeled "estimated" until the month closes and finalizes (roughly the 3rd–10th of the following month) — checking mid-month means checking a number that hasn’t finished settling yet.',
];

const citations = [
  { title: 'YouTube RPM vs CPM: What Creators Actually Earn in 2026 (miraflow.ai)', url: 'https://miraflow.ai/blog/youtube-rpm-vs-cpm-what-creators-actually-earn-2026' },
  { title: 'Average YouTube RPM 2026 (ytmoneycalculator)', url: 'https://ytmoneycalculator.com/blog/average-youtube-rpm/' },
  { title: 'Payment timelines for AdSense — official Google Help', url: 'https://support.google.com/adsense/answer/7164703?hl=en' },
];

module.exports = {
  slug: 'youtube-rpm-vs-cpm-explained',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
