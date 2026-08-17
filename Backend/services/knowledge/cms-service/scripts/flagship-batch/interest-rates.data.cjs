'use strict';
/*
 * Flagship content batch. Updates the existing published pillar article at
 * /interest-rates/complete-guide-to-interest-rates (categorySlug: interest-rates).
 * Structure: definition → how rates are set → how rates ripple through the
 * economy → why they change → misunderstandings — mirrors the inflation
 * article's economics-first structure since the two topics are tightly linked.
 */
module.exports = {
  slug: 'complete-guide-to-interest-rates',
  categorySlug: 'interest-rates',
  title: 'How Interest Rates Work: The Fed, Borrowing, Saving & the Economy',
  metaTitle: 'How Interest Rates Work: A Complete Guide',
  metaDescription:
    'How interest rates actually work — what the Federal Reserve controls, how rate changes ripple into mortgages, credit cards, and savings accounts, and why rates move.',
  excerpt:
    'Interest rates set the cost of borrowing and the reward for saving. Here is how the Federal Reserve influences rates, and how changes ripple through your finances.',
  focusKeyword: 'interest rates',
  secondaryKeywords: ['how interest rates work', 'federal funds rate', 'how the fed sets interest rates', 'interest rates and inflation'],
  longTailKeywords: ['why do interest rates go up and down', 'how does the federal reserve control interest rates', 'how do interest rates affect mortgages'],
  searchIntent: 'Informational — readers want to understand the mechanism connecting Fed policy to their own borrowing and saving rates.',
  keyTakeaways: [
    'Interest rates are the cost of borrowing money, or the reward for lending/saving it, usually expressed as an annual percentage.',
    'The Federal Reserve directly sets the federal funds rate, a short-term benchmark that influences — but doesn’t directly set — most consumer rates.',
    'When the Fed raises rates, borrowing (mortgages, credit cards, auto loans) typically gets more expensive, while savings accounts and CDs often pay more.',
    'The Fed adjusts rates primarily to manage inflation and employment, raising rates to cool an overheating economy and lowering them to stimulate a weak one.',
    'Your own borrowing rate also depends on factors the Fed doesn’t control, like your credit score, loan type, and the lender’s own pricing.',
  ],
  internalLinks: [
    { slug: 'complete-guide-to-inflation', anchor: 'how inflation works' },
    { slug: 'bonds', anchor: 'how bonds work' },
    { slug: 'complete-guide-to-saving-money', anchor: 'how savings accounts work' },
    { slug: 'credit-scores-and-credit-utilization', anchor: 'credit scores' },
  ],
  faq: [
    {
      question: 'What sets interest rates in the U.S.?',
      answer:
        'The Federal Reserve directly sets the federal funds rate — the rate banks charge each other for overnight lending. This benchmark rate influences, but does not directly set, the rates consumers see on mortgages, credit cards, savings accounts, and other products, which are also shaped by each lender’s own pricing, risk, and competition.',
    },
    {
      question: 'Why does the Federal Reserve change interest rates?',
      answer:
        'The Fed adjusts rates primarily to manage inflation and support employment. Raising rates tends to cool an overheating economy and reduce inflationary pressure by making borrowing more expensive; lowering rates tends to stimulate borrowing and spending during a slowdown.',
    },
    {
      question: 'How do interest rate changes affect mortgages?',
      answer:
        'Mortgage rates generally move in the same direction as broader interest rate trends, though they are more directly tied to long-term bond yields than to the Fed’s short-term rate. When rates rise, new mortgages typically become more expensive; existing fixed-rate mortgages are unaffected once locked in.',
    },
    {
      question: 'Do savings account rates go up when the Fed raises rates?',
      answer:
        'Often, yes, though not automatically or uniformly — banks aren’t required to pass along Fed rate increases, and how much (and how quickly) they do varies significantly by institution, which is one reason shopping around for a savings rate can make a real difference.',
    },
    {
      question: 'What is the difference between the federal funds rate and APR?',
      answer:
        'The federal funds rate is the specific short-term benchmark the Fed sets for overnight bank lending. APR (annual percentage rate) is the actual borrowing cost on a specific consumer product, which factors in the benchmark rate plus the lender’s own margin, fees, and your individual credit risk.',
    },
  ],
  sources: [
    { name: 'Federal Reserve — Federal Funds Rate', url: 'https://www.federalreserve.gov/monetarypolicy/openmarket.htm' },
    { name: 'Federal Reserve — Monetary Policy Report', url: 'https://www.federalreserve.gov/monetarypolicy/reports-to-congress.htm' },
    { name: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
  ],
  markdown: `Interest rates quietly touch nearly every financial decision — what a mortgage costs, what a savings account pays, how expensive it is to carry a credit card balance. This guide explains what actually sets interest rates, how a single Federal Reserve decision ripples out into the rates you see, and why rates move up and down over time.

## What You'll Learn

By the end of this guide you'll understand the difference between the rate the Federal Reserve sets and the rate you actually see on a loan or savings account, why the Fed changes rates in the first place, and how a rate change moves through mortgages, credit cards, and savings.

## Overview: What Interest Rates Are

An interest rate is the cost of borrowing money, or equivalently, the reward for lending or saving it — expressed as a percentage, usually annualized. If you borrow money, the rate is what you pay for the privilege of using someone else's funds now instead of your own later. If you save or lend money, the rate is what you're paid for letting someone else use it in the meantime.

## How Rates Are Set: The Federal Reserve's Role

The Federal Reserve directly controls the **federal funds rate** — the rate banks charge each other for short-term, overnight loans of reserves. The Fed doesn't directly set your mortgage rate, credit card APR, or savings account yield; instead, the federal funds rate acts as a benchmark that ripples outward and influences those rates, which are also shaped by each lender's own costs, competition, and your individual risk profile (like your [credit score](credit-scores-and-credit-utilization)).

The Fed adjusts the federal funds rate primarily to manage two goals: **price stability** (keeping [inflation](complete-guide-to-inflation) in check) and **maximum employment**. Broadly:

- **Raising rates** tends to slow borrowing and spending, cooling an overheating economy and easing inflationary pressure.
- **Lowering rates** tends to encourage borrowing and spending, stimulating a weak or slowing economy.

## How Rate Changes Ripple Through the Economy

A single Fed decision touches many different products, though not instantly or uniformly:

- **Mortgages** — more closely tied to long-term bond yields than the Fed's short-term rate, but they generally trend in the same direction over time. New mortgages get pricier when rates rise; existing fixed-rate loans are unaffected.
- **Credit cards** — most carry variable rates tied to a benchmark, so a Fed rate increase often shows up in your card's APR within a billing cycle or two.
- **Auto loans** — similarly sensitive to broader rate trends, plus your credit profile and the loan term.
- **Savings accounts and CDs** — banks often (but aren't required to) raise the rates they pay savers when the Fed raises rates, though the timing and size of the pass-through varies significantly by institution.
- **Bonds** — bond prices and interest rates move inversely: when rates rise, the price of existing [bonds](bonds) with lower fixed rates tends to fall, since new bonds now offer more competitive yields.

## Why Rates Change Over Time

Rates aren't static because the economy isn't static. The Fed reviews economic data — inflation reports, employment figures, growth indicators — on a regular schedule and adjusts policy in response to changing conditions. A period of high inflation typically prompts rate increases; a slowing economy or rising unemployment typically prompts rate cuts. Rates can also stay flat for extended periods when the Fed judges current policy to be appropriately balanced.

## Common Misunderstandings

- **The Fed doesn't set "the" interest rate you pay.** It sets one specific benchmark; the rate on your actual loan or account also depends on the lender, the product type, and your own credit profile.
- **Rate changes don't hit every product equally or instantly.** Variable-rate products (credit cards) tend to respond faster than fixed-rate products locked in before a rate change (existing mortgages, which don't change at all).
- **Higher rates aren't universally "bad."** They raise borrowing costs, but they also typically mean better yields for savers — the effect depends on whether you're primarily a borrower or a saver at that moment.
- **APR and the federal funds rate are not the same number.** The rate you're quoted on a specific product already includes the lender's margin, fees, and risk pricing on top of the broader rate environment.

## Related Concepts

Interest rates are one of the primary tools used to manage [inflation](complete-guide-to-inflation), move inversely with existing [bond](bonds) prices, and directly affect how much it costs to build (or carry a balance on) [credit](credit-scores-and-credit-utilization). They also influence what a [savings account](complete-guide-to-saving-money) actually pays you for keeping money on deposit.

## Continue Learning

1. **Fundamental concept:** [How inflation works and why the Fed responds to it](complete-guide-to-inflation)
2. **Related concept:** [How bonds work, and why bond prices move opposite to rates](bonds)
3. **More advanced concept:** [How credit scores affect the rate you're actually offered](credit-scores-and-credit-utilization)
4. **Practical tool:** Compare your own savings account's current APY to a few competing high-yield options to see whether your rate has kept pace with recent Fed policy changes.`,
};
