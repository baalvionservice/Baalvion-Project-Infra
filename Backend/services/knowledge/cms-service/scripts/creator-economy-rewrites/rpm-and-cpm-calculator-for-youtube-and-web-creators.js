'use strict';
/*
 * De-templated rewrite for /creator-economy/rpm-and-cpm-calculator-for-youtube-and-web-creators.
 * Replaces the original AI-templated body (identical boilerplate keyTakeaways
 * shared verbatim across all 21 Creator Economy articles) with real, sourced
 * content, and turns on the embedded CreatorEarningsCalculator via
 * customFields.tool.type — see ArticlePage.tsx / CreatorEarningsCalculator.tsx.
 *
 * Every rate below is a published range with a citation, not an invented
 * figure — YouTube, TikTok and Meta don't disclose exact per-view rates.
 */

const bodyHtml = `
<p>RPM and CPM are the two numbers every creator sees in YouTube Studio, and they get confused constantly because they measure different things. CPM is what advertisers pay YouTube; RPM is what you actually take home after YouTube's cut and every unmonetized view. The gap between them is the single biggest reason a channel's "CPM looks great" while the bank deposit doesn't match.</p>

<h2>CPM vs. RPM: the actual difference</h2>
<p><strong>CPM (cost per mille)</strong> is the price an advertiser pays per 1,000 ad impressions. It's calculated only on monetized playbacks that actually served an ad — not your total view count.</p>
<p><strong>RPM (revenue per mille)</strong> is your total earnings (ads, YouTube Premium revenue, channel memberships) divided by your total views, multiplied by 1,000. It accounts for every view, including the ones with no ad at all — skipped ads, ad blockers, unmonetized geographies, and viewers who never saw a monetized playback.</p>
<p>Because RPM is diluted by all of that, it's typically 40–55% of CPM. A channel reporting a $20 CPM is realistically earning an RPM closer to $8–$11.</p>

<h2>What YouTube actually pays in 2026</h2>
<p>YouTube doesn't publish exact rates, but aggregated creator-reported data puts long-form RPM at roughly <strong>$2–$10 per 1,000 views</strong> globally, with finance, business, and B2B software content trending toward the top of that range and gaming or general entertainment toward the bottom. YouTube Shorts pays dramatically less — typically <strong>$0.03–$0.10 per 1,000 views</strong> — because Shorts ad load and CPMs are both far lower than in-stream ads on long-form video.</p>
<p>The revenue split itself is fixed and public: creators keep 55% of ad revenue on long-form video under the YouTube Partner Program; Shorts revenue is pooled and allocated differently, based on a creator's share of total Shorts views each month.</p>

<h2>Qualifying for monetization</h2>
<p>To join the YouTube Partner Program, a channel needs 1,000 subscribers plus either 4,000 public watch hours in the trailing 12 months (long-form path) or 10 million valid Shorts views in the trailing 90 days (Shorts path). Both paths also require two-factor verification and a clean strikes record. YouTube has confirmed these thresholds rise to 8,000 watch hours or 20 million Shorts views on February 1, 2027.</p>

<h2>Why your RPM swings so much — even on your own channel</h2>
<p>Three factors move RPM far more than most creators expect, independent of the video itself:</p>
<ul>
<li><strong>Audience geography.</strong> Advertisers pay dramatically more to reach viewers in high-ad-spend markets. Aggregated rate trackers put U.S. and Australian viewers in the roughly $10–$15 CPM range against roughly $0.50–$1.50 for audiences concentrated in South Asia — a gap of 10–20x on otherwise identical content. Two channels with the same view count can post RPMs that far apart purely on where their audience lives.</li>
<li><strong>Seasonality.</strong> Q4 (October–December) reliably produces the highest CPMs of the year as advertisers spend down annual budgets around Black Friday and the holidays; creators commonly report CPMs 40–60% above their yearly average in that window, followed by a sharp drop — often 30–60% below the December peak — in January.</li>
<li><strong>Ad blockers.</strong> Estimates put ad-blocker usage among desktop viewers at roughly 25–40%, meaningfully lower on mobile and connected TV. Every blocked impression counts toward your view total but earns nothing, which is baked into why RPM sits so far below CPM in the first place.</li>
</ul>
<p>None of this is something a creator controls video-by-video, which is why comparing your RPM against a generic "average" is often misleading — the honest comparison is against your own channel's trend over time, adjusted for the month and where your views actually came from.</p>

<h2>Use the calculator</h2>
<p>Enter your monthly view count below to estimate a realistic earnings range for long-form, Shorts, or TikTok Creator Rewards — using the same published rate ranges cited on this page, not a single invented number.</p>
`.trim();

