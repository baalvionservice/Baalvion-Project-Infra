'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/how-platform-creator-funds-calculate-rpm.
 * Distinct angle from the other RPM articles: the actual mechanics of a
 * "pooled fund" payout model, since three different platforms (YouTube
 * Shorts, TikTok Creator Rewards, X Original Content Rewards) now all use
 * some version of it.
 */

const bodyHtml = `
<p>Three of the biggest short-form platforms — YouTube Shorts, TikTok, and (as of September 2026) X — all pay creators from a pooled fund rather than selling ads against individual pieces of content. The pool model confuses creators used to thinking in fixed per-view rates, because the "rate" isn't fixed at all — it's whatever the pool divided by that period's total qualifying activity works out to.</p>

<h2>The basic formula behind every pooled fund</h2>
<p>This is a fundamentally different pricing mechanism from a fixed ad-revenue-share arrangement like YouTube long-form's 55%, or a direct, negotiated brand sponsorship — both of which price your specific content or specific audience individually. A pooled fund never prices your content specifically; it only ever tells you your share of a much larger, constantly shifting whole.</p>
<p>Strip away platform-specific rules and the mechanism is the same everywhere: take a fixed revenue pool for a period, divide it by the total qualifying views/impressions across every eligible creator that period, and pay each creator their proportional share. Your payout is <em>your qualifying activity ÷ total qualifying activity across the platform</em>, multiplied by the pool size — not a rate card.</p>

<h2>Why the "effective rate" still moves around</h2>
<p>Because the pool size and the total qualifying activity both change period to period, the effective per-1,000-view rate isn't fixed even for the exact same content performing the exact same way twice. If the total volume of eligible content grows faster than the pool, your effective rate per view falls even if your own views stay flat — you're being diluted by everyone else's growth, not underperforming. Published ranges (YouTube Shorts $0.03–$0.10/1,000 views, TikTok Creator Rewards $0.40–$1.00/1,000 qualified views) are historical averages of this ratio, not guaranteed rates.</p>

<h2>"Qualifying" is doing a lot of work in that formula</h2>
<p>Each platform defines "qualifying" differently, and it's rarely just "any view":</p>
<ul>
<li><strong>TikTok</strong>: only videos over one minute count at all; qualified views typically run 50–70% of total views.</li>
<li><strong>X's Original Content Rewards</strong> (replacing ad-revenue-sharing since September 2026): only unique impressions from Premium subscribers on the Home Timeline, with at least 50% of the post visible on screen, count as qualified.</li>
<li><strong>YouTube Shorts</strong>: qualifies under the same YPP acceptance as long-form, but the pool itself is funded by Shorts ad revenue plus a share of Premium subscription revenue, separate from the long-form pool entirely.</li>
</ul>
<p>A creator comparing their own "RPM" against a platform's published average without knowing exactly which views that platform even counts is comparing against a number built on a different, usually narrower, definition of a view than their own dashboard shows.</p>

<h2>Payout frequency differs as much as the formula does</h2>
<p>X's Original Content Rewards pays biweekly with a $30 minimum. YouTube's AdSense-based payouts (which also fund the Shorts pool) run on a monthly cycle with roughly a 45-day lag between earning and receiving. TikTok's Creator Rewards Program similarly runs on its own periodic cycle distinct from either. A creator earning from multiple pooled funds simultaneously is managing several different payout calendars, not one consolidated schedule — worth mapping out before assuming "this month's total creator-fund income" arrives as a single, predictable lump sum.</p>
`.trim();

const faq = [
  {
    question: 'If a platform pays from a pooled fund, why do published rate ranges exist at all?',
    answer:
      'Those ranges are historical averages of (pool size ÷ total qualifying activity) over past periods — useful for rough estimation, but not a guaranteed rate. The actual ratio moves every period as both the pool size and the total eligible activity change.',
  },
  {
    question: 'Why did my effective rate drop even though my views didn’t change?',
    answer:
      'In a pooled-fund model, your payout is your qualifying activity divided by everyone’s qualifying activity, times the pool. If total eligible activity platform-wide grew faster than the pool did, your share — and therefore your effective per-view rate — falls even with flat views on your end.',
  },
  {
    question: 'Does "views" mean the same thing across YouTube Shorts, TikTok, and X’s new program?',
    answer:
      'No. TikTok only counts videos over 60 seconds and qualified views run 50–70% of total views. X’s Original Content Rewards only count unique impressions from Premium subscribers with at least half the post visible. YouTube Shorts draws from its own pool funded separately from long-form. Each platform’s "qualifying" definition is narrower than raw total views.',
  },
];

const keyTakeaways = [
  'Every pooled creator fund uses the same underlying formula: your qualifying activity ÷ total qualifying activity platform-wide, multiplied by the fund size — not a fixed rate card.',
  'Published rate ranges (e.g. TikTok $0.40–$1.00/1,000 qualified views) are historical averages of that ratio, not a guarantee — the real number moves as the pool and total eligible activity both change period to period.',
  'A flat or growing view count can still produce a falling effective rate if total eligible activity across the platform grew faster than the fund — dilution, not necessarily underperformance.',
  '"Qualifying" activity is defined narrowly and differently per platform: TikTok excludes videos under 60 seconds, X only counts Premium-subscriber impressions with 50%+ visibility, and YouTube Shorts draws from a pool separate from long-form entirely.',
];

const citations = [
  { title: 'TikTok Creator Rewards RPM in 2026 (Elev8or)', url: 'https://www.elev8or.io/blog/tiktok-creator-rewards-rpm-2026' },
  { title: 'X Help — Original Content Rewards Program (official)', url: 'https://help.x.com/en/using-x/original-content-rewards' },
  { title: 'YouTube Shorts Monetization 2026 (vidIQ)', url: 'https://vidiq.com/blog/post/youtube-shorts-monetization/' },
];

module.exports = {
  slug: 'how-platform-creator-funds-calculate-rpm',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
