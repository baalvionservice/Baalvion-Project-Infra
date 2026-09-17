'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/ad-revenue-sharing-models-and-cpm-trends.
 * Focuses on the revenue-SPLIT side (what percentage creators keep across
 * different models) rather than repeating the per-view rate ranges other
 * articles already cover in depth.
 */

const bodyHtml = `
<p>Every platform publishes a headline "creator share" number, but the actual split a creator sees depends heavily on which specific revenue stream is being split — ad impressions, Premium subscriptions, and pooled short-form funds are frequently governed by different percentages on the very same platform.</p>

<h2>YouTube runs at least three different splits simultaneously</h2>
<p>Few creators realize this until they specifically go looking for it, since YouTube Studio's revenue dashboard blends all three sources into one combined earnings figure by default rather than surfacing each split separately.</p>
<p>Long-form ad revenue pays creators a fixed 55% share. Shorts revenue comes from a separate pooled fund, not a direct ad sale. YouTube Premium subscription revenue is its own third pool — 30% of net Premium revenue (60% for Premium Lite) — allocated by Premium watch time and then split 55% to long-form / 45% to Shorts within that pool. A creator earning from all three sources on the same channel is really navigating three separate revenue-sharing agreements, not one.</p>

<h2>Website display ads: the split happens twice</h2>
<p>For website publishers, Google's own baseline AdSense split is roughly 68% to the publisher when an advertiser buys through Google Ads, or about 80% when bought through a third-party exchange. A managed ad network (Mediavine, Raptive) negotiates on top of that baseline and takes its own additional cut — the RPM a managed network reports already nets out both layers, so it isn't directly comparable to a raw AdSense percentage without adjusting for that.</p>

<h2>Pooled short-form funds don't publish a percentage at all</h2>
<p>TikTok's Creator Rewards Program and X's new Original Content Rewards Program don't publish a "creator keeps X%" figure the way YouTube's ad-revenue split is public, because the payout is proportional to a pool rather than a percentage of a specific ad sale. The closest equivalent number available is the historical RPM range those pools have produced — not a contractual revenue share.</p>

<h2>Putting the split and the CPM together: a worked example</h2>
<p>A long-form video generating $80 in ad revenue at YouTube's fixed 55% creator share pays the creator $44 — the split itself never changes regardless of whether that $80 came from a $20 CPM against 4,000 monetized playbacks or a $10 CPM against 8,000. What moves your actual dollar take-home, given a fixed split, is entirely the underlying CPM and monetized-playback volume, not the percentage. This is why "what percentage do I keep" and "how much will I actually earn" are different questions with different answers — the split is fixed and public, but it's multiplying a number (raw ad revenue) that moves constantly.</p>

<h2>CPM trend direction: what's actually moving, not just where it sits today</h2>
<p>Beyond the split percentage itself, the underlying CPM that gets split has its own trend: it rises sharply in Q4 as advertisers spend down annual budgets (commonly 40–60% above the yearly average), then drops just as sharply in January. A creator's take-home percentage of revenue can stay perfectly constant while their actual dollar earnings swing significantly, purely from that seasonal CPM movement underneath the fixed split.</p>
`.trim();

const faq = [
  {
    question: 'Does YouTube pay creators the same percentage for every type of revenue?',
    answer:
      'No — long-form ad revenue pays a fixed 55% share, Shorts revenue comes from a separate pooled fund with no fixed per-video percentage, and Premium subscription revenue is a third pool (30% of net Premium revenue) allocated by watch time and split 55/45 between long-form and Shorts. Three different mechanisms, not one blanket split.',
  },
  {
    question: 'Why is a managed ad network’s reported RPM not directly comparable to AdSense’s published revenue-share percentage?',
    answer:
      'Because the split happens twice: Google’s baseline AdSense split (roughly 68% via Google Ads, 80% via third-party exchanges) applies first, then a managed network like Mediavine or Raptive takes its own additional cut on top. The RPM the network reports to you already nets out both layers.',
  },
  {
    question: 'If the revenue split percentage is fixed, why does my actual payout vary so much month to month?',
    answer:
      'Because the split is applied to a constantly moving number — raw ad revenue, driven by CPM and monetized-playback volume, both of which swing with seasonality, niche, and geography. A fixed 55% share of $80 pays $44 whether that $80 came from a high CPM on fewer playbacks or a lower CPM on more — the percentage never explains payout swings, the revenue it’s multiplying does.',
  },
  {
    question: 'What percentage do TikTok and X pay creators from their pooled funds?',
    answer:
      'Neither publishes a fixed percentage the way YouTube’s ad-revenue split is public, because payouts are proportional to a pool of qualifying activity rather than a percentage of a specific ad sale. The closest available figure is the historical RPM range those pools have produced, not a contractual revenue share.',
  },
];

const keyTakeaways = [
  'YouTube runs at least three separate revenue-sharing mechanisms on one channel: 55% fixed on long-form ads, a pooled (non-percentage) Shorts fund, and a third Premium-subscription pool (30% of net Premium revenue, split 55/45 long-form/Shorts).',
  'Website AdSense splits roughly 68% (Google Ads-bought) to 80% (third-party exchange) to the publisher — a managed ad network’s reported RPM already reflects that baseline plus its own additional cut.',
  'TikTok and X’s pooled short-form funds don’t publish a creator-share percentage at all; only a historical RPM range is available, since payout is proportional to a pool rather than a fixed split.',
  'Seasonal CPM swings (Q4 up 40–60%, January down sharply) move actual take-home dollars even when the underlying revenue-share percentage itself never changes.',
];

const citations = [
  { title: 'AdSense revenue share — official Google Help', url: 'https://support.google.com/adsense/answer/180195?hl=en' },
  { title: 'YouTube Premium Revenue for Creators (CreatiCalc)', url: 'https://creaticalc.com/blog/youtube-premium-revenue-for-creators' },
];

module.exports = {
  slug: 'ad-revenue-sharing-models-and-cpm-trends',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
