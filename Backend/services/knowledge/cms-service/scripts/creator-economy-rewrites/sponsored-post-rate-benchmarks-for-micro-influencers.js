'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/sponsored-post-rate-benchmarks-for-micro-influencers.
 * Distinct from benchmarking-instagram-creator-sponsorship-rates (which
 * covers Instagram specifically across all tiers): this one is cross-
 * platform, focused specifically on the micro tier (10K-100K).
 */

const bodyHtml = `
<p>"Micro-influencer" gets used as if it's one rate card, but a creator with 50,000 followers on Instagram, YouTube, and TikTok is sitting on three genuinely different sponsorship markets — the gap between the lowest and highest of the three is often larger than the gap between a nano and micro creator on the same platform.</p>

<h2>Micro tier by platform</h2>
<p><strong>YouTube (10K–100K subscribers):</strong> $500–$5,000 per dedicated video, reflecting the higher production bar and typically longer, more considered viewing sessions that long-form video commands from brands.</p>
<p><strong>Instagram (10K–100K followers):</strong> $150–$500 per feed post, $300–$800 per Reel — widely considered the sweet spot tier for Instagram brand deals specifically, where budgets stretch furthest relative to real reach.</p>
<p><strong>TikTok:</strong> rates at the same follower count typically land between Instagram's and YouTube's, though TikTok pricing correlates more loosely with follower count than either of the other two — a video's individual performance and the platform's own for-you-page reach matter more here than on Instagram or YouTube, where a creator's typical reach is more consistent post to post.</p>

<h2>Why the same follower count spans such a wide dollar range</h2>
<p>This is the same production-effort logic that explains rate differences within a single platform too — a Reel commands more than a static post at the same follower tier for exactly the same underlying reason a cross-platform gap exists: more time and skill required to produce it.</p>
<p>The core driver is production effort and format duration, not audience size. A YouTube dedicated video demands a script, filming, and editing on the scale of minutes; an Instagram feed post is comparatively fast to produce. Brands are pricing the deliverable's production cost and expected attention-span, not just "how many people will see this."</p>

<h2>Why the micro tier specifically is where brands concentrate budget</h2>
<p>Brands increasingly favor the micro tier deliberately, not just because it's cheaper than macro or mega tiers in absolute dollars. A micro-influencer's audience is typically more niche and more engaged per follower than a mega-influencer's broader, more diffuse reach, and a brand can run several micro-influencer partnerships in parallel for the cost of one macro deal — spreading risk and reaching multiple distinct audience segments rather than betting a full budget on one creator's single audience.</p>

<h2>What a micro-influencer should ask for beyond the base rate</h2>
<p>Usage rights, exclusivity, and format count are all separate negotiation points from the headline rate, and treating them as included by default under-monetizes the deal. A time-limited usage license (60–90 days) is standard; a brand wanting to run the content in paid ads or keep it indefinitely should pay a premium on top of the organic-post rate for that expanded usage, commonly 30–50% above the base.</p>

<h2>Negotiating across platforms as one micro-influencer</h2>
<p>A creator active on all three platforms has genuine leverage a single-platform creator doesn't: a cross-platform package (one YouTube video plus supporting Instagram and TikTok posts) is a common upsell that brands often pay a bundle premium for, since it saves them running three separate negotiations and campaigns for comparable total reach.</p>
`.trim();

const faq = [
  {
    question: 'Why does my YouTube sponsorship rate look so much higher than my Instagram rate at the same follower count?',
    answer:
      'Production effort and format duration, not audience size, mostly explain the gap. A YouTube dedicated video demands significantly more production time than an Instagram feed post, and brands price the deliverable’s production cost and viewer attention span into the rate, not just reach.',
  },
  {
    question: 'Does TikTok pay similarly to Instagram or YouTube at the micro tier?',
    answer:
      'TikTok rates at the same follower count typically fall between Instagram’s and YouTube’s, but correlate more loosely with follower count overall — an individual video’s for-you-page performance can matter as much as the creator’s follower count, unlike Instagram and YouTube where typical reach is more consistent.',
  },
  {
    question: 'Is it worth offering brands a cross-platform bundle instead of pricing each platform separately?',
    answer:
      'Often yes — a bundled package (e.g. one YouTube video plus supporting Instagram and TikTok posts) commonly commands a premium over the sum of each platform’s standalone rate, since it saves the brand from running three separate campaigns and negotiations for comparable total reach.',
  },
  {
    question: 'Why do brands specifically favor the micro tier rather than just paying for the biggest reach available?',
    answer:
      'Micro-influencer audiences tend to be more niche and engaged per follower than a mega-influencer’s broader reach, and a brand can fund several parallel micro partnerships for the cost of one macro deal — spreading budget across multiple distinct audience segments instead of concentrating it on one creator’s single audience.',
  },
];

const keyTakeaways = [
  'At the same 10K–100K micro tier, YouTube commands $500–$5,000 per dedicated video versus Instagram’s $150–$500 per feed post ($300–$800 per Reel) — the gap is production effort and format, not audience size.',
  'TikTok rates at the micro tier typically fall between Instagram’s and YouTube’s but correlate more loosely with follower count than either platform.',
  'A cross-platform micro-influencer has real negotiating leverage: bundled packages across platforms commonly command a premium over pricing each platform separately.',
  'Pricing should reflect production cost and format, not a single blended "influencer rate" — the same creator legitimately charges very different amounts for a YouTube video vs. an Instagram Story.',
  'Usage rights, exclusivity, and format count are separate negotiation points from the base rate; expanded usage (paid ads, indefinite use) commonly commands a 30–50% premium over a standard organic-post rate.',
];

const citations = [
  { title: 'YouTube Sponsorship Rates 2026 (ytmoneycalculator)', url: 'https://ytmoneycalculator.com/blog/youtube-sponsorship-rates/' },
  { title: 'Instagram Influencer Pricing in 2026 (Influee)', url: 'https://influee.co/blog/instagram-influencer-pricing' },
  { title: 'Sponsored Post Rates 2026 (brandsforcreators)', url: 'https://brandsforcreators.com/rates/sponsored-post-pricing' },
];

module.exports = {
  slug: 'sponsored-post-rate-benchmarks-for-micro-influencers',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
