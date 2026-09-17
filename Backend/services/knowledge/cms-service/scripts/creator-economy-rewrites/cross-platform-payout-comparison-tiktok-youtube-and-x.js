'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/cross-platform-payout-comparison-tiktok-youtube-and-x.
 * Covers a genuinely current event: X retired its Creator Revenue Sharing
 * program on September 7, 2026 and replaced it with Original Content Rewards
 * on September 8 — verified against X's own help center, not a fabricated
 * or stale claim.
 */

const bodyHtml = `
<p>YouTube, TikTok, and X all pay creators for views, but the mechanics differ enough that "which platform pays best" doesn't have a single answer — it depends on your content length, audience geography, and, as of this month, which program X has you enrolled in at all.</p>

<h2>YouTube: highest ceiling, most demanding requirements</h2>
<p>Long-form YouTube RPM runs roughly $2–$10 per 1,000 views, with a fixed 55% creator share of ad revenue. It requires the most to get started: 1,000 subscribers plus 4,000 watch hours (or the Shorts-views alternative path), and Shorts on the same channel pay a separate, much lower $0.03–$0.10 per 1,000 views through a pooled fund rather than direct ad sales.</p>

<h2>TikTok Creator Rewards: lower ceiling, faster path to eligibility</h2>
<p>TikTok's Creator Rewards Program pays roughly $0.40–$1.00 per 1,000 <em>qualified</em> views — views on videos over one minute long, from an account with 10,000+ followers and 100,000 views in the trailing 30 days. Qualified views typically run 50–70% of total views, so the effective rate against your total view count is lower than the headline number suggests. There's no long-form/short-form split the way YouTube has one; the threshold is simply video length.</p>

<h2>X: the program changed this month</h2>
<p>X's ad-revenue-sharing program for creators, in place since 2023, officially closed to new participants on August 7, 2026 and stopped paying out entirely on September 7, 2026. It has been replaced by the <strong>Original Content Rewards Program</strong>, effective September 8, which pays for original posts reaching Premium subscribers rather than for ad impressions served against reply threads.</p>
<p>To enroll in the new program, a creator needs 500 verified followers, 500,000 qualified impressions on the Home Timeline in the trailing 90 days, an active X Premium/Premium+/Business subscription, and content meeting X's originality standard — a post that's mostly reposted or unoriginal content doesn't qualify. "Qualified impressions" only count unique views from Premium subscribers where at least half the post was visible on screen. Payouts run every two weeks with a $30 minimum, processed through the same Creator Studio application flow the old program used. Anyone whose monetization was previously paused for a policy violation is not eligible to enroll.</p>
<p>Practically: if you were earning through X's old reply-engagement model, that revenue stopped on September 7. Re-qualifying under the new originality-and-reach criteria is not automatic.</p>

<h2>Geography moves all three, not just YouTube</h2>
<p>It's tempting to treat YouTube's audience-geography effect as a YouTube-specific quirk, but it isn't. TikTok's Creator Rewards RPM is also weighted by where the qualified views come from — a U.S.-heavy audience earns meaningfully more per 1,000 qualified views than an audience concentrated in lower-ad-spend markets, with some estimates putting a Brazil-weighted audience at roughly a third of a U.S.-weighted one on the same view count. The same logic will likely apply to X's Original Content Rewards pool once enough payout data exists publicly, since Premium subscriber density varies by country just like ad demand does. Whichever platform you're comparing, "average RPM" numbers assume a specific, usually U.S.-skewed audience mix that may not match yours.</p>

<h2>Side-by-side view</h2>
<table>
<thead><tr><th>Platform</th><th>Typical rate</th><th>Entry requirement</th></tr></thead>
<tbody>
<tr><td>YouTube (long-form)</td><td>$2–$10 / 1,000 views</td><td>1,000 subs + 4,000 watch hours</td></tr>
<tr><td>YouTube Shorts</td><td>$0.03–$0.10 / 1,000 views</td><td>Same YPP acceptance as above</td></tr>
<tr><td>TikTok Creator Rewards</td><td>$0.40–$1.00 / 1,000 qualified views</td><td>10,000 followers + 100,000 views/30 days</td></tr>
<tr><td>X Original Content Rewards</td><td>Pool-based, not a flat per-view rate</td><td>500 followers + 500,000 qualified impressions/90 days + Premium subscription</td></tr>
</tbody>
</table>

<h2>Estimate your own numbers</h2>
<p>Use the calculator below for YouTube and TikTok — X's new program doesn't publish a per-view rate to model, since payouts are pooled rather than sold against a fixed rate.</p>
`.trim();

const faq = [
  {
    question: 'Is X still paying creators through the ad revenue sharing program?',
    answer:
      'No. That program stopped accepting new participants on August 7, 2026 and stopped paying out entirely on September 7, 2026. It has been replaced by the Original Content Rewards Program, which launched September 8, 2026 and pays based on original-content reach to Premium subscribers rather than reply-ad impressions.',
  },
  {
    question: 'What counts as a "qualified impression" under X’s new program?',
    answer:
      'A unique impression from an X Premium, Premium+, or Premium Business subscriber on the Home Timeline, where at least 50% of the post was visible on screen. Impressions from non-subscribers, or from other surfaces like the reply timeline, don’t count.',
  },
  {
    question: 'Which platform has the easiest bar to start earning?',
    answer:
      'X’s new program has the lowest follower requirement (500) but a high 90-day impression bar (500,000) and requires a paid Premium subscription. TikTok requires 10,000 followers. YouTube requires 1,000 subscribers plus a watch-hour or Shorts-views threshold. None of the three is simply "easiest" — they trade off differently.',
  },
];

const keyTakeaways = [
  'YouTube long-form has the highest per-view ceiling ($2–$10/1,000 views, 55% creator share) but the most demanding entry bar (1,000 subscribers + 4,000 watch hours).',
  'TikTok Creator Rewards pays $0.40–$1.00 per 1,000 qualified views, but qualified views typically run only 50–70% of total views — the effective rate against total views is lower than it looks.',
  'X retired its ad-revenue-sharing program on September 7, 2026 and replaced it with the Original Content Rewards Program on September 8 — a fundamentally different, reach-and-originality-based model, not a rate change.',
  'X’s new program requires 500 followers, 500,000 qualified Home Timeline impressions in 90 days, and an active Premium subscription — "qualified" means unique views from Premium subscribers only.',
  'Audience geography moves payouts on TikTok too, not just YouTube — a lower-ad-spend-market audience can earn roughly a third of a U.S.-weighted audience at the same qualified-view count.',
];

const citations = [
  { title: 'X Help — Original Content Rewards Program (official)', url: 'https://help.x.com/en/using-x/original-content-rewards' },
  { title: 'X Help — Creator Revenue Sharing (official, legacy program)', url: 'https://help.x.com/en/using-x/creator-revenue-sharing' },
  { title: 'X Original Content Rewards Program Guide (roo.beehiiv.com)', url: 'https://roo.beehiiv.com/p/x-original-content-rewards-program-guide' },
  { title: 'TikTok Creator Rewards RPM in 2026 (Elev8or)', url: 'https://www.elev8or.io/blog/tiktok-creator-rewards-rpm-2026' },
  { title: 'YouTube Partner Program — official requirements (YouTube for Creators)', url: 'https://www.youtube.com/creators/earn/youtube-partner-program/' },
];

module.exports = {
  slug: 'cross-platform-payout-comparison-tiktok-youtube-and-x',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
  tool: { type: 'creator-rpm-calculator' },
};
