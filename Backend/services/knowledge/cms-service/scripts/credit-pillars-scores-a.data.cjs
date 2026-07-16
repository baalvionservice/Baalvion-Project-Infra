'use strict';
/*
 * Credit Scores pillar + cluster (part A of 2) — part of the "Credit" content program.
 * Consumed by a seed-credit-pillars.cjs style script, which converts `markdown` into the
 * live CMS block shape and attaches customFields (faq, author, images, sources, cta, etc).
 *
 * This file (part A) contains the pillar article plus the first 8 of 15 cluster articles.
 * A companion "-b" file contains the remaining 7 cluster articles:
 *   how-to-build-credit-from-scratch, how-to-build-credit-with-no-history,
 *   credit-freeze-vs-credit-lock, how-often-does-credit-score-update,
 *   does-checking-your-own-credit-hurt-it, how-to-improve-bad-credit-fast,
 *   authorized-user-credit-card-effect
 */

module.exports = {
  categorySlug: 'credit',
  categoryName: 'Credit Scores',
  sources: [
    { name: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { name: 'Federal Trade Commission', url: 'https://www.ftc.gov' },
    { name: 'AnnualCreditReport.com', url: 'https://www.annualcreditreport.com' },
    { name: 'myFICO consumer education', url: 'https://www.myfico.com' },
    { name: 'USA.gov — Credit Reports and Scores', url: 'https://www.usa.gov/credit-reports' },
  ],

  pillar: {
    slug: 'credit-scores-complete-guide',
    title: 'The Complete Guide to Credit Scores: How They Work and How to Improve Them',
    metaTitle: 'Credit Scores Explained: How They Work & How to Improve Them',
    metaDescription: 'A complete guide to credit scores — what they are, how FICO and VantageScore work, the factors that shape your score, and how to improve it.',
    excerpt: 'Your credit score quietly shapes what you pay for loans, insurance, and even where you can rent. Here is how credit scores actually work — and how to improve yours.',
    focusKeyword: 'credit score',
    secondaryKeywords: ['what is a credit score', 'how credit scores work', 'improve credit score', 'FICO score', 'VantageScore'],
    longTailKeywords: ['how do credit scores work in simple terms', 'what is considered a good credit score', 'how can I improve my credit score fast', 'what factors affect my credit score'],
    searchIntent: 'Informational — consumers researching how credit scores work before applying for credit or trying to improve their score.',
    audience: ['Beginner', 'Intermediate', 'Professional'],
    subcategory: 'Credit Fundamentals',
    tags: ['credit score', 'credit report', 'personal finance basics', 'FICO', 'VantageScore'],
    heroImagePrompt: 'Ultra-realistic professional photograph of a person reviewing a credit score dashboard on a laptop at a home desk, a small notebook and coffee cup nearby, soft natural window light, shallow depth of field, personal finance publication quality, no logos, no text overlays, 16:9 aspect ratio',
    socialImagePrompt: 'Realistic minimalist financial photograph of a credit score gauge-style chart displayed on a tablet resting on a wooden desk beside reading glasses, warm editorial lighting, high-end personal finance magazine cover style, no text, no logos, 16:9',
    coverImageAlt: 'Person reviewing their credit score and credit report on a laptop',
    thumbnailAlt: 'Laptop screen showing a credit score summary dashboard',
    imageFileName: 'credit-scores-complete-guide-hero.jpg',
    keyTakeaways: [
      'A credit score is a three-digit number that summarizes how risky you are as a borrower, based on the information in your credit reports.',
      'Lenders, landlords, insurers, and sometimes employers use credit scores to make fast, standardized decisions about you.',
      'The two major scoring models are FICO Score and VantageScore, both of which score on a 300–850 scale.',
      'Payment history and amounts owed (credit utilization) are generally the two most influential factors in most scoring models.',
      'Improving a credit score is rarely instant — it comes from consistent, positive credit behavior sustained over time.',
      'You are entitled to free copies of your credit reports, which is the foundation for understanding and improving your score.',
    ],
    internalLinks: [
      { slug: 'what-is-a-credit-score', anchor: 'what a credit score actually is' },
      { slug: 'fico-score-vs-vantagescore', anchor: 'FICO Score vs VantageScore' },
      { slug: 'credit-score-factors-explained', anchor: 'the five factors that make up your score' },
      { slug: 'how-to-read-your-credit-report', anchor: 'how to read your credit report' },
      { slug: 'credit-utilization-ratio-explained', anchor: 'credit utilization ratio' },
      { slug: 'how-to-improve-bad-credit-fast', anchor: 'how to improve a bad credit score' },
      { slug: 'how-to-build-credit-from-scratch', anchor: 'how to build credit from scratch' },
    ],
    faq: [
      { question: 'What is a credit score in simple terms?', answer: 'A credit score is a three-digit number, typically between 300 and 850, that summarizes how likely you are to repay borrowed money based on your past credit behavior. Lenders use it as a fast way to gauge risk before extending credit.' },
      { question: 'What is considered a good credit score?', answer: 'Scoring models generally group scores into qualitative tiers such as poor, fair, good, very good, and exceptional, with higher scores signaling lower risk to lenders. The exact cutoffs can vary slightly between FICO and VantageScore, so it is more useful to focus on the trend of your score than a single label.' },
      { question: 'What factors affect my credit score the most?', answer: 'Payment history and the amount of available credit you are using (credit utilization) are typically the most influential factors, followed by the length of your credit history, your mix of credit types, and how much new credit you have recently applied for.' },
      { question: 'What is the difference between FICO and VantageScore?', answer: 'FICO Score and VantageScore are two competing credit scoring models built by different companies using different formulas. Both use the same 300–850 range and rely on similar underlying data, but they can weigh factors differently, so your FICO Score and VantageScore may not be identical at any given moment.' },
      { question: 'How often does my credit score change?', answer: 'Your credit score can change whenever new information is reported to the credit bureaus, which can happen as often as monthly as lenders report account balances and payment activity.' },
      { question: 'Does checking my own credit score hurt it?', answer: 'No. Checking your own credit score or report is considered a soft inquiry and does not affect your score, regardless of how many times you check.' },
      { question: 'How long does it take to improve a credit score?', answer: 'There is no fixed timeline, since it depends on what is holding your score back. Positive habits like on-time payments and lower utilization can show measurable improvement within a few months, while recovering from serious negative marks can take longer.' },
      { question: 'Can I have more than one credit score?', answer: 'Yes. Because there are multiple scoring models and three major credit bureaus, you can have several different credit scores at once, and the exact number you see can vary by which model and bureau generated it.' },
      { question: 'Do I need good credit if I do not plan to borrow money?', answer: 'Even if you rarely borrow, credit scores can influence rental applications, some insurance premiums, and utility deposit requirements in many places, so maintaining healthy credit still has practical value.' },
      { question: 'How do I get my credit report for free?', answer: 'In the United States, you are entitled to free copies of your credit reports from each of the three nationwide credit bureaus through the official site AnnualCreditReport.com, which is authorized under federal law.' },
    ],
    markdown: `A credit score is one of the most consequential numbers in modern financial life, yet most people never see the mechanics behind it. It follows you quietly through major decisions — buying a car, renting an apartment, opening a credit card — shaping the terms you're offered before you even sit down at the negotiating table. Understanding **how credit scores work** turns that quiet influence into something you can actually manage.

This guide explains what a credit score is, why it matters so much, how the major scoring models work, what factors move your score, and how to improve it over time.

## What a Credit Score Actually Is

A credit score is a three-digit number generated by a mathematical model that analyzes the information in your credit reports — your history of borrowing and repaying money — and condenses it into a single figure meant to predict risk. It does not measure your income, savings, or overall wealth. It measures how you have handled credit obligations in the past, which statistical models use as a proxy for how you are likely to handle them in the future. For a deeper walkthrough of the concept itself, see our guide to [what a credit score actually is](what-is-a-credit-score).

## Why Your Credit Score Matters

A credit score matters because it is used as a fast, standardized shortcut by organizations that need to make a risk decision about you without knowing you personally. Common uses include:

- **Loan and credit card approval** — lenders use your score to decide whether to approve an application at all.
- **Interest rates** — a stronger score typically qualifies you for more favorable pricing on mortgages, auto loans, and credit cards.
- **Renting a home** — many landlords and property managers review credit history as part of screening applicants.
- **Insurance premiums** — in some regions and for some policy types, insurers factor credit-based scores into pricing.
- **Utility and phone deposits** — providers sometimes waive deposits for applicants with stronger credit histories.
- **Employment screening** — a small number of employers, in certain roles involving financial responsibility, may review a modified version of your credit report as part of background checks, subject to applicable law and your consent.

## The Major Scoring Models: FICO and VantageScore

There is no single, universal credit score. The two dominant scoring models in the U.S. market are the **FICO Score**, developed by the Fair Isaac Corporation, and **VantageScore**, developed jointly by the three nationwide credit bureaus. Both use a 300–850 scale and rely on data from your credit reports, but they are built with different formulas and can weigh certain factors differently, which is why your FICO Score and VantageScore can differ at any given time. Our dedicated comparison of [FICO Score vs VantageScore](fico-score-vs-vantagescore) breaks down these differences in detail.

## The Factors That Shape Your Score

While the exact formulas behind FICO and VantageScore are proprietary, both are built around the same broad categories of credit behavior:

| Factor category | What it reflects |
| --- | --- |
| Payment history | Whether you have paid past credit obligations on time |
| Amounts owed / utilization | How much of your available credit you are currently using |
| Length of credit history | How long your credit accounts have been open and active |
| Credit mix | The variety of credit types you manage (cards, loans, mortgages) |
| New credit | How much new credit you have recently sought or opened |

We break each of these down individually in [the five factors that make up your score](credit-score-factors-explained), including how credit utilization specifically works in our guide to the [credit utilization ratio](credit-utilization-ratio-explained).

## How Credit Score Ranges Work

FICO Scores range from 300 to 850, with higher numbers indicating lower predicted credit risk. VantageScore uses the same 300–850 range. Rather than memorizing exact cutoffs, it is more useful to think in tiers — roughly poor, fair, good, very good, and exceptional — and to focus on consistently moving upward within that spectrum rather than fixating on a single target number, since lenders also weigh other factors like income and existing debt when making decisions.

> [!INFO] Your credit score is a snapshot, not a permanent verdict. It updates as new information is reported, which means today's score reflects recent behavior more than it reflects a mistake from years ago — especially as older negative items age off your report.

## Common Mistakes That Hurt Your Score

- **Missing payments**, even by a few days on some accounts, which can be reported to the bureaus and weigh heavily on your score.
- **Maxing out credit cards**, which spikes your utilization ratio even if you pay the balance off soon after.
- **Closing your oldest credit card**, which can shorten your average credit history and reduce total available credit.
- **Applying for multiple new accounts in a short window**, which can generate several hard inquiries and signal higher risk.
- **Ignoring your credit report**, which means errors or fraudulent accounts can go unnoticed and unresolved. Learn how to check for and fix these in our guide to [how to read your credit report](how-to-read-your-credit-report).

## Expert Tips for Building and Protecting Your Score

- Pay every account on time, every time — set up autopay or reminders if needed, since payment history carries outsized influence.
- Keep credit utilization low relative to your limits, and pay down balances before statement closing dates when possible.
- Avoid closing old, no-fee credit cards, since they contribute positively to your average account age.
- Space out applications for new credit rather than applying for several accounts at once.
- Review your credit reports regularly for errors, and dispute anything inaccurate — see our guide to [how to improve a bad credit score](how-to-improve-bad-credit-fast) for a structured recovery plan.

## Conclusion

A credit score condenses years of financial behavior into a single number that quietly influences some of the biggest financial decisions in your life. It is not a mystery or a matter of luck — it is a predictable outcome of consistent habits: paying on time, keeping balances low relative to limits, maintaining a healthy mix of accounts, and being deliberate about when you apply for new credit. Whether you are just getting started or working to recover from past setbacks, the path forward is the same: understand the mechanics, monitor your reports, and build good habits steadily over time. If you are starting from zero, our guide to [how to build credit from scratch](how-to-build-credit-from-scratch) is a good next stop.`,
  },

  articles: [
    {
      slug: 'what-is-a-credit-score',
      title: 'What Is a Credit Score and Why It Matters',
      metaTitle: 'What Is a Credit Score and Why It Matters',
      metaDescription: 'Learn exactly what a credit score is, who uses it, how it is calculated at a high level, and why it has such a big impact on your financial life.',
      excerpt: 'A credit score is more than a number lenders look at — it quietly shapes the terms of loans, housing, and more. Here is what it actually is.',
      focusKeyword: 'what is a credit score',
      secondaryKeywords: ['credit score definition', 'how credit scores are used', 'credit score meaning', 'why credit scores matter'],
      longTailKeywords: ['what is a credit score used for', 'why do I need a credit score', 'who looks at your credit score'],
      searchIntent: 'Informational — beginners seeking a foundational definition of credit scores.',
      audience: ['Beginner'],
      subcategory: 'Credit Fundamentals',
      tags: ['credit score basics', 'credit score definition', 'personal finance'],
      heroImagePrompt: 'Realistic professional photograph of a young adult reviewing a credit score summary on a smartphone while sitting at a kitchen table with a notebook, warm natural lighting, approachable personal finance publication style, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic close-up photo of a smartphone displaying a simple credit score gauge graphic resting on a wooden table beside a cup of tea, editorial lighting, no readable text, no logos, 16:9',
      coverImageAlt: 'Person checking their credit score on a smartphone at home',
      thumbnailAlt: 'Smartphone showing a credit score gauge graphic',
      imageFileName: 'what-is-a-credit-score.jpg',
      keyTakeaways: [
        'A credit score is a numeric summary of your credit risk, generated from the information in your credit reports.',
        'Scores typically range from 300 to 850 under the most widely used models.',
        'Lenders, landlords, insurers, and utility providers commonly use credit scores to make fast decisions about you.',
        'A credit score is not the same as a credit report — the report is the underlying data, the score is the calculated summary.',
        'Your score is dynamic and can change as new information is reported to the credit bureaus.',
      ],
      internalLinks: [
        { slug: 'credit-scores-complete-guide', anchor: 'complete guide to credit scores' },
        { slug: 'credit-score-factors-explained', anchor: 'the five factors behind your score' },
        { slug: 'fico-score-vs-vantagescore', anchor: 'FICO Score vs VantageScore' },
        { slug: 'how-to-read-your-credit-report', anchor: 'how to read your credit report' },
      ],
      faq: [
        { question: 'What is a credit score, exactly?', answer: 'A credit score is a three-digit number produced by a statistical model that analyzes your credit report and estimates how likely you are to repay borrowed money as agreed. It is used primarily as a risk-assessment tool by lenders.' },
        { question: 'Is a credit score the same as a credit report?', answer: 'No. A credit report is the detailed record of your credit accounts, payment history, and inquiries. A credit score is a single number calculated from that report using a scoring formula.' },
        { question: 'Who calculates credit scores?', answer: 'Credit scores are calculated by scoring model companies, most notably Fair Isaac Corporation (FICO) and VantageScore Solutions, using data licensed from the credit bureaus that maintain your credit reports.' },
        { question: 'Why do I need a credit score?', answer: 'A credit score allows lenders, landlords, and other organizations to quickly evaluate your creditworthiness without manually reviewing your entire financial history, which affects your access to loans, housing, and sometimes services.' },
        { question: 'What is a good starting point if I have no credit score yet?', answer: 'If you have no credit history, you typically have no score yet rather than a low one. Building credit usually starts with a simple product like a secured credit card or becoming an authorized user on someone else’s account.' },
        { question: 'Does my income affect my credit score?', answer: 'No. Credit scores are based on how you manage credit, not on your income. However, lenders often consider income separately, alongside your credit score, when deciding whether to approve a loan.' },
        { question: 'Can my credit score go down even if I do nothing wrong?', answer: 'Yes, in some cases. For example, a lender lowering your credit limit can raise your utilization ratio, or an old account closing can shorten your average credit history, both of which can lower your score without any new negative behavior.' },
        { question: 'How many credit scores does a person typically have?', answer: 'A person can have several credit scores at once, since different scoring models (like FICO and VantageScore) and different credit bureaus can each generate a slightly different number based on the same underlying data.' },
        { question: 'Does everyone have a credit score?', answer: 'Not necessarily. If you have never used credit or have not used it recently enough to generate current data, you may not have an active score yet, which is sometimes described as being "credit invisible."' },
        { question: 'Where can I check my credit score?', answer: 'Many banks, credit card issuers, and personal finance apps now offer free access to a version of your credit score, and you can also obtain your full credit reports for free through AnnualCreditReport.com.' },
      ],
      markdown: `Nearly every adult has heard the phrase "credit score," but far fewer people can explain exactly what it is or how it comes to exist. Understanding **what a credit score is** is the first step toward using it to your advantage instead of being surprised by it.

## The Basic Definition

A credit score is a numeric summary, typically ranging from 300 to 850, generated by a scoring model that analyzes the data in your credit reports. It condenses years of borrowing and repayment behavior into a single figure meant to predict how likely you are to repay debt as agreed. It is a prediction, not a judgment of your character or worth — it simply reflects patterns in how you have handled credit obligations.

## Credit Score vs Credit Report

These two terms are often used interchangeably, but they are not the same thing. Your **credit report** is the detailed record: which accounts you have, their balances, your payment history, and any public records or collections associated with your name. Your **credit score** is a calculated output derived from that report using a scoring formula. Think of the report as the raw data and the score as the summary statistic. For a full walkthrough of report structure, see our guide to [how to read your credit report](how-to-read-your-credit-report).

## Who Actually Uses Your Credit Score

Credit scores are used far more broadly than most people realize:

- **Banks and credit unions** rely on it to decide whether to approve loans and credit cards, and at what interest rate.
- **Landlords and property managers** often review it during tenant screening.
- **Insurance companies**, in some markets, incorporate credit-based scores into premium calculations.
- **Utility and telecom providers** may use it to decide whether to require a security deposit.
- **Some employers**, for roles involving financial responsibility, may review a modified credit report as part of a background check, generally with your consent and subject to applicable law.

## Why a Single Number Carries So Much Weight

The appeal of a credit score to organizations is speed and consistency. Manually reviewing someone's entire financial history for every decision would be slow, inconsistent, and expensive. A standardized score lets a lender or landlord apply the same criteria across thousands of applicants quickly. That efficiency is exactly why understanding and managing your score is worth the effort — a single number is doing a lot of work behind the scenes.

> [!INFO] A credit score is not permanent. It is recalculated whenever new information is reported, which means your score today reflects your recent credit behavior far more than it reflects mistakes from years past.

## How a Score Comes Together

While the precise formulas used by scoring companies are proprietary, they are built around consistent categories of behavior: how reliably you pay on time, how much of your available credit you are using, how long you have had credit, the variety of credit types you manage, and how often you seek new credit. We unpack each of these individually in [the five factors behind your score](credit-score-factors-explained), and compare the two dominant scoring models in [FICO Score vs VantageScore](fico-score-vs-vantagescore).

## Common Misunderstandings

- **"Checking my own score hurts it."** It does not — checking your own score is a soft inquiry with no impact.
- **"I need to carry a balance to build credit."** You do not; paying in full each month still builds positive history.
- **"My score is fixed once it's bad."** Scores are dynamic and respond to sustained changes in behavior over time.
- **"Income determines my score."** It does not directly, though lenders often weigh income separately in their overall decision.

## Conclusion

A credit score is simply a standardized, numeric answer to the question: how risky is it to lend this person money? It is calculated from your credit report, used across a surprising range of everyday decisions, and — most importantly — responsive to your ongoing behavior. Once you understand what it is and why it exists, it becomes far less mysterious and far more manageable. From here, explore the [complete guide to credit scores](credit-scores-complete-guide) to see how all the pieces fit together.`,
    },
    {
      slug: 'fico-score-vs-vantagescore',
      title: 'FICO Score vs VantageScore: What’s the Difference',
      metaTitle: 'FICO Score vs VantageScore: What’s the Difference',
      metaDescription: 'Compare FICO Score and VantageScore — how each model works, how they differ, and why your two scores might not match.',
      excerpt: 'You might see two different numbers when you check your credit — here is why, and what actually separates FICO from VantageScore.',
      focusKeyword: 'FICO score vs VantageScore',
      secondaryKeywords: ['FICO score', 'VantageScore', 'credit scoring models', 'difference between credit scores'],
      longTailKeywords: ['why is my FICO score different from VantageScore', 'which credit score do lenders actually use', 'is VantageScore as accurate as FICO'],
      searchIntent: 'Commercial comparison — consumers confused about differing score numbers from different sources.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Scoring Models',
      tags: ['FICO', 'VantageScore', 'credit scoring models', 'comparison'],
      heroImagePrompt: 'Realistic professional photo of two contrasting credit score gauge charts displayed side by side on separate monitor screens in a bright home office, soft natural lighting, personal finance publication style, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic photograph of two smartphones lying side by side on a desk each showing a different gauge-style score graphic, editorial lighting, no readable text, no logos, 16:9',
      coverImageAlt: 'Two different credit score gauge charts shown side by side',
      thumbnailAlt: 'Comparison of two credit score gauge graphics',
      imageFileName: 'fico-vs-vantagescore.jpg',
      keyTakeaways: [
        'FICO Score and VantageScore are two separate, competing credit scoring models built by different companies.',
        'Both use a 300–850 range, but they can weigh the same underlying credit data differently.',
        'FICO Score has historically been the more widely used model among lenders, especially for mortgages.',
        'VantageScore was created jointly by the three nationwide credit bureaus and can sometimes score thinner credit files that FICO cannot.',
        'It is normal, not alarming, for your FICO Score and VantageScore to differ at the same point in time.',
      ],
      internalLinks: [
        { slug: 'credit-scores-complete-guide', anchor: 'complete guide to credit scores' },
        { slug: 'what-is-a-credit-score', anchor: 'what a credit score actually is' },
        { slug: 'credit-score-factors-explained', anchor: 'the five factors behind your score' },
        { slug: 'how-often-does-credit-score-update', anchor: 'how often your credit score updates' },
      ],
      faq: [
        { question: 'What is the main difference between FICO Score and VantageScore?', answer: 'Both are credit scoring models that analyze data from your credit reports on a 300–850 scale, but they were developed by different companies using different formulas, so they can weigh factors like payment history and utilization somewhat differently.' },
        { question: 'Which score do lenders actually use?', answer: 'Historically, FICO Score has been the more commonly used model among lenders, particularly for mortgage lending, though VantageScore usage has grown, especially among fintech apps and some credit card issuers.' },
        { question: 'Why are my FICO Score and VantageScore different numbers?', answer: 'Since the two models use different formulas and sometimes weigh factors differently, it is normal and expected for them to produce different scores even when calculated from the same underlying credit report data at the same time.' },
        { question: 'Who created VantageScore?', answer: 'VantageScore was developed jointly by the three nationwide credit bureaus — Equifax, Experian, and TransUnion — partly to offer an alternative to the FICO model.' },
        { question: 'Who created the FICO Score?', answer: 'The FICO Score was developed by the Fair Isaac Corporation, a company that has built credit scoring models since the mid-20th century and remains one of the most widely referenced names in credit scoring.' },
        { question: 'Can VantageScore score people that FICO cannot?', answer: 'VantageScore has historically been able to generate a score for consumers with a shorter or thinner credit history than some FICO models require, which can help newer credit users get scored sooner.' },
        { question: 'Do FICO and VantageScore use the same range?', answer: 'Yes, the most commonly used versions of both models score consumers on a 300 to 850 scale, though earlier versions of VantageScore used a different range, so it is worth confirming which version you are viewing.' },
        { question: 'Should I focus on improving my FICO Score or my VantageScore?', answer: 'Since both models are built around the same broad categories of credit behavior — payment history, utilization, credit age, mix, and new credit — improving your habits in those areas tends to improve both scores over time.' },
        { question: 'Are there multiple versions of FICO Score and VantageScore?', answer: 'Yes. Both companies have released multiple generations of their scoring models over the years, and industry-specific versions exist for products like auto loans and mortgages, which can also produce slightly different numbers.' },
        { question: 'Is one model more accurate than the other?', answer: 'Neither model is universally "more accurate" — both are built to predict credit risk using similar data, and their usefulness depends on which model the specific lender you are working with actually relies on.' },
      ],
      markdown: `If you have ever checked your credit score through two different apps or banks and seen two different numbers, you are not imagining things — and you have not done anything wrong. The explanation almost always comes down to **FICO Score vs VantageScore**, the two dominant credit scoring models used in the United States.

## Two Companies, Two Formulas

A credit score is not a fact pulled directly off your credit report — it is the output of a proprietary mathematical model. **FICO Score** is produced by the Fair Isaac Corporation, a company with a long history in credit risk modeling. **VantageScore** is produced by VantageScore Solutions, a company created jointly by the three nationwide credit bureaus — Equifax, Experian, and TransUnion. Because these are separate companies with separate formulas, they do not produce identical scores, even when analyzing the same underlying credit data.

## What They Have in Common

Despite being competitors, FICO Score and VantageScore share a lot of structural similarity:

- Both use a **300 to 850 scale** in their current, most widely used versions.
- Both draw on the same broad categories of information: payment history, amounts owed, length of credit history, credit mix, and new credit activity.
- Both are recalculated as new information is reported to the credit bureaus, meaning both are dynamic rather than fixed.

For a closer look at those underlying categories, see [the five factors behind your score](credit-score-factors-explained).

## Where They Diverge

| Aspect | FICO Score | VantageScore |
| --- | --- | --- |
| Developer | Fair Isaac Corporation | Equifax, Experian, and TransUnion jointly |
| Common lender usage | Historically dominant, especially in mortgage lending | Growing usage, common in banking apps and some card issuers |
| Scoring thin credit files | Can require more history for some versions | Historically able to score some thinner files sooner |
| Factor weighting | Proprietary formula | Proprietary formula, can weigh categories differently |

The practical takeaway is not that one model is "better," but that they are genuinely different products built to answer a similar question in slightly different ways.

> [!INFO] It is completely normal for your FICO Score and VantageScore to differ by a meaningful margin at the same moment in time. A gap between the two numbers is not, by itself, something to be concerned about.

## Why This Matters When You Check Your Score

Many free credit score tools, whether from a bank, credit card issuer, or personal finance app, display a specific model and version — often a VantageScore, since it is widely licensed for consumer-facing tools. If a mortgage lender later pulls a specific FICO Score version, the number they see may differ from what you have been tracking. That does not mean either number is wrong; it means you are looking at two different, legitimate measurements.

## Which One Should You Pay Attention To?

In practice, you rarely get to choose which model a lender uses, so the more useful strategy is to focus on the credit behaviors that both models reward: paying on time, keeping utilization low, maintaining older accounts, diversifying credit types responsibly, and being deliberate about new credit applications. Improvement in one model will almost always be mirrored, directionally, in the other, even if the exact numbers differ.

## Common Mistakes

- Assuming a "wrong" number when two scores differ, rather than recognizing they are different models.
- Fixating on a single score from one app while ignoring the underlying credit behavior that drives both.
- Not checking which specific version or scoring model a lender actually uses before a major application, like a mortgage.

## Conclusion

FICO Score and VantageScore are two competing, legitimate ways of measuring the same underlying credit risk, built by different organizations with different formulas. Seeing different numbers from different sources is expected, not a sign of an error. The most reliable strategy is to build the credit habits that both models reward, rather than chasing a single number from a single source. Return to the [complete guide to credit scores](credit-scores-complete-guide) for the full picture.`,
    },
    {
      slug: 'credit-score-factors-explained',
      title: 'The 5 Factors That Make Up Your Credit Score',
      metaTitle: 'The 5 Factors That Make Up Your Credit Score',
      metaDescription: 'A clear breakdown of the five main factors behind your credit score — payment history, utilization, credit age, credit mix, and new credit.',
      excerpt: 'Your credit score is not random — it is built from five specific categories of behavior. Here is how each one works.',
      focusKeyword: 'credit score factors',
      secondaryKeywords: ['what affects credit score', 'payment history', 'credit utilization', 'length of credit history', 'credit mix', 'new credit'],
      longTailKeywords: ['what are the 5 factors of a credit score', 'which credit score factor matters most', 'how does credit mix affect my score'],
      searchIntent: 'Informational — consumers wanting to understand exactly what drives their credit score up or down.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Scoring Factors',
      tags: ['credit score factors', 'payment history', 'credit utilization', 'credit mix'],
      heroImagePrompt: 'Realistic professional photograph of a financial coach explaining a simple five-category breakdown chart on a whiteboard to a client in a bright office, natural lighting, personal finance publication style, no readable text, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of a pie-chart style printed handout on a desk beside a pen and coffee cup, editorial finance photography, no readable text, no logos, 16:9',
      coverImageAlt: 'Financial coach explaining the factors behind a credit score',
      thumbnailAlt: 'Chart breaking down credit score factors',
      imageFileName: 'credit-score-factors-explained.jpg',
      keyTakeaways: [
        'Credit scores are generally built from five broad categories: payment history, amounts owed, length of history, credit mix, and new credit.',
        'Payment history and amounts owed (utilization) are typically the most influential categories across major scoring models.',
        'Length of credit history rewards older, established accounts and a longer average account age.',
        'Credit mix considers whether you responsibly manage different types of credit, such as cards and installment loans.',
        'New credit activity, including recent applications, is weighed to detect sudden increases in borrowing risk.',
      ],
      internalLinks: [
        { slug: 'credit-scores-complete-guide', anchor: 'complete guide to credit scores' },
        { slug: 'credit-utilization-ratio-explained', anchor: 'credit utilization ratio explained' },
        { slug: 'hard-inquiry-vs-soft-inquiry', anchor: 'hard inquiry vs soft inquiry' },
        { slug: 'authorized-user-credit-card-effect', anchor: 'how being an authorized user affects your score' },
      ],
      faq: [
        { question: 'What are the five main credit score factors?', answer: 'The five broad categories most scoring models are built around are payment history, amounts owed (credit utilization), length of credit history, credit mix, and new credit activity.' },
        { question: 'Which factor matters most for my credit score?', answer: 'Payment history is generally considered the most influential category across major scoring models, since consistently paying on time is one of the strongest predictors of future repayment behavior.' },
        { question: 'What counts as "amounts owed"?', answer: 'Amounts owed refers primarily to how much of your available revolving credit you are currently using, commonly called your credit utilization ratio, along with overall balances across your accounts.' },
        { question: 'How does length of credit history affect my score?', answer: 'Longer credit histories, and a higher average age across your accounts, generally support a stronger score, since they give scoring models more data to evaluate consistent behavior over time.' },
        { question: 'What does credit mix mean?', answer: 'Credit mix refers to the variety of credit types you manage responsibly, such as revolving accounts like credit cards alongside installment accounts like auto loans or personal loans.' },
        { question: 'Does applying for a new credit card hurt my score?', answer: 'Applying for new credit typically generates a hard inquiry and can slightly and temporarily lower your score, particularly if you apply for several accounts within a short period.' },
        { question: 'Can one factor outweigh a weakness in another?', answer: 'Scoring models weigh all factors together, so strength in one area, like a long credit history, can help offset a temporary weakness elsewhere, but it generally cannot fully cancel out a serious issue like missed payments.' },
        { question: 'Do closed accounts still count toward my credit history length?', answer: 'Closed accounts in good standing can continue to factor into your credit history for a period of time, but eventually they age off your report, which can shorten your average account age.' },
        { question: 'Is it bad to only have one type of credit account?', answer: 'Having only one type of account is not inherently disqualifying, but demonstrating responsible management across a mix of account types can support a stronger score over time.' },
        { question: 'How quickly do these factors change my score?', answer: 'Some factors, like utilization, can shift your score relatively quickly as balances are reported, while others, like length of history, change gradually and predictably over months and years.' },
      ],
      markdown: `Your credit score can feel like a black box, but it is actually built from a consistent, well-documented set of categories. Understanding these **credit score factors** turns an abstract number into something you can directly influence through everyday decisions.

## The Five Categories

Both FICO Score and VantageScore are built around the same broad categories of credit behavior, even though their exact formulas are proprietary. Here is how they generally rank in relative importance:

| Factor | What it measures | Relative importance |
| --- | --- | --- |
| Payment history | Whether you have paid on time | Most important |
| Amounts owed / utilization | How much available credit you are using | Very important |
| Length of credit history | How long your accounts have been open | Moderately important |
| Credit mix | Variety of credit types you manage | Less important |
| New credit | Recent applications and new accounts | Less important |

## Factor 1: Payment History

Payment history reflects whether you have paid your credit obligations on time, and it is widely regarded as the single most influential category in most scoring models. A pattern of on-time payments builds strong positive history, while missed or late payments — especially those reported to the credit bureaus — can weigh heavily against your score for an extended period.

## Factor 2: Amounts Owed (Credit Utilization)

This category looks at how much of your available credit you are currently using, most commonly expressed as your **credit utilization ratio** — the percentage of your credit limits that are currently in use. High utilization can signal financial strain to scoring models, even if you always pay on time. We cover this in full detail in our guide to [credit utilization ratio explained](credit-utilization-ratio-explained).

## Factor 3: Length of Credit History

This factor considers how long you have had credit overall, including the age of your oldest account, the age of your newest account, and the average age across all your accounts. A longer, well-managed history gives scoring models more data points to evaluate, which generally supports a stronger score.

## Factor 4: Credit Mix

Credit mix examines the variety of credit types you manage — for example, revolving credit like credit cards alongside installment credit like auto loans, student loans, or mortgages. Responsibly handling a mix of account types can be a modest positive signal, though it is far less influential than payment history or utilization, and it is not something you should artificially chase by opening accounts you do not need.

## Factor 5: New Credit

This category considers how many new accounts you have recently opened and how many recent hard inquiries appear on your report. A flurry of new applications in a short window can suggest higher risk, since it may indicate a sudden need for credit. Understanding the distinction between inquiry types matters here — see our guide to [hard inquiry vs soft inquiry](hard-inquiry-vs-soft-inquiry) for the details.

> [!INFO] These five categories interact with each other. A long, positive payment history paired with low utilization tends to produce the strongest scores, while weakness in any single category can be partially offset — but rarely fully erased — by strength elsewhere.

## Common Mistakes

- Ignoring utilization while assuming on-time payments alone guarantee a strong score.
- Closing old accounts without considering the impact on average credit age.
- Opening several new accounts at once to "diversify" credit mix, which can backfire through added inquiries.
- Assuming credit mix matters as much as payment history — it does not.

## Conclusion

Your credit score is not an arbitrary number — it is a structured summary of five specific behaviors: paying on time, managing utilization, sustaining a long credit history, maintaining a sensible credit mix, and being deliberate about new credit. Focusing your effort on the first two factors, payment history and utilization, tends to produce the most meaningful movement in your score over time. For the bigger picture, revisit the [complete guide to credit scores](credit-scores-complete-guide).`,
    },
    {
      slug: 'how-to-read-your-credit-report',
      title: 'How to Read Your Credit Report',
      metaTitle: 'How to Read Your Credit Report: A Section-by-Section Guide',
      metaDescription: 'Learn how to read your credit report section by section — personal information, accounts, inquiries, and public records — and what to check for errors.',
      excerpt: 'A credit report can look like a wall of data. Here is how to read it section by section and spot what actually matters.',
      focusKeyword: 'how to read your credit report',
      secondaryKeywords: ['credit report sections', 'understanding credit report', 'credit report vs credit score', 'free credit report'],
      longTailKeywords: ['how do I read my credit report for the first time', 'what sections are on a credit report', 'how do I check my credit report for errors'],
      searchIntent: 'Informational/how-to — consumers viewing their credit report for the first time and unsure how to interpret it.',
      audience: ['Beginner'],
      subcategory: 'Credit Reports',
      tags: ['credit report', 'credit report sections', 'AnnualCreditReport.com'],
      heroImagePrompt: 'Realistic photograph of a person at a kitchen table carefully reading a printed credit report document with a highlighter in hand, warm natural lighting, approachable personal finance publication style, no readable text, no logos, 16:9',
      socialImagePrompt: 'Realistic close-up photo of a document with a magnifying glass resting on top on a wooden desk, editorial lighting, no readable text, no logos, 16:9',
      coverImageAlt: 'Person reviewing a printed credit report with a highlighter',
      thumbnailAlt: 'Credit report document with a magnifying glass',
      imageFileName: 'how-to-read-credit-report.jpg',
      keyTakeaways: [
        'A credit report is organized into distinct sections: personal information, accounts, inquiries, and public records or collections.',
        'The accounts section, sometimes called tradelines, is usually the largest and most important part of the report.',
        'You are entitled to free copies of your credit reports from each nationwide credit bureau through AnnualCreditReport.com.',
        'Reviewing your report regularly helps you catch errors or signs of fraud before they damage your score.',
        'Your credit report does not display your credit score directly — the score is calculated separately from the report data.',
      ],
      internalLinks: [
        { slug: 'credit-scores-complete-guide', anchor: 'complete guide to credit scores' },
        { slug: 'how-to-dispute-a-credit-report-error', anchor: 'how to dispute a credit report error' },
        { slug: 'credit-score-factors-explained', anchor: 'the five factors behind your score' },
        { slug: 'how-long-negative-items-stay-on-credit-report', anchor: 'how long negative items stay on your report' },
      ],
      faq: [
        { question: 'What is on a credit report?', answer: 'A credit report typically includes your personal identifying information, a list of your credit accounts and their payment history, records of who has checked your credit, and any public records or collections associated with your name.' },
        { question: 'Does my credit report show my credit score?', answer: 'Not necessarily. Your credit report contains the underlying data used to calculate a score, but the score itself is a separate calculation and is not always included when you pull a free report.' },
        { question: 'How do I get my credit report for free?', answer: 'In the United States, you can request a free copy of your credit report from each of the three nationwide credit bureaus through AnnualCreditReport.com, the site authorized under federal law for this purpose.' },
        { question: 'What is a "tradeline" on a credit report?', answer: 'A tradeline is an individual credit account listed on your report, such as a credit card or loan, along with details like its balance, credit limit or original loan amount, and payment history.' },
        { question: 'Why do I have three different credit reports?', answer: 'Each of the three nationwide credit bureaus — Equifax, Experian, and TransUnion — maintains its own separate file on you, since not every lender reports to all three, which can cause your reports to differ slightly.' },
        { question: 'What are "inquiries" on a credit report?', answer: 'Inquiries are a record of who has accessed your credit report. Hard inquiries typically occur when you apply for new credit, while soft inquiries occur for things like pre-approved offers or checking your own credit, and do not affect your score.' },
        { question: 'What should I do if I find an error on my credit report?', answer: 'You should dispute the error directly with the credit bureau reporting it, and typically also with the company that furnished the incorrect information, following a documented dispute process.' },
        { question: 'How often should I check my credit report?', answer: 'Many consumers check their credit reports at least once or twice a year, and more frequently when preparing for a major financial decision like a mortgage application or after suspecting identity theft.' },
        { question: 'Do negative items stay on my credit report forever?', answer: 'No, negative items are generally removed after a set retention period under federal law, though the exact period varies depending on the type of negative information.' },
        { question: 'Can I dispute something on my credit report online?', answer: 'Yes, each of the major credit bureaus offers an online process for submitting disputes, in addition to mail-based options, and typically must investigate within a set timeframe.' },
      ],
      markdown: `A credit report can look intimidating the first time you open one — dense tables, unfamiliar terminology, and long lists of accounts. But once you know **how to read your credit report** section by section, it becomes a genuinely useful tool for understanding and protecting your financial standing.

## Personal Information

The first section typically lists your identifying information: name, current and past addresses, date of birth, and sometimes employer information reported by past creditors. This section is worth checking carefully, since unfamiliar addresses or names can sometimes be an early sign of identity mix-ups or fraud.

## Accounts (Tradelines)

This is usually the largest and most important section. Each account you have opened — credit cards, auto loans, student loans, mortgages — appears as an individual entry, often called a **tradeline**, showing:

- The creditor's name and account type
- When the account was opened
- Your credit limit or original loan amount
- Your current balance
- Your payment history, month by month, over an extended period

This section reflects the raw data behind several of [the five factors behind your score](credit-score-factors-explained), particularly payment history and amounts owed.

## Credit Inquiries

This section lists who has accessed your credit report and when. Inquiries are generally split into two types: those tied to your own applications for credit, and those made for other purposes, like pre-approved offer screening or your own account monitoring. Not all inquiries affect your score — see our full breakdown in [hard inquiry vs soft inquiry](hard-inquiry-vs-soft-inquiry).

## Public Records and Collections

This section covers more serious negative items, such as accounts sent to collections, or certain public record filings. These items tend to carry the most weight against your score and remain on your report for a defined period set by federal law, which we cover in detail in [how long negative items stay on your report](how-long-negative-items-stay-on-credit-report).

| Section | What it contains |
| --- | --- |
| Personal information | Name, addresses, date of birth |
| Accounts / tradelines | Credit cards, loans, balances, payment history |
| Inquiries | Record of who has checked your credit and when |
| Public records / collections | Serious negative items like collections accounts |

## What Your Credit Report Does Not Show

Your credit report does not display your credit score by default — the score is a separate calculation performed by a scoring model using the report's data. It also does not include your income, bank account balances, or most day-to-day spending, which surprises many people expecting a full financial snapshot.

> [!INFO] You are entitled to free copies of your credit report from each of the three nationwide bureaus through AnnualCreditReport.com, the site authorized under federal law for this purpose. Reviewing all three, not just one, gives you the most complete picture, since not every creditor reports to every bureau.

## What to Check For

When reviewing your report, look specifically for:

- Accounts you do not recognize, which can indicate identity theft.
- Incorrect balances or credit limits.
- Late payments listed that you believe were actually made on time.
- Accounts that should have aged off but are still appearing.
- Outdated personal information, like an old address you never lived at.

If you find something wrong, our guide to [how to dispute a credit report error](how-to-dispute-a-credit-report-error) walks through the process step by step.

## Common Mistakes

- Assuming your credit report shows your score — it usually does not.
- Only checking one of the three bureau reports instead of all three.
- Ignoring small discrepancies that could compound over time if left uncorrected.

## Conclusion

Your credit report is the raw material behind your credit score, and learning to read it section by section — personal information, accounts, inquiries, and public records — puts you in a far stronger position to catch errors, understand your standing, and take deliberate action to improve it. Return to the [complete guide to credit scores](credit-scores-complete-guide) to see how report data ultimately becomes your score.`,
    },
    {
      slug: 'credit-utilization-ratio-explained',
      title: 'What Is a Credit Utilization Ratio and Why It Matters',
      metaTitle: 'What Is a Credit Utilization Ratio and Why It Matters',
      metaDescription: 'Learn what a credit utilization ratio is, how it is calculated, why it is one of the biggest factors in your credit score, and how to manage it.',
      excerpt: 'Credit utilization is one of the most influential — and most misunderstood — parts of your credit score. Here is how it actually works.',
      focusKeyword: 'credit utilization ratio',
      secondaryKeywords: ['credit utilization', 'how utilization affects credit score', 'credit card balance to limit ratio', 'lower credit utilization'],
      longTailKeywords: ['what is a good credit utilization ratio', 'how do I calculate my credit utilization', 'does paying off my card lower my utilization immediately'],
      searchIntent: 'Informational — consumers wanting to understand and manage the utilization portion of their score.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Scoring Factors',
      tags: ['credit utilization', 'credit card debt', 'credit score factors'],
      heroImagePrompt: 'Realistic professional photograph of a person reviewing a credit card statement and a simple balance versus limit bar chart on a laptop at a home desk, natural lighting, personal finance publication style, no readable text, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of a credit card resting beside a laptop displaying a simple gauge-style utilization graphic, editorial lighting, no readable text, no logos, 16:9',
      coverImageAlt: 'Person reviewing credit card utilization on a laptop',
      thumbnailAlt: 'Laptop showing a credit utilization gauge graphic',
      imageFileName: 'credit-utilization-ratio-explained.jpg',
      keyTakeaways: [
        'Credit utilization is the percentage of your available revolving credit that you are currently using.',
        'It is calculated by dividing your total balances by your total credit limits, expressed as a percentage.',
        'Utilization is typically evaluated both per-card and across all your revolving accounts combined.',
        'Lower utilization is generally viewed more favorably by scoring models, though it does not need to be zero.',
        'Utilization can change month to month, since it is usually based on the balance reported on your statement closing date.',
      ],
      internalLinks: [
        { slug: 'credit-scores-complete-guide', anchor: 'complete guide to credit scores' },
        { slug: 'credit-score-factors-explained', anchor: 'the five factors behind your score' },
        { slug: 'how-to-improve-bad-credit-fast', anchor: 'how to improve a bad credit score fast' },
        { slug: 'how-often-does-credit-score-update', anchor: 'how often your credit score updates' },
      ],
      faq: [
        { question: 'What is credit utilization ratio?', answer: 'Credit utilization ratio is the percentage of your available revolving credit — mainly credit cards — that you are currently using, calculated by dividing your total balances by your total credit limits.' },
        { question: 'How do I calculate my credit utilization?', answer: 'Add up the balances across your revolving credit accounts, add up your total credit limits across those same accounts, then divide total balances by total limits and multiply by 100 to get a percentage.' },
        { question: 'Is utilization calculated per card or overall?', answer: 'Scoring models typically look at both: your overall utilization across all revolving accounts combined, and your utilization on each individual card, since a single maxed-out card can still be flagged even if your overall ratio looks fine.' },
        { question: 'What is considered a good credit utilization ratio?', answer: 'There is no single official cutoff, but lower utilization is generally viewed more favorably, and many financial educators suggest keeping utilization comfortably below the midpoint of your available limit as a general guideline rather than a strict rule.' },
        { question: 'Does utilization matter if I pay my balance in full every month?', answer: 'It can still matter, because utilization is usually based on the balance reported to the credit bureaus on your statement closing date, which may not be zero even if you pay in full before the due date.' },
        { question: 'Does closing a credit card affect my utilization?', answer: 'Yes. Closing a card removes its credit limit from your total available credit, which can raise your overall utilization ratio even if your spending habits have not changed.' },
        { question: 'How quickly does utilization affect my score?', answer: 'Utilization can change your score relatively quickly, often within one billing cycle, since it is recalculated whenever new balance and limit information is reported to the credit bureaus.' },
        { question: 'Can requesting a higher credit limit help my utilization?', answer: 'Yes, increasing your available credit limit while keeping your balances the same lowers your utilization ratio, though the request itself may generate a hard inquiry depending on the issuer.' },
        { question: 'Does utilization apply to installment loans like mortgages?', answer: 'Utilization primarily applies to revolving credit like credit cards and lines of credit. Installment loans, like auto loans and mortgages, are evaluated differently, mainly through your remaining balance relative to the original loan amount and your payment history.' },
        { question: 'Is it bad to use my credit card at all?', answer: 'No — using a credit card for everyday purchases and paying it off is a normal and often positive way to build credit history. The concern is carrying consistently high balances relative to your limits, not simply using the card.' },
      ],
      markdown: `If payment history is the most influential factor in your credit score, **credit utilization ratio** is close behind it — and it is one of the few factors you can meaningfully move in a short amount of time.

## What Credit Utilization Actually Means

Credit utilization ratio measures how much of your available revolving credit — primarily credit cards and lines of credit — you are currently using. It is expressed as a percentage: the total balances you owe divided by the total credit limits available to you, multiplied by 100.

For example, if you have a combined credit limit of a certain amount across your cards and you are currently carrying a portion of that limit in balances, your utilization ratio reflects what share of your total available credit is in use at that moment.

## How It Is Calculated

Utilization is generally evaluated in two ways:

- **Overall utilization** — total balances across all your revolving accounts divided by total credit limits across those same accounts.
- **Per-card utilization** — the balance on each individual card divided by that card's specific limit.

Both matter. Scoring models can flag a single card that is maxed out even if your combined utilization across all cards looks reasonable, which is why concentrating a large balance on one card can hurt more than spreading it across several.

## Why Utilization Carries So Much Weight

Utilization is treated as a meaningful signal because it reflects how dependent you currently are on available credit. A consumer using a small fraction of their available credit looks financially comfortable to a scoring model, while a consumer consistently near their limits can look financially stretched, regardless of whether they ultimately pay on time. This is part of the "amounts owed" category described in [the five factors behind your score](credit-score-factors-explained).

## Why Your Utilization Might Not Be Zero Even If You Pay in Full

Many people are surprised to see a nonzero utilization ratio even though they always pay their credit card in full. This happens because card issuers typically report your balance to the credit bureaus as of your **statement closing date**, not your payment due date. If you made purchases during the billing cycle, that balance may be reported before your on-time payment posts, producing a nonzero utilization figure for that reporting period.

> [!INFO] Paying down your balance before the statement closing date, rather than only before the due date, can lower the balance that actually gets reported to the credit bureaus for that cycle.

## Managing Your Utilization

- **Pay down balances proactively**, ideally before the statement closes, rather than waiting for the due date.
- **Spread large purchases across multiple cards** if a single purchase would otherwise spike one card's individual utilization.
- **Avoid closing old cards with no annual fee**, since doing so removes their limit from your total available credit.
- **Consider requesting a credit limit increase** on an existing card if your spending habits are stable, which can lower your ratio without changing your balances.

## Common Mistakes

- Assuming utilization only matters overall, while ignoring high balances concentrated on a single card.
- Closing unused cards without considering the effect on total available credit.
- Waiting until the due date to pay, rather than the earlier statement closing date, if trying to influence a specific reporting cycle.
- Believing utilization must be at zero — using credit responsibly and paying it off is a normal, healthy pattern.

## Conclusion

Credit utilization ratio is one of the most direct levers you have over your credit score, precisely because it reflects a recent snapshot of your balances rather than years of accumulated history. Understanding how it is calculated — and why it can appear nonzero even when you pay in full — lets you manage it deliberately rather than being caught off guard. For a broader recovery plan if utilization has been working against you, see our guide to [how to improve a bad credit score fast](how-to-improve-bad-credit-fast).`,
    },
    {
      slug: 'how-long-negative-items-stay-on-credit-report',
      title: 'How Long Does Negative Information Stay on Your Credit Report',
      metaTitle: 'How Long Negative Information Stays on Your Credit Report',
      metaDescription: 'Learn how long late payments, collections, and bankruptcies stay on your credit report under federal law, and how their impact fades over time.',
      excerpt: 'Negative marks on your credit report do not stay forever. Here is how long different types of negative information legally remain, and why.',
      focusKeyword: 'how long negative items stay on credit report',
      secondaryKeywords: ['credit report retention period', 'how long does a late payment stay on credit report', 'how long does bankruptcy stay on credit report', 'Fair Credit Reporting Act'],
      longTailKeywords: ['how long do collections stay on my credit report', 'does a late payment ever go away', 'when does bankruptcy fall off my credit report'],
      searchIntent: 'Informational — consumers wanting to understand how long past credit mistakes will affect them.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Credit Reports',
      tags: ['negative items', 'credit report retention', 'Fair Credit Reporting Act', 'collections'],
      heroImagePrompt: 'Realistic professional photograph of a person looking at a calendar and a printed credit report side by side at a desk, thoughtful expression, natural lighting, personal finance publication style, no readable text, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of a desk calendar with a pen resting on it beside a folder of documents, editorial lighting, no readable text, no logos, 16:9',
      coverImageAlt: 'Person reviewing a calendar alongside a credit report',
      thumbnailAlt: 'Calendar and document folder on a desk',
      imageFileName: 'negative-items-credit-report-retention.jpg',
      keyTakeaways: [
        'Federal law under the Fair Credit Reporting Act sets maximum time limits for how long most negative information can stay on a credit report.',
        'Most negative items, such as late payments and collections, generally remain for around seven years from the date of the original delinquency.',
        'Chapter 7 bankruptcy can remain on a credit report longer than most other negative items, while Chapter 13 bankruptcy generally follows a shorter retention period.',
        'The negative impact of an item on your score typically fades well before the item is actually removed from your report.',
        'Positive information, like on-time payment history, can remain on your report for a long time and continues to help your score.',
      ],
      internalLinks: [
        { slug: 'credit-scores-complete-guide', anchor: 'complete guide to credit scores' },
        { slug: 'how-to-read-your-credit-report', anchor: 'how to read your credit report' },
        { slug: 'how-to-dispute-a-credit-report-error', anchor: 'how to dispute a credit report error' },
        { slug: 'how-to-improve-bad-credit-fast', anchor: 'how to improve a bad credit score fast' },
      ],
      faq: [
        { question: 'How long does a late payment stay on my credit report?', answer: 'A late payment generally remains on your credit report for around seven years from the date of the original missed payment, under the retention limits set by the Fair Credit Reporting Act.' },
        { question: 'How long does a collections account stay on my credit report?', answer: 'A collections account typically remains for about seven years from the date of the original delinquency that led to the account being sent to collections, regardless of whether it is later paid.' },
        { question: 'How long does bankruptcy stay on my credit report?', answer: 'Chapter 7 bankruptcy generally remains on a credit report longer than most negative items, while Chapter 13 bankruptcy is generally retained for a shorter period, both governed by limits set under federal law.' },
        { question: 'Does paying off a collections account remove it from my report immediately?', answer: 'Not necessarily. Paying a collections account does not automatically remove it from your report, though it will be updated to show as paid, and some newer scoring models weigh paid collections less heavily than unpaid ones.' },
        { question: 'What law governs how long negative items can stay on a credit report?', answer: 'The Fair Credit Reporting Act (FCRA), enforced in part by the Federal Trade Commission and the Consumer Financial Protection Bureau, sets the maximum retention periods for most types of negative credit information.' },
        { question: 'Does the negative impact fade before the item is removed?', answer: 'Yes. Most scoring models weigh negative items more heavily when they are recent, and their impact on your score generally diminishes over time even before the item is formally removed from your report.' },
        { question: 'Can a negative item be removed early?', answer: 'A negative item can be removed early if it is inaccurate and successfully disputed, or in some cases through a negotiated agreement with a creditor, but items that are accurate generally must remain until their legal retention period expires.' },
        { question: 'Do hard inquiries follow the same retention rules as late payments?', answer: 'No. Hard inquiries typically remain on a credit report for a shorter period than late payments or collections, and their impact on your score fades relatively quickly.' },
        { question: 'Does positive payment history also expire from my report?', answer: 'Positive information can generally remain on your report for longer than most negative information, continuing to support your score as long as the account remains open or in good standing.' },
        { question: 'Should I wait for a negative item to fall off instead of trying to fix it?', answer: 'It depends on the situation — if an item is inaccurate, disputing it promptly is usually better than waiting, while accurate negative items will naturally age off according to the standard retention period regardless of action.' },
      ],
      markdown: `One of the most common questions in personal finance is some version of: "Will this mistake follow me forever?" The good news is no — **negative information on your credit report does not stay indefinitely**. Federal law sets clear limits on how long most negative items can remain.

## The Fair Credit Reporting Act Sets the Rules

In the United States, the **Fair Credit Reporting Act (FCRA)** establishes maximum time limits for how long most types of negative information can appear on a credit report. This is federal consumer protection law, enforced in part by the Federal Trade Commission and the Consumer Financial Protection Bureau, and it applies uniformly across the three nationwide credit bureaus.

## How Long Common Negative Items Typically Remain

| Type of negative item | General retention period |
| --- | --- |
| Late payments | About 7 years from the original delinquency |
| Collections accounts | About 7 years from the original delinquency |
| Chapter 13 bankruptcy | Generally shorter than Chapter 7 |
| Chapter 7 bankruptcy | Can remain longer than most other negative items |
| Hard inquiries | A relatively short period, much shorter than most negative items |

These are general retention frameworks set by law rather than figures that change year to year, but exact circumstances can vary, so reviewing your actual credit report and, where needed, consulting the CFPB's consumer guidance is always worthwhile for your specific situation.

## Why the Clock Starts at the Original Delinquency

An important detail many people miss: the retention period for a late payment or collections account generally starts from the date of the **original delinquency** — the date you first fell behind — not the date the account was sent to collections or later updated. This means the countdown does not restart just because an account changes hands to a new collection agency or is updated with new activity, which is a common misconception.

> [!WARNING] Making a small payment on an old, unpaid debt can sometimes restart the statute of limitations for legal collection purposes, depending on state law, even though it does not typically reset the credit reporting retention clock. If you are dealing with an old debt, it is worth understanding the difference before making any payment.

## The Impact Fades Before the Item Disappears

Even before a negative item is formally removed from your report, most scoring models weigh it less heavily as it ages. A late payment from several years ago typically has far less impact on your score than one from last month, since scoring models are designed to emphasize recent behavior as the strongest predictor of future risk. This means your score can recover meaningfully well before an old item actually falls off your report.

## What You Can Do in the Meantime

- **Focus on new positive behavior** — consistent on-time payments going forward carry real weight and help offset older negative marks.
- **Check that items are removed on schedule** — verify your report periodically to confirm items are cleared once their retention period expires.
- **Dispute anything inaccurate** — if a negative item is wrong, outdated beyond its retention period, or does not belong to you, you can dispute it; see our guide to [how to dispute a credit report error](how-to-dispute-a-credit-report-error).
- **Avoid restarting the clock unnecessarily** — understand the difference between credit reporting retention rules and separate state debt-collection statutes of limitations before making payments on very old debts.

## Common Mistakes

- Assuming a negative item stays forever and giving up on improving your score.
- Believing that paying off an old collections account instantly removes it from your report.
- Not realizing the retention period counts from the original delinquency, not later account activity.
- Ignoring the possibility that an old item may already be past its legal retention period and eligible for removal.

## Conclusion

Negative information on your credit report is temporary by law, not permanent by default. Understanding the general retention framework set by the Fair Credit Reporting Act — and recognizing that an item's impact fades well before it disappears — makes it easier to stay motivated while you rebuild. For a structured approach to recovery, see our guide to [how to improve a bad credit score fast](how-to-improve-bad-credit-fast).`,
    },
    {
      slug: 'how-to-dispute-a-credit-report-error',
      title: 'How to Dispute an Error on Your Credit Report',
      metaTitle: 'How to Dispute an Error on Your Credit Report',
      metaDescription: 'Step-by-step guide to disputing an error on your credit report — how to gather evidence, file with the credit bureau, and what happens next.',
      excerpt: 'Errors on credit reports are more common than you might think. Here is exactly how to dispute one and get it corrected.',
      focusKeyword: 'how to dispute a credit report error',
      secondaryKeywords: ['credit report dispute process', 'fix credit report error', 'FCRA dispute rights', 'credit bureau dispute'],
      longTailKeywords: ['how do I dispute an error on my credit report', 'how long does a credit dispute take', 'what happens after I file a credit dispute'],
      searchIntent: 'Informational/how-to — consumers who found an inaccuracy and need to know the exact dispute process.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Credit Reports',
      tags: ['credit report dispute', 'credit report errors', 'consumer rights'],
      heroImagePrompt: 'Realistic professional photograph of a person at a desk writing a formal letter with supporting documents and a printed credit report nearby, focused expression, natural lighting, personal finance publication style, no readable text, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of an envelope and printed documents stacked neatly on a desk beside a pen, editorial lighting, no readable text, no logos, 16:9',
      coverImageAlt: 'Person preparing a formal credit report dispute with supporting documents',
      thumbnailAlt: 'Envelope and documents prepared for a credit dispute',
      imageFileName: 'how-to-dispute-credit-report-error.jpg',
      keyTakeaways: [
        'You have the legal right under the Fair Credit Reporting Act to dispute inaccurate information on your credit report.',
        'Disputes can generally be filed directly with the credit bureau reporting the error, and often with the company that furnished the information.',
        'Gathering supporting documentation strengthens your dispute and speeds up resolution.',
        'Credit bureaus are generally required to investigate disputes within a defined timeframe under federal law.',
        'If a dispute is not resolved satisfactorily, you can escalate by filing a complaint with the CFPB or FTC.',
      ],
      internalLinks: [
        { slug: 'credit-scores-complete-guide', anchor: 'complete guide to credit scores' },
        { slug: 'how-to-read-your-credit-report', anchor: 'how to read your credit report' },
        { slug: 'how-long-negative-items-stay-on-credit-report', anchor: 'how long negative items stay on your report' },
        { slug: 'how-to-improve-bad-credit-fast', anchor: 'how to improve a bad credit score fast' },
      ],
      faq: [
        { question: 'What can I dispute on my credit report?', answer: 'You can dispute any information you believe is inaccurate, incomplete, or unverifiable, such as accounts that are not yours, incorrect balances, wrong payment statuses, or outdated items that should have already been removed.' },
        { question: 'How do I file a dispute with a credit bureau?', answer: 'You can typically file a dispute online, by mail, or by phone directly with the credit bureau reporting the error, and it is often wise to also notify the company that originally furnished the incorrect information.' },
        { question: 'What documentation should I include with a dispute?', answer: 'Include any evidence supporting your claim, such as payment confirmations, account statements, identity documents if the issue involves mistaken identity, or correspondence with the creditor, to help the investigation move efficiently.' },
        { question: 'How long does a credit bureau have to investigate a dispute?', answer: 'Under the Fair Credit Reporting Act, credit bureaus are generally required to investigate most disputes within 30 days of receiving them, though this can be extended in certain circumstances, such as when you submit additional relevant information during the investigation.' },
        { question: 'What happens if the dispute is resolved in my favor?', answer: 'If the investigation confirms the information was inaccurate, the credit bureau must correct or remove it from your report and notify the other bureaus if you disputed with only one, and you can request a corrected report.' },
        { question: 'What if the dispute is not resolved in my favor?', answer: 'If the furnisher verifies the information as accurate, it will typically remain on your report, but you have the right to add a brief statement of dispute to your file explaining your side, and you can escalate the matter further if you still disagree.' },
        { question: 'Can I dispute something with the original creditor instead of the credit bureau?', answer: 'Yes, you can generally dispute directly with the company that furnished the information (such as a lender or collections agency), in addition to or instead of disputing with the credit bureau, and both routes are protected under federal law.' },
        { question: 'Does filing a dispute hurt my credit score?', answer: 'No, filing a dispute itself does not directly hurt your score. If the dispute results in a correction, such as removing an inaccurate negative item, your score may actually improve.' },
        { question: 'What should I do if my dispute is ignored or mishandled?', answer: 'If you believe your dispute was not properly investigated, you can file a complaint with the Consumer Financial Protection Bureau or the Federal Trade Commission, both of which oversee compliance with credit reporting laws.' },
        { question: 'Can identity theft cause errors that need to be disputed?', answer: 'Yes, accounts opened fraudulently in your name are a common source of credit report errors, and disputing them typically involves additional steps, such as filing an identity theft report, alongside the standard dispute process.' },
      ],
      markdown: `Credit report errors are more common than many people assume, and they can quietly drag down a score that would otherwise be accurate. Knowing **how to dispute a credit report error** turns a frustrating discovery into a resolvable, well-defined process backed by federal consumer protection law.

## Step 1: Identify the Error Precisely

Before filing anything, pinpoint exactly what is wrong. Common errors include:

- An account that is not yours, possibly due to identity theft or a mixed file.
- An incorrect balance or credit limit.
- A payment marked late when it was actually made on time.
- A closed account still showing as open.
- An old negative item that should have already aged off, based on standard retention rules covered in our guide to [how long negative items stay on your report](how-long-negative-items-stay-on-credit-report).

Reviewing your report carefully — see our guide to [how to read your credit report](how-to-read-your-credit-report) — is the necessary first step before disputing anything.

## Step 2: Gather Supporting Documentation

Strong disputes are backed by evidence. Depending on the error, this might include payment confirmations, bank statements, account closure letters, or identification documents if the issue involves mistaken identity or fraud. The more concrete evidence you provide, the more efficiently the investigation tends to move.

## Step 3: File the Dispute

You generally have two avenues, and pursuing both often strengthens your position:

- **Directly with the credit bureau** reporting the error (Equifax, Experian, or TransUnion), typically through an online dispute portal, by mail, or by phone.
- **Directly with the furnisher** — the bank, lender, or collections agency that originally reported the information — since they are separately required to investigate consumer disputes about data they report.

> [!INFO] If an error appears on reports from more than one bureau, you generally need to file a separate dispute with each bureau involved, since they maintain independent files.

## Step 4: The Investigation Period

Under the Fair Credit Reporting Act, credit bureaus are generally required to investigate most disputes within 30 days of receiving them. During this window, the bureau contacts the furnisher to verify the disputed information. If the furnisher cannot verify it as accurate, the item must be corrected or removed.

## Step 5: Review the Outcome

Once the investigation concludes, the bureau must provide you with the results in writing. If the information is corrected or removed, you are entitled to a free updated copy of your report reflecting the change. If the furnisher verifies the information as accurate, it will generally remain, but you retain the right to add a brief statement of dispute to your file explaining your position.

## Step 6: Escalate if Necessary

If you believe a dispute was not properly investigated, or the outcome still seems wrong, you can escalate by filing a complaint with the Consumer Financial Protection Bureau or the Federal Trade Commission, both of which have oversight responsibilities related to credit reporting accuracy.

## Common Mistakes to Avoid

- Disputing vague or unsupported claims without specifying exactly what is wrong.
- Only disputing with one bureau when the same error appears on multiple reports.
- Failing to keep copies of everything submitted and received during the process.
- Assuming a dispute will hurt your score — it will not, and a successful dispute can help it.
- Giving up after one unclear response instead of escalating through proper channels.

## Conclusion

Disputing an error on your credit report is a well-defined, legally protected process, not a long shot. Identifying the exact error, gathering solid documentation, filing with both the bureau and the furnisher, and following through on the investigation timeline gives you the best chance at a fast, accurate correction. If your credit needs a broader recovery plan beyond a single error, see our guide to [how to improve a bad credit score fast](how-to-improve-bad-credit-fast).`,
    },
    {
      slug: 'hard-inquiry-vs-soft-inquiry',
      title: 'Hard Inquiry vs Soft Inquiry: What’s the Difference',
      metaTitle: 'Hard Inquiry vs Soft Inquiry: What’s the Difference',
      metaDescription: 'Learn the difference between hard and soft credit inquiries, which one affects your credit score, and how to minimize unnecessary hard inquiries.',
      excerpt: 'Not every credit check affects your score. Here is exactly what separates a hard inquiry from a soft inquiry.',
      focusKeyword: 'hard inquiry vs soft inquiry',
      secondaryKeywords: ['hard inquiry', 'soft inquiry', 'credit check types', 'does checking credit hurt score'],
      longTailKeywords: ['does a hard inquiry hurt my credit score', 'what is a soft credit check', 'how many hard inquiries is too many'],
      searchIntent: 'Informational — consumers wanting to understand which credit checks affect their score before applying for new credit.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Scoring Factors',
      tags: ['hard inquiry', 'soft inquiry', 'credit checks', 'new credit'],
      heroImagePrompt: 'Realistic professional photograph of a loan officer and applicant reviewing a credit application form together at a desk in a bank office, natural lighting, professional finance publication style, no readable text, no logos, 16:9',
      socialImagePrompt: 'Realistic close-up photo of a credit application form with a pen resting on it beside a calculator, editorial lighting, no readable text, no logos, 16:9',
      coverImageAlt: 'Loan officer reviewing a credit application with a customer',
      thumbnailAlt: 'Credit application form with a pen and calculator',
      imageFileName: 'hard-inquiry-vs-soft-inquiry.jpg',
      keyTakeaways: [
        'A hard inquiry occurs when a lender checks your credit as part of a decision on an application you submitted, and it can affect your score.',
        'A soft inquiry occurs for things like checking your own credit or pre-qualified offers, and it does not affect your score.',
        'Hard inquiries typically have a small, temporary effect on your score that fades over time.',
        'Many scoring models group multiple hard inquiries for the same type of loan within a short shopping window as a single inquiry.',
        'Checking your own credit report or score, no matter how often, is always treated as a soft inquiry.',
      ],
      internalLinks: [
        { slug: 'credit-scores-complete-guide', anchor: 'complete guide to credit scores' },
        { slug: 'credit-score-factors-explained', anchor: 'the five factors behind your score' },
        { slug: 'does-checking-your-own-credit-hurt-it', anchor: 'does checking your own credit hurt it' },
        { slug: 'how-to-read-your-credit-report', anchor: 'how to read your credit report' },
      ],
      faq: [
        { question: 'What is the difference between a hard inquiry and a soft inquiry?', answer: 'A hard inquiry happens when a lender checks your credit because you applied for credit, and it can have a small, temporary effect on your score. A soft inquiry happens for things like checking your own credit or pre-qualification offers, and it never affects your score.' },
        { question: 'Does a hard inquiry always lower my credit score?', answer: 'A single hard inquiry typically causes a small, temporary dip in most scoring models, though the effect is usually modest and fades within a matter of months.' },
        { question: 'What triggers a hard inquiry?', answer: 'Hard inquiries are generally triggered when you formally apply for new credit, such as a credit card, auto loan, mortgage, or personal loan, and give the lender permission to check your full credit report.' },
        { question: 'What triggers a soft inquiry?', answer: 'Soft inquiries occur when you check your own credit, when a company checks your credit for a pre-approved offer, or when an existing creditor reviews your account periodically, none of which require your explicit application.' },
        { question: 'Can I see hard and soft inquiries on my credit report?', answer: 'Yes, your full credit report lists both types of inquiries, though only hard inquiries are typically visible to lenders reviewing your report, while soft inquiries are usually visible only to you.' },
        { question: 'How long do hard inquiries stay on my credit report?', answer: 'Hard inquiries generally remain on your credit report for about two years, though their effect on your score typically fades well before that, often within several months.' },
        { question: 'Does rate shopping for a mortgage or auto loan hurt my score multiple times?', answer: 'Many scoring models are designed to group multiple hard inquiries for the same type of loan made within a focused shopping window into a single inquiry for scoring purposes, recognizing that comparison shopping is normal behavior.' },
        { question: 'Do all lenders report hard inquiries the same way?', answer: 'Most lenders that check your full credit report as part of a credit application will generate a hard inquiry, though practices can vary slightly by lender and product type.' },
        { question: 'Does checking my own credit score count as a hard inquiry?', answer: 'No. Checking your own credit score or report, whether through a bank app, credit card issuer, or AnnualCreditReport.com, is always a soft inquiry and never affects your score.' },
        { question: 'How many hard inquiries is too many?', answer: 'There is no fixed universal number, but scoring models generally view a high volume of recent hard inquiries, especially across unrelated credit types in a short period, as a signal of increased risk.' },
      ],
      markdown: `Every time your credit is checked, it falls into one of two categories: a **hard inquiry** or a **soft inquiry**. Understanding the difference removes a lot of unnecessary anxiety about "checking your credit too much," while helping you be strategic about actual credit applications.

## What Is a Hard Inquiry?

A hard inquiry (sometimes called a "hard pull") occurs when a lender checks your full credit report because you have applied for new credit — a credit card, auto loan, mortgage, or personal loan, for example. Because a hard inquiry is tied to an application, it is treated by scoring models as a small signal of potential new risk, and it can cause a modest, temporary dip in your score.

## What Is a Soft Inquiry?

A soft inquiry (or "soft pull") occurs when your credit is checked without you applying for new credit. Common examples include:

- Checking your own credit score or report.
- A company checking your credit to send you a pre-qualified or pre-approved offer.
- An existing lender periodically reviewing your account.
- Employers conducting background checks that include a modified credit review, generally with your consent.

Soft inquiries never affect your credit score, regardless of how many occur. This distinction directly answers a common concern covered further in our guide to [does checking your own credit hurt it](does-checking-your-own-credit-hurt-it).

## Side-by-Side Comparison

| Aspect | Hard Inquiry | Soft Inquiry |
| --- | --- | --- |
| Triggered by | Applying for new credit | Self-checks, pre-qualified offers, account reviews |
| Affects credit score | Yes, typically a small, temporary effect | No, never affects your score |
| Visible to other lenders | Usually yes | Usually no, only visible to you |
| Requires your authorization | Yes, generally as part of an application | Not always, depending on the type |
| How long it appears on your report | Around two years | Varies, but does not impact scoring |

## Why Hard Inquiries Matter — But Not as Much as People Think

A single hard inquiry typically causes only a small, short-lived dip in your score, and its effect diminishes well before it eventually falls off your report. The bigger concern is a pattern of several hard inquiries across unrelated types of credit within a short period, which can appear as a spike in new-credit-seeking behavior — one of [the five factors behind your score](credit-score-factors-explained).

## Rate Shopping Is Treated Differently

If you are shopping for a mortgage, auto loan, or similar financing and compare offers from multiple lenders within a focused window, many scoring models are designed to treat those related inquiries as a single event for scoring purposes, rather than penalizing you for each individual check. This recognizes that comparison shopping for a major loan is normal, responsible financial behavior rather than a sign of risk.

> [!INFO] Comparison shopping for the same type of loan within a short, focused window is generally treated far more leniently by scoring models than applying for several unrelated types of credit spread out over time.

## Common Mistakes

- Avoiding checking your own credit out of a mistaken belief that it will hurt your score — it will not.
- Applying for several unrelated credit products in a short window without understanding the cumulative effect.
- Not distinguishing between rate-shopping inquiries for one loan type and scattered applications across different products.
- Assuming a single hard inquiry will meaningfully or permanently damage a score — its effect is typically small and temporary.

## Conclusion

The line between a hard inquiry and a soft inquiry comes down to one question: did you apply for new credit, or was the check made for another purpose? Only hard inquiries, tied to actual credit applications, have any effect on your score — and even then, the impact is usually modest and short-lived. Understanding this distinction lets you check your own credit freely while being intentional about when and how often you formally apply for new credit. For the full picture of what shapes your score, revisit the [complete guide to credit scores](credit-scores-complete-guide).`,
    },
  ],
};
