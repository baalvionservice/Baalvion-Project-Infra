'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/youtube-shorts-monetization-vs-long-form-payout-rates.
 * Distinct angle from rpm-and-cpm-calculator-for-youtube-and-web-creators
 * (which explains RPM/CPM mechanics generally): this one is specifically
 * about WHY the two formats pay so differently and what that means for a
 * creator deciding where to spend production effort.
 */

const bodyHtml = `
<p>A creator posting both Shorts and long-form video on the same channel will see wildly different RPMs between the two — often by a factor of 50 or more — and it's not because Shorts viewers are worth less as an audience. It's because the two formats are paid through completely different mechanisms.</p>

<h2>Long-form: ads sold against your specific video</h2>
<p>On a long-form upload, YouTube inserts ads directly into or around your video and sells that ad space based on your content, audience, and advertiser demand for that context. You keep a fixed <strong>55% of the resulting ad revenue</strong>. Your RPM reflects real advertiser demand for your specific niche — which is why finance, software, and B2B content can post long-form RPMs several times higher than gaming or general entertainment.</p>

<h2>Shorts: a shared pool, not a per-video sale</h2>
<p>Shorts don't work that way. There's no ad sold against your individual Short. Instead, YouTube pools ad revenue generated across all Shorts (plus a portion of YouTube Premium revenue from Shorts viewing) and divides it among eligible creators based on each creator's share of total Shorts views that month. Your payout depends on how much of the total Shorts-watching pie you accounted for, not on which advertiser wanted to reach your specific audience.</p>
<p>That structural difference is the entire reason Shorts RPM runs around <strong>$0.03–$0.10 per 1,000 views</strong> versus <strong>$2–$10 per 1,000 views</strong> for long-form: the ad load per minute watched is far lower on Shorts, and the pool is split across a much larger volume of total views platform-wide.</p>

<h2>The third revenue stream both formats share: YouTube Premium</h2>
<p>Ad revenue isn't the whole picture for either format. YouTube pools 30% of net Premium subscription revenue (and 60% of Premium Lite revenue) and distributes it to creators based on Premium members' watch time on their videos — completely separate from ad impressions. Of that Premium pool, YouTube allocates 55% to long-form and 45% to Shorts. For channels with a Premium-heavy audience, this can account for a meaningful share of total earnings — reporting from 2025 put Premium revenue at up to roughly 30% of total creator revenue on Premium-leaning channels — and it's one more reason two channels with identical ad RPMs can still take home different totals depending on how much of their watch time comes from subscribers.</p>

<h2>Do the math before choosing where to invest effort</h2>
<p>A long-form video with 50,000 views at a $5 RPM earns roughly $250. A Short would need on the order of 5–17 million views at $0.03–$0.10 RPM to match that — a gap most creators underestimate until they see both numbers side by side. That doesn't make Shorts worthless: they're typically far cheaper to produce, can reach non-subscribers through the Shorts feed in a way long-form recommendations don't, and often function as a funnel that grows the subscriber base watching (and monetizing at long-form rates on) your other content. The direct-payout comparison and the strategic-value comparison are two different questions, and conflating them is how creators end up disappointed by a Shorts payout that was never going to compete with long-form on a per-view basis.</p>

<h2>Compare the numbers for your own channel</h2>
<p>Use the calculator below to see the earnings range for your actual monthly view counts on each format.</p>
`.trim();

const faq = [
  {
    question: 'Why does a Short with more views sometimes earn less than a long-form video with fewer views?',
    answer:
      'Long-form ad revenue is sold against your specific video and you keep 55% of it directly. Shorts revenue comes from a shared pool split across every eligible creator’s proportional share of total Shorts views that month — a fundamentally lower-paying mechanism, not a reflection of your audience being less valuable.',
  },
  {
    question: 'Is it worth posting Shorts if the direct RPM is so much lower?',
    answer:
      'For direct ad payout alone, usually not compared to long-form. Shorts earn their keep differently: lower production cost, discovery reach into non-subscribers via the Shorts feed, and a funnel effect that can grow the subscriber base watching your higher-RPM long-form content.',
  },
  {
    question: 'Does a Short need a minimum length to earn anything from the Shorts fund?',
    answer:
      'Yes — YouTube Partner Program payouts apply to Shorts under the standard Shorts monetization mechanism once a channel is accepted into YPP; videos that don’t qualify as Shorts (over 3 minutes) are evaluated under the long-form ad system instead, not the Shorts revenue pool.',
  },
  {
    question: 'Does YouTube Premium pay long-form and Shorts the same way ad revenue does?',
    answer:
      'No, and it’s tracked completely separately from ads. YouTube pools 30% of net Premium subscription revenue (60% for Premium Lite) and distributes it by Premium members’ watch time, splitting that pool 55% to long-form and 45% to Shorts — so a channel’s Premium-heavy audience can shift its real earnings mix even when ad RPM looks identical to a peer’s.',
  },
];

const keyTakeaways = [
  'Long-form ad revenue is sold against your specific video and pays creators a fixed 55% share; Shorts revenue comes from a shared pool split by your proportional share of total Shorts views that month — structurally different systems, not just different rates.',
  'That structural difference is why Shorts RPM ($0.03–$0.10/1,000 views) runs roughly 30–80x lower than long-form RPM ($2–$10/1,000 views).',
  'A 50,000-view long-form video at $5 RPM ($250) needs a Short to hit roughly 5–17 million views to match it at Shorts rates — a gap worth calculating before assuming view count alone predicts earnings.',
  'Shorts still earn their keep through non-monetary value: lower production cost, Shorts-feed discovery into non-subscribers, and a funnel effect that grows the audience watching your higher-RPM long-form content.',
  'YouTube Premium revenue runs on a third, separate mechanism: 30% of net Premium revenue (60% for Premium Lite) is pooled by Premium watch time and split 55/45 between long-form and Shorts — it can be up to roughly 30% of total earnings on Premium-heavy channels.',
];

const citations = [
  { title: 'YouTube Partner Program — official requirements (YouTube for Creators)', url: 'https://www.youtube.com/creators/earn/youtube-partner-program/' },
  { title: 'YouTube Shorts Monetization 2026: Requirements, RPM (vidIQ)', url: 'https://vidiq.com/blog/post/youtube-shorts-monetization/' },
  { title: 'YouTube RPM vs CPM: What Creators Actually Earn in 2026', url: 'https://miraflow.ai/blog/youtube-rpm-vs-cpm-what-creators-actually-earn-2026' },
  { title: 'YouTube Premium Revenue for Creators: What Google Actually Documents (CreatiCalc)', url: 'https://creaticalc.com/blog/youtube-premium-revenue-for-creators' },
];

module.exports = {
  slug: 'youtube-shorts-monetization-vs-long-form-payout-rates',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
  tool: { type: 'creator-rpm-calculator' },
};
