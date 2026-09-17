'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/adsense-payment-schedules-and-threshold-rules.
 * Sourced directly from Google's own AdSense help documentation, not a
 * secondary aggregator's paraphrase.
 */

const bodyHtml = `
<p>New AdSense publishers are frequently confused by the gap between "I see earnings in my dashboard" and "money actually arrived in my bank account" — the two are governed by separate rules, and missing either one delays payment by a full month.</p>

<h2>The $100 threshold</h2>
<p>This same $100/currency-equivalent threshold and monthly cycle applies whether the underlying earnings come from a website's display ads or a YouTube channel's AdSense revenue — both flow through the same AdSense payments infrastructure and the same finalization and payout rules described below, even though the content and the RPM calculations behind them are entirely different.</p>
<p>Google pays out once your AdSense balance reaches your account's payment threshold — $100 USD for U.S.-dollar accounts, with different amounts set for other currencies. Balances below the threshold simply roll forward and accumulate until they cross it; there's no forfeiture for staying under it.</p>

<h2>How the monthly cycle actually works</h2>
<p>Earnings from a given calendar month are finalized and posted to your AdSense balance by roughly the 10th of the following month — this finalization step (verifying real, non-invalid traffic) is why AdSense earnings are never available for withdrawal immediately. If your balance meets the threshold by the 20th of that month, payment is issued between the 21st and 26th. Miss the 20th cutoff — even by one day — and the payment doesn't slip a few days, it rolls to the entire next monthly cycle.</p>

<h2>Getting the money out</h2>
<p>It's worth confirming your specific country's supported methods directly in your AdSense account settings, since availability changes and isn't uniform globally.</p>
<p>Once payment is issued, funds typically arrive 5–10 business days later depending on your payment method and country. Available methods vary by region but commonly include electronic funds transfer (EFT), wire transfer, SEPA (EU), and in some countries PayPal via Hyperwallet or physical checks.</p>

<h2>Non-U.S. publishers: a withholding rule that quietly shrinks the balance itself</h2>
<p>Before payment schedules even come into play, non-U.S. publishers face a separate rule that can shrink the balance being tracked in the first place. Google withholds 24% of a non-U.S. publisher's earnings attributable to U.S. viewers by default, unless a W-8BEN (individuals) or W-8BEN-E (businesses) tax form is on file. With a valid form and a U.S. tax treaty in place for that publisher's country, the rate typically drops to 0–15% instead of the full 24% default. These forms also expire — Google requires resubmission roughly every three years — so a publisher who filed once years ago and never checked again may be back on the 24% default rate without realizing it.</p>

<h2>Where creators lose track of this</h2>
<p>The most common confusion: a publisher crosses $100 on, say, the 22nd of the month — after that month's 20th cutoff already passed. That balance doesn't pay out until the FOLLOWING cycle's window, roughly a month later than expected. Building a rough mental model of "this month's earnings become next month's balance, and next-next month's payment" avoids the surprise of a payout that looks "late" when it's actually on schedule.</p>
`.trim();

const faq = [
  {
    question: 'What happens if my AdSense balance is under $100 at the end of the month?',
    answer:
      'Nothing negative — it simply carries over and accumulates with the following month’s earnings until the combined balance crosses your account’s $100 (or currency-equivalent) threshold. There’s no expiration or forfeiture for staying under it.',
  },
  {
    question: 'Why does it take so long between earning the money and getting paid?',
    answer:
      'Google finalizes each month’s earnings (checking for invalid traffic) by around the 10th of the following month, then pays out between the 21st–26th of that same month if your balance already met the threshold by the 20th. Miss that 20th cutoff and payment rolls to the next full cycle — that lag, not a processing delay, is why payouts can feel a month behind actual earnings.',
  },
  {
    question: 'Is the $100 threshold the same in every country?',
    answer:
      'No — $100 USD applies to U.S.-dollar-denominated accounts specifically. Google sets separate threshold amounts for other payout currencies, so a publisher paid in a different currency should check their account’s specific threshold rather than assuming $100 applies.',
  },
  {
    question: 'Why is Google withholding 24% of my earnings even before the payment threshold applies?',
    answer:
      'That’s U.S. tax withholding on non-U.S. publishers’ earnings from U.S. viewers, separate from the payment schedule itself. It defaults to 24% unless a W-8BEN (individual) or W-8BEN-E (business) form is on file; with a valid form and an applicable U.S. tax treaty, the rate typically drops to 0–15%. These forms expire roughly every three years and must be resubmitted.',
  },
];

const keyTakeaways = [
  'AdSense pays out once your balance reaches your account’s threshold — $100 USD for U.S.-dollar accounts, with different amounts for other currencies.',
  'A month’s earnings finalize into your balance by roughly the 10th of the following month; if the balance meets the threshold by the 20th, payment issues the 21st–26th.',
  'Missing the 20th cutoff by even a day rolls the whole payment to the next monthly cycle, not just a few days — the single most common source of "why is my payment late" confusion.',
  'Funds typically land in your account 5–10 business days after payment is issued, depending on method (EFT, wire, SEPA, or check) and country.',
  'Non-U.S. publishers face a separate 24% default withholding on U.S.-viewer earnings unless a W-8BEN/W-8BEN-E form is on file, dropping to 0–15% with an applicable tax treaty — and these forms expire roughly every three years.',
];

const citations = [
  { title: 'Payment timelines for AdSense — official Google Help', url: 'https://support.google.com/adsense/answer/7164703?hl=en' },
  { title: 'The AdSense Payment Threshold Explained (MonetizeMore)', url: 'https://www.monetizemore.com/blog/the-adsense-payment-threshold-explained/' },
  { title: 'Non-U.S. YouTube Creators: How to Avoid the 24% U.S. Tax (vidIQ)', url: 'https://vidiq.com/blog/post/non-u-s-creators-24-percent-tax-youtube-revenue/' },
];

module.exports = {
  slug: 'adsense-payment-schedules-and-threshold-rules',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
