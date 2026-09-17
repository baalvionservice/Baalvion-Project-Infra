'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/instagram-creator-subscriptions-and-reel-bonus-rules.
 * Covers the actual current state of Instagram's monetization tools,
 * including that the original Reels Play Bonus program is gone in the US.
 */

const bodyHtml = `
<p>A creator researching "Instagram Reels bonus" today will find a lot of outdated advice describing a program that no longer exists in its original form. Meta has meaningfully restructured how Instagram pays creators, and the two live mechanisms — subscriptions and the revamped bonus program — work nothing like the flat-rate Reels Play Bonus that made the term popular in the first place.</p>

<h2>The original Reels Play Bonus is gone (in the US)</h2>
<p>Search results and older creator forum posts referencing the flat-rate program by name are describing a mechanism that, for U.S. creators, no longer functions the way those posts assume — worth confirming current program names and mechanics directly through Instagram's own creator tools before acting on older advice.</p>
<p>The flat, invite-based Reels Play Bonus that paid a set amount per view has been largely discontinued in the United States. Meta shifted its creator-monetization strategy toward commerce — Instagram Shop affiliate commissions and similar integrations — rather than continuing to pay directly for views the way the original bonus program did.</p>

<h2>What replaced it: Bonus 2.0's tiered model</h2>
<p>In its place, Instagram runs a revamped bonus structure that pays based on three factors — engagement rate, retention rate, and conversion actions — rather than a flat per-view rate. It remains invite-only. For creators who are invited, reported earning potential ranges from roughly $100 to $35,000 per bonus period, with most invited creators actually landing between $500 and $3,000. For most creators overall, these bonuses account for less than 10% of total Instagram income — Reels still matter primarily for growth and discoverability, not as a primary revenue line.</p>

<h2>Creator Subscriptions: a real, ungated recurring revenue tool</h2>
<p>This structure mirrors the general shift across platforms toward recurring, subscriber-funded revenue running alongside (not replacing) advertiser-funded revenue — the same pattern shows up in YouTube's channel memberships, which similarly charge a set monthly price with no per-view calculation involved.</p>
<p>Unlike bonuses, Subscriptions are available to any eligible creator with 10,000+ followers, not invite-only. Creators set a recurring monthly price from a preset menu, roughly $0.99 to $99.99. Instagram itself charges no platform fee on Subscriptions revenue, though standard app-store fees (roughly 30% on in-app purchases) still apply depending on how the subscriber pays.</p>

<h2>Revenue share ads on Reels: still live</h2>
<p>Separately from bonuses and subscriptions, Instagram's Revenue Share Ads program places ads within Reels and pays creators a 55% cut of the resulting ad revenue — the one mechanism on this list that most closely resembles a traditional per-view ad split rather than a bonus or subscription structure.</p>

<h2>Gifts and Stars: the smallest, most direct mechanism</h2>
<p>It's the closest thing on Instagram to a tip jar, funded directly by an individual viewer's choice rather than by a platform pool or an advertiser.</p>
<p>A fourth, much smaller mechanism exists alongside the three above: viewers can send Gifts (Stars) directly during Live videos, commonly reported at roughly $0.01 per Star, paid directly by engaged viewers rather than pooled or advertiser-funded. It's a minor revenue line for most creators compared to subscriptions or bonuses, but unlike the invite-only bonus program, any eligible creator can receive Gifts without an application.</p>
`.trim();

const faq = [
  {
    question: 'Does Instagram still pay a flat rate per view on Reels?',
    answer:
      'Not through the original Reels Play Bonus, which is largely discontinued in the U.S. The current bonus program (sometimes called Bonus 2.0) pays based on engagement, retention, and conversion actions rather than a flat per-view rate, and remains invite-only.',
  },
  {
    question: 'Who can turn on Instagram Subscriptions?',
    answer:
      'Any eligible creator with 10,000 or more followers — unlike the bonus program, Subscriptions are not invite-only. Creators set a recurring monthly price between roughly $0.99 and $99.99; Instagram charges no platform fee, though standard app-store in-app-purchase fees (roughly 30%) can still apply.',
  },
  {
    question: 'How much of a typical creator’s Instagram income comes from Reels bonuses?',
    answer:
      'For most creators, less than 10% of total Instagram income. Reels function more as a growth and discovery tool than a primary revenue source — the bonus program itself is invite-only and its payouts, while sizable for invited creators ($500–$3,000 typically, up to $35,000 for top performers), reach a limited pool of accounts.',
  },
];

const keyTakeaways = [
  'The original flat-rate Reels Play Bonus is largely discontinued in the U.S.; Meta shifted strategy toward commerce-based monetization (Shop affiliate commissions) instead.',
  'The current bonus program pays based on engagement rate, retention, and conversion actions rather than a flat per-view rate, remains invite-only, and typically pays $500–$3,000 per period for invited creators (up to $35,000 for top performers).',
  'Creator Subscriptions are open to any creator with 10,000+ followers (not invite-only) — a $0.99–$99.99 recurring price with no Instagram platform fee, though app-store in-app-purchase fees (~30%) can apply.',
  'Revenue Share Ads on Reels pay a 55% creator cut of ad revenue and is the closest thing on Instagram today to a traditional per-view ad split.',
  'Gifts (Stars), sent directly by viewers during Live videos at roughly $0.01/Star, are a smaller but application-free mechanism available to any eligible creator, unlike the invite-only bonus program.',
];

const citations = [
  { title: 'Instagram Reels Monetization 2026 (SMMCompare)', url: 'https://smmcompare.com/blog/instagram-reels-monetization-gifts-bonuses-subscriptions-2026' },
  { title: 'How to Monetize Instagram Reels in 2026 (flowgent.ai)', url: 'https://flowgent.ai/blog/how-to-monetize-instagram-reels-in-2025-the-complete-playbook' },
];

module.exports = {
  slug: 'instagram-creator-subscriptions-and-reel-bonus-rules',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
