'use strict';
/*
 * De-templated rewrite for
 * /creator-economy/taxes-for-creators-deductions-quarterly-estimates-and-llcs.
 * General educational content, not tax advice for a specific reader —
 * phrased accordingly throughout.
 */

const bodyHtml = `
<p>The IRS treats a creator's income exactly like any other self-employment income — there's no special "creator" tax category — but the paperwork and deadlines catch full-time creators off guard often enough that it's worth walking through the mechanics once, in plain terms. This is general education, not tax advice for your specific situation; a licensed tax professional should confirm anything that affects your actual return.</p>

<h2>You owe tax on the income whether or not you get a 1099</h2>
<p>Brands and platforms generally issue Form 1099-NEC if they paid you $2,000 or more in a year, and payment processors (PayPal, Venmo, platform payout systems) may issue Form 1099-K once their own reporting thresholds are met. Neither form arriving — or not arriving — changes your legal obligation: all self-employment income must be reported, with or without a 1099 documenting it.</p>

<h2>Quarterly estimated taxes: the deadlines that actually matter</h2>
<p>Because no employer is withholding tax from creator income, the IRS expects it paid quarterly instead of once a year. For the 2026 tax year, the four estimated-payment deadlines are <strong>April 15, June 16, September 15, and January 15</strong> (of the following year). The safe-harbor rule to avoid an underpayment penalty: pay either 90% of your current year's tax liability or 100% of last year's liability (110% if your prior-year adjusted gross income was over $150,000) across those four payments.</p>

<h2>Self-employment tax: the 15.3% most creators underestimate</h2>
<p>As a sole proprietor or single-member LLC, 100% of your net profit is subject to a 15.3% self-employment tax (Social Security + Medicare combined) on top of ordinary income tax. Self-employment tax specifically kicks in once net earnings reach $400 in a year — a much lower bar than most creators expect, and one reason a "hobby that made some money" is, for tax purposes, usually just a small business.</p>

<h2>What's actually deductible</h2>
<p>The biggest categories for most creators: equipment used to produce content (cameras, microphones, lighting, a phone used for filming), software and subscriptions (editing tools, analytics platforms, stock asset libraries) deductible in full the year paid, a home office (if a space is used exclusively as your principal place of business — the simplified method allows $5 per square foot up to 300 square feet), the business-use percentage of internet and phone, and professional fees for an accountant or attorney. Items costing $2,500 or less per invoice can generally be written off in full immediately under the de minimis safe harbor rather than depreciated over time.</p>

<h2>Where an S-corp election changes the math</h2>
<p>A single-member LLC by default reports income as a sole proprietor on Schedule C, with the full 15.3% self-employment tax applying to all net profit. Electing S-corp tax treatment (via IRS Form 2553) splits your income into two buckets: a "reasonable salary" subject to standard payroll (FICA) tax, and remaining profit distributed as shareholder distributions that are exempt from self-employment tax. This can meaningfully reduce total tax owed once profit is high enough to justify the added payroll administration — but distributions are still taxable income and may still require their own estimated payments, so it isn't a way to avoid quarterly filing altogether.</p>
`.trim();

const faq = [
  {
    question: 'Do I owe taxes on brand deal or affiliate income if I never received a 1099 for it?',
    answer:
      'Yes. Receiving a 1099-NEC (issued for payments of $2,000+ from a single payer) or 1099-K (from payment processors meeting their own reporting thresholds) is a documentation requirement on the payer’s side, not what creates your tax obligation. All self-employment income must be reported whether or not a 1099 was ever issued.',
  },
  {
    question: 'What are the 2026 quarterly estimated tax deadlines?',
    answer:
      'April 15, June 16, September 15, and January 15 of the following year. To avoid an underpayment penalty, the safe harbor is paying either 90% of your current-year tax liability or 100% of last year’s (110% if your prior-year AGI exceeded $150,000) across those four payments.',
  },
  {
    question: 'What can a creator actually write off as a business expense?',
    answer:
      'Equipment (cameras, mics, lighting), software/subscriptions used to produce or analyze content, a home office if the space is used exclusively as your principal place of business ($5/sq ft up to 300 sq ft under the simplified method), business-use phone/internet, and professional fees. Items costing $2,500 or less per invoice can typically be deducted in full immediately rather than depreciated.',
  },
  {
    question: 'When does an S-corp election actually save a creator money?',
    answer:
      'Generally once profit is high enough that splitting income into a reasonable salary (subject to standard payroll tax) plus shareholder distributions (exempt from the 15.3% self-employment tax) saves more than the added cost and complexity of running payroll. It doesn’t eliminate quarterly estimated payments — distributions remain taxable and can still require them.',
  },
];

const keyTakeaways = [
  'Self-employment income is taxable whether or not a 1099-NEC (for payments of $2,000+) or 1099-K was actually issued — the form documents the income, it doesn’t create the obligation.',
  '2026 quarterly estimated tax deadlines are April 15, June 16, September 15, and January 15; the safe harbor to avoid a penalty is 90% of current-year tax or 100%–110% of last year’s, depending on prior-year income.',
  'Self-employment tax (15.3% combined Social Security + Medicare) applies to 100% of net profit for a sole proprietor or single-member LLC, and kicks in once net earnings reach just $400 in a year.',
  'An S-corp election splits income into a payroll-taxed salary and self-employment-tax-exempt distributions, which can reduce total tax once profit is high enough — but distributions are still taxable and may still need quarterly payments.',
];

const citations = [
  { title: 'Self-Employed Individuals Tax Center — official IRS', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/self-employed-individuals-tax-center' },
  { title: 'Quarterly Estimated Taxes 2026: LLC, S-Corp & Self-Employed Guide (handledtax.com)', url: 'https://handledtax.com/blog/quarterly-estimated-taxes/' },
  { title: 'Content Creator Tax Deductions: Gear, Studio & Software (ehuntcpa.com)', url: 'https://ehuntcpa.com/content-creator-tax-deductions/' },
];

module.exports = {
  slug: 'taxes-for-creators-deductions-quarterly-estimates-and-llcs',
  bodyHtml,
  faq,
  keyTakeaways,
  citations,
};
