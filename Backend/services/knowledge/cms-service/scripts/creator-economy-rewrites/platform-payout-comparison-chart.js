'use strict';
/*
 * De-templated rewrite for /creator-economy/platform-payout-comparison-chart.
 * Broader than cross-platform-payout-comparison-tiktok-youtube-and-x (which
 * focuses specifically on ad-revenue-share mechanics for YouTube/TikTok/X):
 * this one is a decision-oriented chart spanning direct payouts, brand
 * deals, and website ad revenue, framed around "which model for which
 * content type."
 */

const bodyHtml = `
<p>A creator weighing where to put their time is really weighing several unrelated payout models against each other — direct platform payouts, brand sponsorships, and (for creators who also run a website) display ad revenue. They don't compete for the same content the same way, so the useful comparison isn't just "which pays more" but "which model fits which content."</p>

<h2>The full comparison</h2>
<p>Every row below is sourced from the platform-specific breakdowns covered in depth elsewhere on this site — this table exists to put them side by side for a single decision, not to replace the detail behind each number.</p>
<table>
<thead><tr><th>Model</th><th>Typical rate</th><th>Best suited to</th></tr></thead>
<tbody>
<tr><td>YouTube long-form (AdSense)</td><td>$2–$10 / 1,000 views</td><td>Evergreen, rewatchable long-form content</td></tr>
<tr><td>YouTube Shorts / TikTok Creator Rewards</td><td>$0.03–$1.00 / 1,000 views</td><td>High-volume, low-production-cost short-form</td></tr>
<tr><td>Website display ads (Mediavine/Raptive)</td><td>$15–$40+ / 1,000 sessions</td><td>Evergreen SEO content with repeat/search traffic</td></tr>
<tr><td>Direct brand sponsorship</td><td>$15–$80 CPM equivalent, scales by tier</td><td>Any format with a specific, sellable audience niche</td></tr>
<tr><td>Affiliate commissions</td><td>5–30% of sale, or flat fee</td><td>Product reviews, comparisons, buying-guide content</td></tr>
<tr><td>YouTube channel memberships</td><td>70% creator share, $0.99–$99.99/month tiers</td><td>Channels with a dedicated recurring audience, 500+ subscribers</td></tr>
</tbody>
</table>

<h2>Memberships don't fit the "rate" framing at all</h2>
<p>Unlike every other row in this table, channel memberships aren't priced by view count or negotiated per deal — they're a flat recurring subscription a creator sets themselves ($0.99–$99.99, typically structured as 2–3 tiers), with YouTube taking a fixed 30% and the creator keeping 70%. Eligibility unlocks at just 500 subscribers, far below the Partner Program's ad-monetization bar, making it accessible to channels too small to qualify for AdSense at all.</p>

<h2>The pattern underneath the numbers</h2>
<p>Every direct platform payout (YouTube ads, Shorts, TikTok Creator Rewards) is priced by the platform based on advertiser demand for that specific ad inventory — a creator has no direct negotiating leverage over the rate itself, only over how much volume they generate. Brand sponsorships and affiliate deals, by contrast, are negotiated directly between the creator and a specific brand, meaning the rate reflects that creator's specific audience value to that specific brand — which is exactly why sponsorships routinely out-pay platform ad revenue by several multiples on the same piece of content.</p>

<h2>Website display ads sit in an unusual middle position</h2>
<p>Unlike video-platform ad revenue, website RPM on a premium managed network ($15–$40+/1,000 sessions) is close to or above typical sponsorship-equivalent rates — the main reason SEO-driven blog content, once it reaches a network's traffic minimum, can out-earn video content per unit of audience reached, despite having no sponsorship negotiation involved at all.</p>

<h2>Choosing where to invest production effort</h2>
<p>Content with lasting search value (how-to guides, comparisons, evergreen reference pieces) captures value from platform ads and website display ads over a long tail of time. Content built around a specific, sellable audience niche captures more value from direct sponsorships and affiliate placement. Most working creators run a portfolio across all of these rather than optimizing for a single model, since each rewards a different kind of content they're likely already producing anyway.</p>
`.trim();

const faq = [
  {
    question: 'Why do website display ads sometimes pay more per audience member than video platform ads?',
    answer:
      'A premium managed ad network on a website ($15–$40+ per 1,000 sessions) prices against a different, often more valuable ad inventory type than in-video ads, and doesn’t split revenue the way YouTube’s 55/45 creator split does. For evergreen, search-driven content, this can out-earn equivalent video-platform ad revenue per unit of audience reached.',
  },
  {
    question: 'Can a creator negotiate a better rate on YouTube AdSense the way they can with a brand sponsorship?',
    answer:
      'No — AdSense and similar direct platform payouts are priced by the platform based on aggregate advertiser demand for that ad inventory, not negotiated per creator. Brand sponsorships and affiliate deals are negotiated directly, which is why the rate can reflect a specific creator’s specific audience value rather than a platform-wide average.',
  },
  {
    question: 'Where do YouTube channel memberships fit in this comparison?',
    answer:
      'They don’t fit the per-view/per-deal framing at all — memberships are a flat recurring subscription ($0.99–$99.99, creator keeps 70%) that a creator sets themselves, unlocking at just 500 subscribers. It’s accessible to channels too small to even qualify for AdSense, and doesn’t depend on advertiser demand or landing a brand deal.',
  },
  {
    question: 'Should a creator pick one payout model and focus on it exclusively?',
    answer:
      'Usually not — different models reward different content types the creator is often already producing (evergreen guides suit ads and website RPM; niche-specific content suits sponsorships and affiliate placement). Most working creators run several models simultaneously rather than optimizing around just one.',
  },
];

const keyTakeaways = [
  'Direct platform payouts (YouTube ads, Shorts, TikTok Creator Rewards) are priced by the platform from advertiser demand, with no per-creator negotiation; sponsorships and affiliate deals are negotiated directly and priced to that creator’s specific audience.',
  'That negotiation difference is the core reason sponsorships routinely out-pay platform ad revenue on comparable content by several multiples.',
  'Website display ads on a premium managed network ($15–$40+/1,000 sessions) can out-earn equivalent video-platform ad revenue per unit of audience, especially for evergreen, search-driven content.',
  'Content type should drive which model to prioritize: evergreen/search content favors ads and website RPM; niche-audience content favors sponsorships and affiliate placement — most creators run several models at once rather than choosing one.',
  'Channel memberships are a structurally different, flat-recurring model (70% creator share, $0.99–$99.99 tiers) unlocking at just 500 subscribers — accessible even to channels too small for AdSense.',
];

const citations = [
  { title: 'YouTube Sponsorship Rates 2026 (ytmoneycalculator)', url: 'https://ytmoneycalculator.com/blog/youtube-sponsorship-rates/' },
  { title: 'Mediavine vs Raptive: Which Pays More in 2026 (monetizepros.com)', url: 'https://monetizepros.com/ad-serving-and-optimization/mediavine-vs-raptive/' },
  { title: 'YouTube Channel Memberships 2026 (uscreen.tv)', url: 'https://www.uscreen.tv/blog/youtube-channel-memberships/' },
];

module.exports = {
  slug: 'platform-payout-comparison-chart',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
  tool: { type: 'creator-rpm-calculator' },
};
