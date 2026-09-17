'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/rate-sheets-and-media-kit-templates-for-creators.
 * How-to/structural content, benchmarked against the real rate data
 * already gathered for the other rewrites rather than invented figures.
 */

const bodyHtml = `
<p>A media kit's job is narrow: let a brand decide, in under two minutes, whether this creator's audience fits their campaign and what it costs to work with them. Most creator media kits fail that test by either burying the two numbers that matter under design flourishes, or omitting them entirely and forcing the brand to ask.</p>

<h2>What actually belongs in it</h2>
<p>Skip anything that doesn't serve the brand's actual decision — a media kit is a working document a marketing manager reviews between several creator options, not a portfolio piece meant to impress on design alone.</p>
<p>Five sections do the real work: (1) audience snapshot — follower count per platform plus engagement rate, not follower count alone; (2) audience demographics — age range, gender split, top geographies, pulled from the platform's own creator/business analytics rather than estimated; (3) past brand work — logos or names of previous partners, with results where you're allowed to share them; (4) content samples — links to your actual best-performing sponsored and organic content, not just organic; (5) a rate card by format and platform, not one flat number.</p>

<h2>The rate card is the part creators most often get wrong</h2>
<p>A single "my rate is $X" line forces every brand conversation to start with a negotiation about format and platform that a rate card should have already answered. Structure it the way real rate benchmarks are structured — by platform and format, e.g. Instagram static post / Instagram Reel / Instagram Story / YouTube dedicated video / YouTube integration — each with its own number or range. A creator active across platforms with wildly different per-format economics (a YouTube video commanding 10x an Instagram Story, for instance) who quotes one blended rate is either underpricing their highest-effort format or overpricing their lowest-effort one.</p>

<h2>Anchoring your numbers to real benchmarks, not guesses</h2>
<p>If you don't yet have a track record of paid rates to draw from, anchor to your platform and follower tier's published range rather than picking an arbitrary number: a 10K–100K Instagram account can reasonably start within the $150–$500 feed-post / $300–$800 Reel range that tier typically sees; a 10K–100K YouTube channel can reasonably start within $500–$5,000 per dedicated video. Starting outside those ranges without a specific reason (unusually high engagement, a hard-to-reach niche audience) makes a brand's first move a counter-offer rather than a yes.</p>

<h2>Pull demographics from the platform, not a guess</h2>
<p>Every major platform's own creator or business analytics dashboard (YouTube Studio, Instagram professional accounts, TikTok's Creator Center) reports real follower age ranges, gender split, and top locations — there's no reason to estimate this data when the platform already calculates and shows it. A media kit citing platform-sourced demographics carries more credibility with a brand's marketing team than a self-reported estimate, and takes no extra work to obtain beyond opening the app.</p>

<h2>Keeping it current</h2>
<p>A media kit with stale follower counts or a rate card that hasn't been revisited in a year undersells growth that's already happened. Treat it as a living document updated at least quarterly, not a one-time asset.</p>
`.trim();

const faq = [
  {
    question: 'Should a media kit include one flat rate or a rate card by format?',
    answer:
      'A rate card by platform and format — a YouTube dedicated video, an Instagram Reel, and an Instagram Story have genuinely different production costs and typical rates, often differing by 5–10x. One blended number either underprices the highest-effort format or overprices the lowest-effort one.',
  },
  {
    question: 'What if I don’t have a track record of past paid rates to base my rate card on?',
    answer:
      'Anchor to your platform and follower tier’s published benchmark range instead of guessing — for example, a 10K–100K Instagram account can reasonably start within the $150–$500 feed-post range that tier typically commands. Starting well outside the published range without a specific justification just invites a counter-offer.',
  },
  {
    question: 'Should audience demographics in a media kit be estimated or pulled from somewhere specific?',
    answer:
      'Pull them directly from the platform’s own analytics (YouTube Studio, Instagram professional dashboard, TikTok Creator Center) rather than estimating. Platform-sourced age range, gender split, and location data costs no extra effort to obtain and carries more credibility with a brand’s marketing team than a self-reported guess.',
  },
  {
    question: 'How often should a media kit actually be updated?',
    answer:
      'At minimum quarterly. Follower counts, engagement rates, and past-partner logos all change, and a media kit showing stale numbers understates growth that has already happened — working against you in exactly the negotiation the kit exists to support.',
  },
];

const keyTakeaways = [
  'The two things a brand actually needs from a media kit — audience fit and cost — should be immediately visible, not buried under design or omitted and left for the brand to ask about.',
  'A rate card should be structured by platform and format (not one flat number) — the same creator’s YouTube video and Instagram Story can have a 5–10x rate difference.',
  'Without a paid-rate track record, anchor new rates to your platform/tier’s published benchmark range rather than guessing — starting well outside it invites an automatic counter-offer.',
  'A media kit is a living document; stale follower counts or an outdated rate card undersells growth that has already happened and should be revisited at least quarterly.',
];

const citations = [
  { title: 'Instagram Influencer Pricing in 2026 (Influee)', url: 'https://influee.co/blog/instagram-influencer-pricing' },
  { title: 'YouTube Sponsorship Rates 2026 (ytmoneycalculator)', url: 'https://ytmoneycalculator.com/blog/youtube-sponsorship-rates/' },
];

module.exports = {
  slug: 'rate-sheets-and-media-kit-templates-for-creators',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
