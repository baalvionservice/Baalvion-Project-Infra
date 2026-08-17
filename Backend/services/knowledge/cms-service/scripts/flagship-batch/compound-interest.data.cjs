'use strict';
/*
 * Flagship content batch — pilot quality standard for the site's core
 * evergreen guides. Updates the existing published article at
 * /financial-tools/compound-interest (categorySlug: financial-tools).
 * Structure follows explanation → formula → worked example → practical
 * application → related concepts, per the article's own nature (a
 * calculation-driven concept benefits from leading with the mechanics).
 */
module.exports = {
  slug: 'compound-interest',
  categorySlug: 'financial-tools',
  title: 'What Is Compound Interest? How It Works, With Real Examples',
  metaTitle: 'Compound Interest Explained: Formula, Examples & Why It Matters',
  metaDescription:
    'Compound interest explained in plain terms — the formula, worked examples with real numbers, and why starting early matters more than the amount you start with.',
  excerpt:
    'Compound interest is interest earned on both your original money and the interest it has already earned. Here is exactly how it works, with real numbers.',
  focusKeyword: 'compound interest',
  secondaryKeywords: ['compound interest formula', 'compound interest example', 'compounding', 'compound interest calculator'],
  longTailKeywords: ['how does compound interest work', 'compound interest vs simple interest', 'why does compound interest matter for retirement'],
  searchIntent: 'Informational — readers want to understand the mechanism and see it applied to real numbers.',
  keyTakeaways: [
    'Compound interest is interest calculated on both your original principal and the interest that has already accumulated.',
    'Because interest earns its own interest, growth accelerates over time rather than staying flat, unlike simple interest.',
    'The two biggest levers are time and consistency — starting years earlier usually beats contributing more money later.',
    'Compounding works in your favor when you save or invest, and against you when you carry interest-bearing debt like credit cards.',
    'Compounding frequency (annual, monthly, daily) changes the outcome, but time in the market matters far more than frequency.',
  ],
  internalLinks: [
    { slug: 'complete-guide-to-saving-money', anchor: 'how savings accounts work' },
    { slug: 'savings-vs-investing', anchor: 'savings vs investing' },
    { slug: 'understanding-the-stock-market', anchor: 'how the stock market works' },
  ],
  faq: [
    {
      question: 'What is the formula for compound interest?',
      answer:
        'The standard formula is A = P(1 + r/n)^(nt), where A is the final amount, P is the starting principal, r is the annual interest rate (as a decimal), n is how many times interest compounds per year, and t is the number of years.',
    },
    {
      question: 'What is the difference between compound interest and simple interest?',
      answer:
        'Simple interest is calculated only on the original principal, so it grows by the same dollar amount every period. Compound interest is calculated on the principal plus any interest already earned, so the dollar amount grown each period increases over time.',
    },
    {
      question: 'Does compounding frequency matter much?',
      answer:
        'It matters less than most people assume. Moving from annual to monthly compounding meaningfully changes results only at high rates over long periods; the far bigger factors are how much you contribute, how consistently, and for how long.',
    },
    {
      question: 'How does compound interest work against you?',
      answer:
        'Interest-bearing debt — most notably credit card balances — compounds the same way. Unpaid interest gets added to the balance, and future interest is charged on that larger balance, which is why carrying a balance can grow faster than many people expect.',
    },
    {
      question: 'Is compound interest guaranteed?',
      answer:
        'In an insured deposit account (like a savings account or CD), the stated rate is contractual, though rates can be variable. In investments like stocks or funds, returns are not guaranteed and can be negative in a given year — the compounding math still applies, but to a return that fluctuates rather than a fixed rate.',
    },
  ],
  sources: [
    { name: 'Investor.gov (SEC) — Compound Interest Calculator', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
    { name: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { name: 'FDIC — Deposit Insurance', url: 'https://www.fdic.gov/deposit' },
  ],
  markdown: `Compound interest is often called one of the most powerful forces in personal finance, and the reason is mechanical, not magical: once interest starts earning its own interest, growth stops being a straight line and starts curving upward. This guide explains exactly how that works, walks through real worked examples, and covers where the idea helps you — and where it works against you.

## What You'll Learn

By the end of this guide you'll be able to explain what compound interest actually is, use the formula to estimate how money grows over time, see why starting early outweighs starting big, and recognize where compounding works against you (debt) instead of for you (savings and investing).

## Overview: What Compound Interest Is

Compound interest is interest calculated on both your original principal and any interest that has already been added to the balance. Contrast that with **simple interest**, which is only ever calculated on the original amount. With simple interest, a $10,000 balance earning 5% grows by exactly $500 every year, forever. With compound interest, that same $10,000 earns $500 in year one — but in year two, it earns 5% on $10,500, not $10,000, so the dollar amount grown increases every period.

That difference seems small in year one. Over ten, twenty, or thirty years, it becomes the single biggest driver of long-term savings and investment growth — which is why it shows up constantly in guidance about retirement accounts, [savings accounts](complete-guide-to-saving-money), and long-term investing.

## How It Works: The Formula

The standard compound interest formula is:

**A = P(1 + r/n)^(nt)**

- **A** — the final amount, principal plus all accumulated interest
- **P** — the starting principal (the amount you begin with)
- **r** — the annual interest rate, expressed as a decimal (5% = 0.05)
- **n** — how many times per year interest compounds (1 = annually, 12 = monthly, 365 = daily)
- **t** — the number of years the money grows

The exponent — (n × t) — is what produces the acceleration: the more compounding periods, the more times interest gets added on top of interest.

## Worked Examples

**Example 1 — A lump sum, compounded annually.** $10,000 invested at a 7% annual return, compounded once a year, for 20 years:

A = 10,000 × (1 + 0.07/1)^(1×20) = 10,000 × (1.07)^20 ≈ **$38,697**

Notice that the principal never changed — the entire additional $28,697 came from interest earning interest over two decades.

**Example 2 — Monthly compounding, same numbers.** The same $10,000 at 7%, compounded monthly instead of annually, for 20 years:

A = 10,000 × (1 + 0.07/12)^(12×20) ≈ **$40,387**

Monthly compounding produced roughly $1,690 more than annual compounding — a real difference, but a much smaller one than the difference time itself makes (see Example 3).

**Example 3 — Why starting early matters more than the amount.** Compare two savers, both earning 7% annually, both eventually contributing the same total amount:

- **Saver A** invests $5,000 per year starting at age 25 and stops at age 35 (10 years, $50,000 total contributed), then leaves it untouched until age 65.
- **Saver B** waits until age 35 to start, then invests $5,000 per year every year until age 65 (30 years, $150,000 total contributed — three times as much).

Run the math and Saver A, who contributed a third as much money but started ten years earlier, ends up with a comparable or larger balance than Saver B by age 65. The gap isn't a rounding error — it's the direct result of Saver A's money having ten extra years to compound before Saver B even starts.

## Why It Matters

The practical takeaway isn't "save more" — it's "start now, even with less." A modest amount invested consistently in your twenties can outperform a much larger amount started in your forties, purely because of how many compounding periods each dollar gets to work through. This is the core logic behind starting retirement contributions as early as possible, and why financial guidance consistently prioritizes time in the market over timing the market.

## Risks, Limitations & Common Misunderstandings

- **Compounding isn't guaranteed growth.** In a savings account or CD, the rate is contractual (though often variable). In stocks or funds, returns fluctuate year to year and can be negative — the compounding formula still describes the mechanism, but "r" isn't a fixed, guaranteed number.
- **Compounding works against you in debt.** Credit cards and other revolving debt compound the same way: unpaid interest is added to the balance, and future interest is charged on that larger balance. This is why carrying a balance can grow faster than the stated APR alone suggests.
- **Fees quietly reduce the effective rate.** An account or fund with ongoing fees compounds on a lower net return than its headline rate suggests — a 1% annual fee on a 7% return isn't a "small" difference once compounded over decades.
- **Inflation reduces real purchasing power.** A balance can compound nicely in nominal dollars while still losing purchasing power if the return doesn't outpace inflation — worth checking against your goals, not just the account balance.

## Related Concepts

Compound interest is the mechanism behind how [savings accounts](complete-guide-to-saving-money) grow and why the decision between [saving and investing](savings-vs-investing) depends heavily on time horizon — a longer horizon gives compounding more time to work, which is part of why longer-term goals can tolerate more investment risk than money needed soon. It's also the same underlying math that makes the [stock market](understanding-the-stock-market) a long-term wealth-building tool rather than a short-term one.

## Continue Learning

1. **Fundamental concept:** [Savings accounts and how interest is earned](complete-guide-to-saving-money)
2. **Related concept:** [Savings vs. investing — deciding where your money should go](savings-vs-investing)
3. **More advanced concept:** [How the stock market works](understanding-the-stock-market)
4. **Practical tool:** Use a compound interest calculator to model your own numbers — try different contribution amounts, rates, and time horizons to see the effect of starting earlier versus contributing more.`,
};
