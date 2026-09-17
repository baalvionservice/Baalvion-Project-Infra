'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/display-ad-networks-mediavine-vs-raptive-vs-ezoic.
 * Covers real, current (and recently-changed) eligibility thresholds for
 * the three major premium display-ad networks bloggers/website publishers
 * graduate to once they outgrow raw AdSense.
 */

const bodyHtml = `
<p>Once a website outgrows raw AdSense, publishers typically apply to a premium ad management network that negotiates directly with advertisers and handles header bidding on the site's behalf. The three biggest — Mediavine, Raptive (formerly AdThrive), and Ezoic — have very different entry bars, and two of them changed significantly within the past year.</p>

<h2>Mediavine: 50,000 sessions, GA4-verified</h2>
<p>These figures are all higher than the accessibility bar most publishers picture when they think "ad network" — raw, self-served AdSense has no traffic minimum at all, which is why it remains most small sites' starting point before any of these three become relevant options.</p>
<p>Mediavine requires 50,000 sessions in the trailing 30 days, measured through Google Analytics 4. It's historically been the most accessible of the three premium networks for a mid-sized blog, and publisher-reported RPMs commonly land in the $15–$40 range, occasionally crossing $50 during Q4's advertiser spending surge.</p>

<h2>Raptive: the bar just came down</h2>
<p>A publisher who checked and got rejected under the old 100,000-pageview bar a year or two ago may be eligible now and simply not know it.</p>
<p>Raptive lowered its minimum eligibility from 100,000 to 25,000 pageviews per month in October 2025 — a significant opening for smaller sites that previously had no path to the network historically associated with the highest RPMs among the three. Raptive's publisher-reported earnings per thousand visits (EPMV) still tend to run 25–40% above Mediavine for comparable content, though a publisher now qualifies at a quarter of the traffic that used to be required.</p>

<h2>Ezoic: the bar just went up, sharply</h2>
<p>Ezoic moved the opposite direction. In February 2026, it raised its minimum from 10,000 to 250,000 monthly users — a 25x increase that pushed the network's floor well above both Mediavine's and Raptive's, reversing its longstanding position as the accessible entry point for small publishers. A site that qualified for Ezoic a year ago may no longer meet the current bar at all.</p>

<h2>Meeting the traffic minimum doesn't guarantee acceptance</h2>
<p>All three networks review sites beyond raw traffic numbers before approval — content quality, adherence to Google's own publisher policies, site design, and page load performance all factor into whether an applicant that clears the traffic bar is actually accepted. A site that technically qualifies on sessions or pageviews but carries thin content, policy violations, or a poor user experience can still be rejected, or approved with revenue-limiting conditions until issues are fixed. Traffic minimums are a floor for applying, not a guarantee of acceptance.</p>

<h2>What this means for a publisher choosing a network today</h2>
<p>The practical ranking has flipped from a year ago: Raptive is now the easiest of the three to qualify for by traffic volume, Mediavine sits in the middle, and Ezoic — previously the network built for small sites — now requires more traffic than either of the other two. A publisher choosing where to apply should check current thresholds directly before assuming last year's advice still holds, since two of the three networks moved their bar within the past several months.</p>
`.trim();

const faq = [
  {
    question: 'Which ad network has the lowest traffic requirement right now?',
    answer:
      'Raptive, after lowering its minimum from 100,000 to 25,000 monthly pageviews in October 2025. Mediavine requires 50,000 sessions/30 days. Ezoic now requires 250,000 monthly users after raising its bar from 10,000 in February 2026 — the highest of the three.',
  },
  {
    question: 'Why did Ezoic raise its minimum traffic requirement so dramatically?',
    answer:
      'Ezoic increased its eligibility floor from 10,000 to 250,000 monthly users in February 2026, a 25x jump that moved it from the most accessible network for small publishers to the least. The company has not published detailed reasoning publicly beyond the eligibility change itself.',
  },
  {
    question: 'If my site meets a network’s traffic minimum, am I guaranteed acceptance?',
    answer:
      'No — all three networks also review content quality, compliance with Google’s publisher policies, site design, and page performance before approving an applicant. A site that clears the traffic bar but has thin content or policy issues can still be rejected or approved with conditions until those issues are resolved.',
  },
  {
    question: 'Does a higher RPM network always mean more total revenue?',
    answer:
      'Not necessarily — RPM is revenue per thousand sessions, so total revenue still depends on your actual traffic volume. A network reporting a higher RPM on a site with lower traffic can generate less total revenue than a lower-RPM network on a higher-traffic site.',
  },
];

const keyTakeaways = [
  'Mediavine requires 50,000 GA4-verified sessions in 30 days; RPMs commonly run $15–$40, occasionally exceeding $50 in Q4.',
  'Raptive lowered its minimum from 100,000 to 25,000 monthly pageviews in October 2025, making it the most accessible of the three today despite historically having the highest bar.',
  'Ezoic raised its minimum from 10,000 to 250,000 monthly users in February 2026 — a 25x increase that reversed its position as the network built for small publishers.',
  'The traffic-requirement ranking of these three networks changed significantly within roughly the past year; advice based on older thresholds is now out of date.',
];

const citations = [
  { title: 'Mediavine vs Raptive vs Newor Media (newormedia.com)', url: 'https://newormedia.com/blog/mediavine-vs-raptive-vs-newor-media/' },
  { title: 'Mediavine vs Raptive: Which Pays More in 2026 (monetizepros.com)', url: 'https://monetizepros.com/ad-serving-and-optimization/mediavine-vs-raptive/' },
  { title: 'Ezoic vs Mediavine 2026 (arbitragetimes.com)', url: 'https://arbitragetimes.com/ezoic-vs-mediavine-in-2026-which-platform-wins-for-mid-tier-publishers/' },
];

module.exports = {
  slug: 'display-ad-networks-mediavine-vs-raptive-vs-ezoic',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
