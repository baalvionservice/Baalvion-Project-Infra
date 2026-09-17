'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/calculating-page-rpm-and-session-revenue.
 * Website/blog display-ad RPM (distinct from the video-platform RPM
 * covered in the YouTube-focused articles).
 */

const bodyHtml = `
<p>Video RPM and website page RPM are calculated the same way in principle — revenue divided by traffic, times 1,000 — but website publishers have to choose which traffic unit they're dividing by, and the wrong choice makes two sites look incomparable when they aren't.</p>

<h2>Page RPM vs. Session RPM: not the same denominator</h2>
<p>Always check which metric a benchmark or a competitor is actually reporting before treating it as an apples-to-apples comparison against your own dashboard.</p>
<p><strong>Page RPM</strong> divides total ad revenue by total pageviews. <strong>Session RPM</strong> divides the same revenue by total sessions instead. A visitor who reads 3 pages in one visit counts as 1 session but 3 pageviews — so page RPM will always read lower than session RPM on the same site, purely from the denominator, not because the site is earning less. Comparing your site's "RPM" against another publisher's without checking which metric they mean is comparing two different formulas.</p>

<h2>What a real website RPM looks like</h2>
<p>Publishers on premium ad management networks (Mediavine, Raptive) commonly report RPMs in the <strong>$15–$40</strong> range, with some crossing $50 during Q4's advertiser spending surge — substantially higher than raw, self-served AdSense, which is one reason graduating to a managed network is usually a website's biggest single revenue jump.</p>

<h2>The revenue-share layer underneath your RPM</h2>
<p>Whatever RPM you see already has Google's cut built in. For ads bought through Google Ads directly, publishers keep roughly 68% of the resulting revenue; for ads bought through third-party exchanges, publishers keep about 80%. A managed ad network like Mediavine or Raptive negotiates on top of that baseline and adds its own additional cut, which is reflected in the RPM they report to you, not added on top of it.</p>

<h2>Ad density and viewability move RPM independent of traffic quality</h2>
<p>Two sites with identical traffic and identical CPM rates can still post different RPMs based purely on how many ad units are placed per page and how many of those units are actually seen (viewability) rather than loaded off-screen and never scrolled to. More ad units generally raises RPM up to a point, then user experience degradation (slower load times, higher bounce rates) starts eroding the traffic quality that produced the RPM in the first place — which is why managed networks like Mediavine and Raptive actively manage ad density and placement on a publisher's behalf rather than simply maximizing unit count.</p>

<h2>Building your own session-revenue estimate</h2>
<p>To estimate monthly revenue from a target session RPM: (monthly sessions ÷ 1,000) × RPM. A site with 200,000 monthly sessions at a $25 session RPM would project roughly $5,000/month — useful for comparing "is switching ad networks worth it" scenarios, as long as both sides of the comparison use the same traffic metric. Run the same formula against your current network's actual reported RPM and a prospective network's typical range for sites like yours before assuming a switch is worth the transition effort — the projected gain, not just the headline RPM difference, is what should drive the decision.</p>
`.trim();

const faq = [
  {
    question: 'Why does my page RPM look lower than the RPM other bloggers report?',
    answer:
      'Check whether they mean page RPM or session RPM — the two use different denominators (pageviews vs. sessions) on the exact same revenue, and a multi-page-per-visit site will always show a lower page RPM than session RPM. It’s a units mismatch, not necessarily lower actual performance.',
  },
  {
    question: 'What is a realistic RPM for a website on a premium ad network?',
    answer:
      'Publishers on Mediavine or Raptive commonly report $15–$40, occasionally exceeding $50 during Q4. Raw AdSense without a managed network typically runs well below that range, which is the main reason sites graduate to a premium network once they hit its traffic minimum.',
  },
  {
    question: 'Why does a site with more ad units on the page sometimes have a lower RPM than one with fewer?',
    answer:
      'Beyond a certain point, adding more ad units degrades user experience (slower loads, higher bounce rates) faster than it adds revenue, and units that load off-screen and are never actually seen (low viewability) don’t earn at the same rate as clearly visible ones. This is why managed networks actively manage density and placement rather than simply maximizing the number of units on a page.',
  },
  {
    question: 'How much of my ad revenue does Google actually keep?',
    answer:
      'For ads bought through Google Ads, publishers keep about 68% of the resulting revenue; for ads bought through third-party exchanges, publishers keep about 80%. Whatever RPM a managed ad network reports to you already reflects Google’s cut plus that network’s own additional share.',
  },
];

const keyTakeaways = [
  'Page RPM and session RPM divide the same revenue by different traffic units (pageviews vs. sessions) — comparing the two without checking which one is being reported makes identical performance look different.',
  'Premium ad-managed websites (Mediavine, Raptive) commonly report $15–$40 RPM, occasionally exceeding $50 in Q4 — substantially above raw self-served AdSense.',
  'Google’s own publisher share is roughly 68% for Google Ads-bought inventory and 80% for third-party-exchange inventory; a managed network’s reported RPM already nets out both Google’s cut and the network’s own fee.',
  'Estimate monthly revenue as (monthly sessions ÷ 1,000) × target RPM — useful for modeling an ad-network switch, as long as both scenarios use the same traffic metric.',
];

const citations = [
  { title: 'AdSense revenue share — official Google Help', url: 'https://support.google.com/adsense/answer/180195?hl=en' },
  { title: 'Mediavine vs Raptive: Which Pays More in 2026 (monetizepros.com)', url: 'https://monetizepros.com/ad-serving-and-optimization/mediavine-vs-raptive/' },
];

module.exports = {
  slug: 'calculating-page-rpm-and-session-revenue',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