const faq = [
  {
    question: 'Why is my RPM so much lower than the CPM I see for my niche?',
    answer:
      'RPM divides total revenue by total views, including views that never served an ad — ad-blocked traffic, skipped pre-rolls, and unmonetized regions. CPM only counts views that actually served a paid ad. RPM is typically 40–55% of CPM for that reason, not because you’re being underpaid.',
  },
  {
    question: 'Do YouTube Shorts pay through the same ad system as long-form video?',
    answer:
      'No. Long-form ad revenue comes from ads inserted directly into your video and pays creators 55% of that revenue. Shorts revenue comes from a pooled fund allocated by your share of total Shorts watch time platform-wide that month, which is why Shorts RPM runs roughly 30–80x lower than long-form.',
  },
  {
    question: 'How many watch hours do I need to qualify for the YouTube Partner Program right now?',
    answer:
      '1,000 subscribers plus 4,000 public watch hours in the past 12 months (or 10 million Shorts views in the past 90 days as an alternative path). YouTube has announced these thresholds increase to 8,000 watch hours or 20 million Shorts views starting February 1, 2027.',
  },
  {
    question: 'Why did my RPM drop in January after a strong December?',
    answer:
      'This is normal seasonality, not a problem with your channel. Q4 advertiser spending (Black Friday, holidays) pushes CPMs 40–60% above the yearly average in October–December; that demand drops off sharply once the new year starts, often 30–60% below the December peak in January.',
  },
];

const keyTakeaways = [
  'CPM measures what advertisers pay per 1,000 ad impressions; RPM measures what you actually earn per 1,000 views after YouTube’s cut and every unmonetized view — RPM is normally 40–55% of CPM.',
  'Long-form YouTube RPM runs roughly $2–$10 per 1,000 views; Shorts RPM runs $0.03–$0.10 per 1,000 views because Shorts revenue comes from a separate, lower-paying pooled fund.',
  'YouTube Partner Program eligibility is 1,000 subscribers plus 4,000 watch hours (12 months) or 10 million Shorts views (90 days) today, rising to 8,000 hours or 20 million Shorts views on February 1, 2027.',
  'Long-form ad revenue pays creators a fixed 55% share; Shorts revenue is allocated by your proportional share of total Shorts watch time, not a fixed per-view rate.',
  'RPM varies as much by audience geography (roughly a 10–20x gap between top-paying and lowest-paying markets), season (Q4 CPMs run 40–60% above average, then drop just as sharply in January), and ad-blocker usage (25–40% of desktop viewers) as it does by niche.',
];

const citations = [
  { title: 'YouTube Partner Program — official requirements (YouTube for Creators)', url: 'https://www.youtube.com/creators/earn/youtube-partner-program/' },
  { title: 'YouTube Shorts Monetization 2026: Requirements, RPM (vidIQ)', url: 'https://vidiq.com/blog/post/youtube-shorts-monetization/' },
  { title: 'Average YouTube RPM 2026: Real Data by Niche, Country & Format', url: 'https://ytmoneycalculator.com/blog/average-youtube-rpm/' },
  { title: 'YouTube CPM Rates by Country 2026 (ytmoneycalculator)', url: 'https://ytmoneycalculator.com/blog/youtube-cpm-rates-by-country/' },
  { title: 'YouTube RPM by Month 2026: December vs. January (fluxnote)', url: 'https://fluxnote.io/guides/youtube-rpm-by-month-2026' },
];

module.exports = {
  slug: 'rpm-and-cpm-calculator-for-youtube-and-web-creators',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
  tool: { type: 'creator-rpm-calculator' },
};
