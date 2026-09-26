'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/creator-contract-essentials-and-invoice-payment-terms.
 */

const bodyHtml = `
<p>Most creator-brand disputes trace back to the same handful of contract terms being vague, not to bad faith on either side. Four clauses do most of the work in protecting a creator financially, and they're worth understanding before signing anything, not after a payment is late.</p>

<h2>Payment terms: net-30 is standard, and the trigger date matters more than the number</h2>
<p>Net-30 (full payment 30 days after a defined trigger) is the standard window; net-60 is common with larger enterprise brands; anything beyond net-60 is worth pushing back on. The number matters less than what starts the clock: a contract where the 30 days begins on invoice submission puts the timeline in the creator's control, while one that starts the clock on "brand approval" or "post goes live" lets the brand control when the clock even starts — a meaningful difference if approval drags. For direct brand-to-creator deals, a 50% upfront / 50% on delivery split has become a common working default, particularly for creators large enough to set their own terms.</p>

<h2>Usage rights: owning content and licensing it are different things</h2>
<p>Standard practice is that the creator retains ownership and grants the brand a time-limited usage license, commonly 60–90 days, after which the creator is free to repost the content to their own channels. Language that assigns "all right, title, and interest" or labels the work "work made for hire" transfers actual ownership to the brand, not just a usage window — a distinction many creators sign away without noticing. Perpetual (unlimited-time) usage rights are a legitimate ask from a brand, but should come with a rate premium, commonly 30–50% above a standard time-limited license.</p>

<h2>Kill fees: getting paid even when a campaign falls apart</h2>
<p>A kill fee protects a creator when a brand cancels after work has already begun. A standard schedule scales with how much work was already done: 25–50% of total contract value if canceled before production starts, 50–75% if canceled mid-production, and 100% if the deliverables were completed but the brand simply chooses not to publish them. A contract with no kill fee clause at all leaves a creator with no fallback if a brand cancels after real time was already invested.</p>

<h2>Exclusivity clauses: read the category, not just the word "exclusive"</h2>
<p>An exclusivity clause restricts a creator from working with competing brands for a defined period. The two details that determine whether it's reasonable are scope (does it cover the brand's specific product category, or every brand the company owns across unrelated categories?) and duration (30–90 days after a campaign is standard; anything measured in years for a single sponsored post is disproportionate). Exclusivity is a real constraint on future income and should command its own separate rate premium — it isn't something that should be assumed as included in a standard sponsorship fee just because the brand asked for it.</p>

<h2>Invoicing in practice</h2>
<p>An invoice tied to a contract with these terms already defined is mostly administrative: date, deliverable description, agreed rate, payment terms restated (so there's no ambiguity at collection time), and the specific trigger date the payment clock started from. Keeping a signed copy of the contract alongside every invoice is what actually resolves a late-payment dispute — the invoice alone, without the underlying terms it's built on, proves little on its own.</p>
`.trim();

const faq = [
  {
    question: 'What’s the practical difference between net-30 starting on invoice vs. on brand approval?',
    answer:
      'If the 30-day clock starts on invoice submission, the creator controls when it begins. If it starts on brand approval or the post going live, the brand controls the start date — and a slow approval process can quietly extend how long a creator actually waits to get paid, even though the contract still technically says "net-30."',
  },
  {
    question: 'If a contract doesn’t mention usage rights at all, who owns the content?',
    answer:
      'Silence on usage rights is a red flag, not a default in the creator’s favor — it should be spelled out explicitly. Watch specifically for "work made for hire" or "all right, title, and interest" language, which transfers actual ownership to the brand rather than granting a time-limited license.',
  },
  {
    question: 'How long is a reasonable exclusivity period, and should it cost extra?',
    answer:
      'Check both scope and duration: exclusivity limited to the brand’s specific product category for 30–90 days after the campaign is a standard, reasonable ask. A clause covering every brand a parent company owns, or lasting a year or more, is disproportionate for a single sponsored post. Either way, exclusivity restricts future income and should command its own rate premium, not be assumed as included in a standard fee.',
  },
  {
    question: 'Is it normal for a contract to have no kill fee clause?',
    answer:
      'It’s common but not creator-favorable. Without a kill fee, a creator who has already produced content for a canceled campaign has no contractual fallback. A standard kill fee schedule pays 25–50% for pre-production cancellation, 50–75% mid-production, and 100% if completed deliverables simply aren’t published.',
  },
];

const keyTakeaways = [
  'Net-30 is the standard payment window; what actually matters is which event starts the clock — invoice submission (creator-favorable) vs. brand approval or post-live (brand-controlled).',
  'Standard usage-rights practice is a 60–90 day time-limited license with the creator retaining ownership; "work made for hire" or "all right, title, and interest" language transfers real ownership and should command a 30–50% rate premium.',
  'A kill fee schedule (25–50% pre-production, 50–75% mid-production, 100% if completed but unpublished) is the main financial protection when a brand cancels after work has started — many contracts omit it entirely.',
  'An invoice is only as strong as the signed contract behind it — keeping both together, with the payment trigger date explicit, is what actually resolves a late-payment dispute.',
];

const citations = [
  { title: 'Influencer Payment Terms Decoded: Net-30, 50% Upfront, Milestones (Gigapay)', url: 'https://www.gigapay.com/blog/influencer-payment-terms' },
  { title: 'Brand Deal Contract Review Guide (Peter J. Lamont)', url: 'https://www.pjlesq.com/post/how-to-read-a-brand-deal-contract-influencer-sponsorship-agreement' },
];

module.exports = {
  slug: 'creator-contract-essentials-and-invoice-payment-terms',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
