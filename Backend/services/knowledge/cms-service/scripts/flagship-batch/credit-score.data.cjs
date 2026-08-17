'use strict';
/*
 * Flagship content batch. Updates the existing published article at
 * /credit-cards/credit-scores-and-credit-utilization (categorySlug: credit-cards).
 * Structure: what a score is → the factors that build it → a worked
 * utilization example → how to improve → misunderstandings.
 */
module.exports = {
  slug: 'credit-scores-and-credit-utilization',
  categorySlug: 'credit-cards',
  title: 'What Is a Credit Score? How It’s Calculated and How to Improve It',
  metaTitle: 'What Is a Credit Score? Factors, Utilization & How to Improve It',
  metaDescription:
    'Credit scores explained — the factors that determine your score, exactly how credit utilization is calculated with a worked example, and realistic ways to improve it.',
  excerpt:
    'A credit score summarizes how risky you look to lenders. Here is exactly what factors determine it, with a worked example of credit utilization.',
  focusKeyword: 'credit score',
  secondaryKeywords: ['what is a credit score', 'credit utilization', 'how to improve credit score', 'credit score factors'],
  longTailKeywords: ['what factors affect my credit score', 'how is credit utilization calculated', 'how long does it take to improve credit score'],
  searchIntent: 'Informational and how-to — readers want to understand what determines their score and how to raise it.',
  keyTakeaways: [
    'A credit score is a three-digit number, typically 300–850, that summarizes how risky you look to lenders based on your credit history.',
    'Payment history and credit utilization are the two heaviest-weighted factors in most common scoring models.',
    'Credit utilization is the percentage of your available credit you’re currently using — lower is generally better, even if you pay your balance in full.',
    'Improving a credit score is usually gradual, not instant, since scores reflect a history of behavior, not just your current snapshot.',
    'Checking your own credit score or report is a "soft" inquiry and does not lower your score, unlike a lender’s "hard" inquiry when you apply for credit.',
  ],
  internalLinks: [
    { slug: 'complete-guide-to-credit-cards', anchor: 'how credit cards work' },
    { slug: 'complete-guide-to-personal-loans', anchor: 'personal loans' },
    { slug: 'emergency-funds', anchor: 'building an emergency fund' },
  ],
  faq: [
    {
      question: 'What is a good credit score?',
      answer:
        'Scoring ranges vary slightly by model, but on the common 300–850 scale, scores in the high 600s to low 700s are generally considered good, and scores in the mid-700s and above are generally considered very good to excellent. Specific lender requirements vary by product.',
    },
    {
      question: 'What factors make up a credit score?',
      answer:
        'The most common scoring models weight several factors: payment history (whether you pay on time), credit utilization (how much of your available credit you’re using), length of credit history, credit mix (types of accounts you have), and recent applications for new credit — with payment history and utilization typically weighted most heavily.',
    },
    {
      question: 'What is credit utilization exactly?',
      answer:
        'Credit utilization is the percentage of your total available revolving credit (mainly credit cards) that you’re currently using, calculated as your total balance divided by your total credit limit. It’s usually calculated both per card and across all your cards combined.',
    },
    {
      question: 'Does checking my own credit score hurt it?',
      answer:
        'No. Checking your own score or report is considered a "soft inquiry" and does not affect your score. A "hard inquiry" — which can cause a small, typically temporary dip — only happens when a lender checks your credit because you’ve applied for new credit.',
    },
    {
      question: 'How long does it take to improve a credit score?',
      answer:
        'It depends on what’s affecting the score. Reducing utilization can show up relatively quickly, often within a billing cycle or two once a lower balance is reported. Building a longer payment history, or recovering from a serious negative mark, typically takes months to years, since scores reflect an ongoing pattern rather than a single data point.',
    },
    {
      question: 'Will closing a credit card improve my score?',
      answer:
        'Not usually, and it can sometimes hurt it — closing a card reduces your total available credit, which can raise your overall utilization percentage even if your spending doesn’t change, and it may also shorten your average account age over time.',
    },
  ],
  sources: [
    { name: 'Consumer Financial Protection Bureau — Credit Reports and Scores', url: 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/' },
    { name: 'FINRA — Understanding Credit Scores', url: 'https://www.finra.org/investors/insights/credit-score' },
  ],
  markdown: `A credit score compresses years of financial behavior into a single three-digit number, and that number quietly affects what loans you qualify for, what interest rate you're offered, and sometimes even rental applications or insurance premiums. This guide breaks down exactly what factors build a credit score, walks through a real credit utilization calculation, and covers realistic ways to improve it.

## What You'll Learn

By the end of this guide you'll understand the main factors that determine a credit score, exactly how credit utilization is calculated (with real numbers), and which improvement strategies actually move the needle versus which are myths.

## Overview: What a Credit Score Is

A credit score is a three-digit number — most commonly ranging from 300 to 850 — generated by a scoring model based on the information in your credit report. It's designed to summarize, in a single number, how risky you look to a lender: how likely you are to repay debt as agreed, based on your past behavior.

Multiple scoring models exist (FICO and VantageScore are the most common), and your score can vary slightly between them and between the three major credit bureaus, since each may have slightly different information on file.

## The Factors That Build a Credit Score

While exact weightings vary by model, most common scores are built from a similar set of factors:

- **Payment history** — whether you've paid past accounts on time. This is typically the single heaviest-weighted factor.
- **Credit utilization** — how much of your available revolving credit you're currently using (detailed below). Usually the second-heaviest factor.
- **Length of credit history** — how long your accounts have been open, including your oldest account and the average age of all accounts.
- **Credit mix** — whether you have experience with different types of credit (credit cards, installment loans like a [personal loan](complete-guide-to-personal-loans) or auto loan, etc.).
- **New credit / recent inquiries** — how many new accounts you've opened recently and how many hard inquiries you've had.

## How Credit Utilization Actually Works: A Worked Example

Credit utilization is your **total credit card balances divided by your total credit limits**, expressed as a percentage.

**Example:** Suppose you have two credit cards:

- Card A: $1,200 balance, $4,000 limit
- Card B: $300 balance, $2,000 limit

Total balance: $1,200 + $300 = **$1,500**
Total limit: $4,000 + $2,000 = **$6,000**

Overall utilization = $1,500 ÷ $6,000 = **25%**

A commonly cited guideline is to keep overall utilization under roughly 30%, with lower generally considered better — but this isn't a hard cutoff, and utilization is recalculated continuously as balances and limits change, not fixed at any single moment. It's also worth noting: **paying your statement balance in full every month doesn't guarantee low reported utilization**, since card issuers often report the balance as of your statement closing date, which may not be $0 even if you never carry a balance past the due date.

## How to Improve a Credit Score

- **Pay on time, every time.** Since payment history is usually the heaviest factor, consistency here matters more than almost anything else.
- **Lower your utilization** — either by paying down balances or, in some cases, by requesting a credit limit increase (which lowers utilization without changing your spending, provided you don't increase your balance too).
- **Avoid opening several new accounts in a short window**, since each application can trigger a hard inquiry and slightly lower your average account age.
- **Let older accounts stay open**, when there's no compelling reason to close them, since they support both your length-of-history and your total available credit.
- **Check your credit report for errors** — an incorrect late payment or account you don't recognize can drag down a score for no legitimate reason, and disputing genuine errors is free.

## Common Misunderstandings

- **Checking your own score doesn't hurt it.** That's a "soft" inquiry. Only a lender's hard inquiry, triggered by an actual application, can cause a small dip.
- **Carrying a balance doesn't help your score.** A popular myth suggests carrying a small balance "shows you can manage credit," but paying in full each month is generally the better strategy — you avoid interest entirely, and utilization is based on reported balances, not on whether you carry a balance past the due date.
- **Closing old cards can hurt more than help.** It reduces total available credit (raising utilization) and can shorten your average account age.
- **A single missed payment isn't necessarily catastrophic**, but a pattern of missed or late payments is one of the most damaging factors, since payment history is typically weighted most heavily.

## Related Concepts

Credit scores directly affect the rates and terms you're offered on [credit cards](complete-guide-to-credit-cards) and [personal loans](complete-guide-to-personal-loans), and a strong [emergency fund](emergency-funds) reduces the chance you'll need to rely on high-utilization credit card debt to cover an unplanned expense in the first place.

## Continue Learning

1. **Fundamental concept:** [How credit cards actually work](complete-guide-to-credit-cards)
2. **Related concept:** [Building an emergency fund to avoid relying on high-utilization debt](emergency-funds)
3. **More advanced concept:** [How personal loans work and how your credit score affects the rate you're offered](complete-guide-to-personal-loans)
4. **Practical tool:** Calculate your own overall utilization using the formula above (total balances ÷ total limits) and compare it against the commonly cited 30% guideline.`,
};
