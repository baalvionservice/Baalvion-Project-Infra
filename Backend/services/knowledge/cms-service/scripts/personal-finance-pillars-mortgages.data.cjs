'use strict';
/*
 * Mortgages pillar + cluster — part of the "Personal Finance Pillars" content
 * program (Savings, Credit Cards, Loans, Mortgages, Auto Loans, Student Loans,
 * Indicators, Economy, Inflation, GDP, Unemployment, Interest Rates, Fiscal
 * Policy, Monetary Policy — this file ships Mortgages only; the other
 * categories follow the same shape as separate sibling data files).
 *
 * Consumed by seed-personal-finance-pillars.cjs, which converts `markdown` into
 * the live CMS block shape and attaches customFields (faq, author, images,
 * sources, cta, contentStrategy, etc).
 */

module.exports = {
  categorySlug: 'mortgages',
  categoryName: 'Mortgages',
  sources: [
    { name: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { name: 'U.S. Department of Housing and Urban Development', url: 'https://www.hud.gov' },
    { name: 'Fannie Mae — Homebuyer Education', url: 'https://www.fanniemae.com' },
    { name: 'Freddie Mac', url: 'https://www.freddiemac.com' },
  ],

  pillar: {
    slug: 'complete-guide-to-mortgages',
    title: 'The Complete Guide to Mortgages: Types, Rates, and the Home-Buying Process',
    metaTitle: 'The Complete Guide to Mortgages: Types, Rates & Process',
    metaDescription: 'A complete guide to mortgages — the main loan types, how interest rates are set, how approval and closing work, and what a mortgage actually costs.',
    excerpt: 'A mortgage is the largest, longest financial commitment most people ever sign. This guide explains the loan types, how rates work, the approval process, and the real costs involved.',
    focusKeyword: 'mortgages',
    secondaryKeywords: ['how mortgages work', 'types of mortgages', 'mortgage basics', 'home loan guide'],
    longTailKeywords: ['what is a mortgage and how does it work', 'how do I know what type of mortgage to get', 'what should I know before applying for a mortgage'],
    searchIntent: 'Informational — readers building foundational knowledge of mortgages before choosing a loan type or lender.',
    audience: ['Beginner', 'Intermediate'],
    subcategory: 'Mortgage Fundamentals',
    tags: ['mortgages', 'home loans', 'personal finance', 'homeownership'],
    heroImagePrompt: 'Ultra-realistic professional photograph of a couple reviewing paperwork with a laptop at a kitchen table in a bright, modestly furnished home, a small house-shaped keychain resting on the documents, warm natural light, shallow depth of field, personal-finance publication quality, no logos, no text overlays, 16:9 aspect ratio',
    socialImagePrompt: 'Realistic minimalist photograph of a single house key resting on a folded mortgage document beside a calculator on a wooden desk, warm editorial lighting, no readable text, no logos, 16:9',
    coverImageAlt: 'Homebuyers reviewing mortgage paperwork at their kitchen table',
    thumbnailAlt: 'House key resting on a mortgage document next to a calculator',
    imageFileName: 'complete-guide-to-mortgages-hero.jpg',
    keyTakeaways: [
      'A mortgage is a loan secured by real property, repaid over a set term through regular payments of principal and interest.',
      'The main mortgage types — fixed-rate, adjustable-rate, FHA, VA, and jumbo — differ in who qualifies, how rates behave, and how much they cost over time.',
      'Your interest rate is shaped by both broad market conditions and your personal risk profile, including credit score, down payment, and debt levels.',
      'Getting approved involves distinct stages — pre-qualification, pre-approval, underwriting, and closing — each with a different level of commitment.',
      'Beyond the loan amount itself, mortgages carry real closing costs, and sometimes mortgage insurance, that materially affect the true cost of borrowing.',
      'Refinancing can lower your rate or change your terms, but it only makes sense once the closing costs are weighed against how long you’ll keep the loan.',
    ],
    internalLinks: [
      { slug: 'mortgage-types', anchor: 'mortgage types explained' },
      { slug: 'mortgage-interest-rates', anchor: 'how mortgage interest rates work' },
      { slug: 'mortgage-approval-process', anchor: 'the mortgage approval process' },
      { slug: 'refinancing-a-mortgage', anchor: 'refinancing a mortgage' },
      { slug: 'mortgage-costs-and-fees', anchor: 'mortgage costs and fees' },
    ],
    faq: [
      { question: 'What is a mortgage, in simple terms?', answer: 'A mortgage is a loan used to buy real estate, where the property itself acts as collateral. If the borrower stops making payments, the lender has the legal right to foreclose and sell the property to recover what’s owed.' },
      { question: 'What is the difference between a mortgage rate and an APR?', answer: 'The mortgage rate is the interest charged on the loan balance, while the APR (annual percentage rate) folds in certain fees and costs, expressing the loan’s total yearly cost as a single percentage. The APR is almost always slightly higher than the note rate.' },
      { question: 'How much down payment do I need for a mortgage?', answer: 'It depends on the loan type — some conventional loans allow as little as 3% down, FHA loans commonly allow around 3.5%, and VA or USDA loans can allow 0% down for eligible borrowers. A larger down payment generally means a lower rate and no mortgage insurance.' },
      { question: 'What credit score do I need to get a mortgage?', answer: 'Minimum credit score requirements vary by loan type and lender, but conventional loans typically want a higher score than government-backed FHA loans. A higher score generally unlocks a lower interest rate, regardless of the minimum required to qualify.' },
      { question: 'What is the difference between pre-qualification and pre-approval?', answer: 'Pre-qualification is an informal estimate based on self-reported information, while pre-approval involves a credit check and document review, resulting in a conditional commitment letter that sellers take more seriously.' },
      { question: 'How long does it take to close on a mortgage?', answer: 'A typical closing timeline runs from roughly three to six weeks after an accepted offer, depending on how quickly the appraisal, underwriting, and title work are completed.' },
      { question: 'What is PMI and do I always have to pay it?', answer: 'PMI, or private mortgage insurance, is typically required on conventional loans when the down payment is below 20% of the home’s value. It protects the lender, not the borrower, and can usually be removed once enough equity has built up.' },
      { question: 'Is it better to get a 15-year or 30-year mortgage?', answer: 'A 15-year mortgage usually carries a lower rate and builds equity faster but requires a higher monthly payment, while a 30-year mortgage spreads the cost out for lower monthly payments but more total interest paid over the loan’s life.' },
      { question: 'Can I pay off my mortgage early?', answer: 'In most cases yes, and doing so reduces total interest paid, though it’s worth checking your loan documents for any prepayment penalty, which some loans still include in certain circumstances.' },
      { question: 'What happens if I miss a mortgage payment?', answer: 'Missing a payment typically triggers a late fee and can affect your credit score once reported, and repeated missed payments can eventually lead to default and foreclosure proceedings. Contacting your loan servicer early is usually the best way to explore options like forbearance.' },
    ],
    markdown: `For most households, a mortgage is the single largest financial commitment they will ever sign — and also one of the least understood. This guide lays out **how mortgages actually work**: the loan types available, how interest rates get set, what the approval process looks like from application to closing, what refinancing changes, and the real costs layered on top of the loan amount itself.

## What a Mortgage Actually Is

A mortgage is a loan secured by real property. In exchange for lending you the purchase price (minus your down payment), the lender places a lien on the home — giving it the legal right to foreclose and sell the property if payments stop. Each payment you make is split between principal (paying down what you owe) and interest (the cost of borrowing), a structure known as amortization.

## The Main Mortgage Types

Not every mortgage works the same way, and the right type depends on your finances, down payment, and how long you plan to stay in the home.

| Type | Rate behavior | Typical down payment | Best suited for |
| --- | --- | --- | --- |
| Fixed-rate | Locked for the full term | 3–20%+ | Buyers who want predictable payments long-term |
| Adjustable-rate (ARM) | Fixed initially, then floats with the market | 3–20%+ | Buyers planning to move or refinance before the adjustment period |
| FHA | Fixed or adjustable, government-insured | As low as ~3.5% | Buyers with limited savings or a shorter credit history |
| VA | Fixed or adjustable, government-guaranteed | Often 0% | Eligible veterans, service members, and some surviving spouses |
| Jumbo | Fixed or adjustable | Often 10–20%+ | Loan amounts above the conforming loan limit |

Our full breakdown of [mortgage types explained](mortgage-types) walks through the mechanics and trade-offs of each in more depth.

## How Interest Rates Are Set

Mortgage rates move with broader bond-market conditions, but the specific rate offered to you also reflects your personal risk profile — credit score, down payment size, loan type, and debt-to-income ratio all play a role. Lenders also let borrowers pay discount points upfront to buy the rate down. See [how mortgage interest rates work](mortgage-interest-rates) for the full picture, including how APR differs from the advertised rate.

> [!INFO] Even a difference of half a percentage point in your rate can change total interest paid over a 30-year loan by tens of thousands of dollars — shopping multiple lenders for the same loan type is one of the highest-value steps in the process.

## From Application to Closing

Getting a mortgage moves through distinct stages: an informal pre-qualification, a more rigorous pre-approval backed by a credit check, full underwriting where income, assets, and the property itself are verified, and finally closing, where documents are signed and funds are disbursed. Our guide to [the mortgage approval process](mortgage-approval-process) walks through each stage and what documentation to expect.

## What a Mortgage Really Costs

The interest rate is only part of the cost. Closing costs, mortgage insurance where applicable, property taxes, and homeowners insurance held in escrow all add to what you pay, both upfront and monthly. Our detailed guide to [mortgage costs and fees](mortgage-costs-and-fees) breaks down exactly where that money goes.

## When Refinancing Makes Sense

A mortgage isn’t necessarily a decision made once. Refinancing can lower your rate, shorten or extend your term, or let you tap accumulated equity — but it also resets closing costs, so it only pays off once you’ve run the math. See [refinancing a mortgage](refinancing-a-mortgage) for a full break-even framework.

## Common Mistakes

- Focusing only on the interest rate while ignoring fees baked into the APR.
- Getting pre-qualified but assuming it carries the same weight as pre-approval when making an offer.
- Not shopping multiple lenders for the same loan type and terms.
- Underestimating monthly costs by forgetting property taxes, insurance, and PMI.
- Refinancing without calculating the break-even point against the new closing costs.

## Conclusion

A mortgage is a long-term commitment, but it doesn’t have to be a confusing one. Understanding the loan types available, how your rate gets set, what the approval process actually verifies, and where the real costs sit gives you the footing to compare offers with confidence. From here, explore our guides on [mortgage types](mortgage-types), [interest rates](mortgage-interest-rates), [the approval process](mortgage-approval-process), [refinancing](refinancing-a-mortgage), and [costs and fees](mortgage-costs-and-fees) to go deeper on each piece.`,
    futureArticleIdeas: [
      'Conventional vs FHA loans: which one fits your situation',
      'How much house can you actually afford',
      'First-time homebuyer programs explained',
      'How to compare mortgage lenders side by side',
      'Fixed-rate vs adjustable-rate mortgages compared',
      'What is escrow and how does it work with a mortgage',
      'How your credit score affects your mortgage rate',
      'Mortgage points explained: when buying down your rate pays off',
      'How property taxes are calculated and billed through your mortgage',
      'What is a rate lock and how long does it last',
      'Jumbo loans explained: limits, rates, and requirements',
      'How mortgage pre-approval affects your home search',
    ],
  },

  articles: [
    {
      slug: 'mortgage-types',
      title: 'Mortgage Types Explained: Fixed, Adjustable, FHA, VA & More',
      metaTitle: 'Mortgage Types Explained: Fixed, ARM, FHA, VA & More',
      metaDescription: 'A clear breakdown of the main mortgage types — fixed-rate, adjustable-rate, FHA, VA, USDA, and jumbo — and who each one actually suits.',
      excerpt: 'Not all mortgages work the same way. Here is a clear breakdown of the main loan types and who each one is actually built for.',
      focusKeyword: 'mortgage types',
      secondaryKeywords: ['fixed-rate mortgage', 'adjustable-rate mortgage', 'FHA loan', 'VA loan'],
      longTailKeywords: ['what is the difference between fixed and adjustable rate mortgages', 'who qualifies for an FHA loan', 'is a VA loan better than a conventional loan'],
      searchIntent: 'Informational — readers comparing structural loan types before narrowing down which one fits their situation.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Mortgage Types',
      tags: ['mortgage types', 'FHA loans', 'VA loans', 'adjustable-rate mortgages'],
      heroImagePrompt: 'Realistic professional photograph of a person at a home office desk comparing several printed loan comparison sheets spread out beside a laptop, bright daylight, organized composition, no readable text, no logos, 16:9 aspect ratio',
      socialImagePrompt: 'Realistic photo of several small house-shaped paper cutouts labeled with blank tags arranged in a row on a wooden table, editorial finance photography, no readable text, no logos, 16:9',
      coverImageAlt: 'Person comparing different mortgage loan options at a desk',
      thumbnailAlt: 'Small house-shaped cutouts representing different mortgage types',
      imageFileName: 'mortgage-types.jpg',
      keyTakeaways: [
        'Fixed-rate mortgages lock in one interest rate for the entire loan term, giving predictable payments.',
        'Adjustable-rate mortgages (ARMs) start with a lower fixed rate for a set period, then adjust periodically based on a market index.',
        'FHA loans are government-insured and allow lower credit scores and smaller down payments, in exchange for mandatory mortgage insurance.',
        'VA loans, guaranteed by the Department of Veterans Affairs, often allow 0% down for eligible veterans and service members.',
        'Jumbo loans finance amounts above the conforming loan limit and typically carry stricter qualification requirements.',
        'The “best” mortgage type depends on your credit profile, down payment savings, and how long you plan to stay in the home.',
      ],
      internalLinks: [
        { slug: 'complete-guide-to-mortgages', anchor: 'complete guide to mortgages' },
        { slug: 'mortgage-interest-rates', anchor: 'how mortgage interest rates work' },
        { slug: 'mortgage-approval-process', anchor: 'the mortgage approval process' },
      ],
      faq: [
        { question: 'What is a fixed-rate mortgage?', answer: 'A fixed-rate mortgage locks in the same interest rate for the entire loan term, commonly 15 or 30 years, so your principal-and-interest payment never changes regardless of what happens to market rates.' },
        { question: 'What is an adjustable-rate mortgage (ARM)?', answer: 'An ARM offers a lower fixed rate for an initial period — often 5, 7, or 10 years — after which the rate adjusts periodically based on a market index plus a lender margin, meaning payments can rise or fall.' },
        { question: 'Who is an ARM a good fit for?', answer: 'ARMs tend to suit buyers who plan to sell or refinance before the initial fixed period ends, since they can benefit from a lower introductory rate without carrying the long-term risk of future adjustments.' },
        { question: 'What is an FHA loan?', answer: 'An FHA loan is insured by the Federal Housing Administration, allowing more flexible credit and down payment requirements than many conventional loans, in exchange for mandatory mortgage insurance premiums.' },
        { question: 'Who qualifies for a VA loan?', answer: 'VA loans are available to eligible active-duty service members, veterans, and certain surviving spouses, and are guaranteed by the Department of Veterans Affairs, often allowing 0% down and no private mortgage insurance.' },
        { question: 'What is a USDA loan?', answer: 'A USDA loan is a government-backed mortgage for eligible rural and some suburban properties, designed to support homeownership in designated areas, and can allow 0% down for qualifying borrowers.' },
        { question: 'What is a jumbo loan?', answer: 'A jumbo loan finances an amount above the conforming loan limit set for conventional loans, and typically requires a higher credit score, larger down payment, and more cash reserves due to the larger risk involved.' },
        { question: 'What is the difference between a conventional and a government-backed loan?', answer: 'Conventional loans are not insured or guaranteed by a government agency and follow guidelines set by Fannie Mae and Freddie Mac, while government-backed loans like FHA, VA, and USDA carry federal insurance or guarantees that let lenders offer more flexible terms.' },
        { question: 'Can I switch from an ARM to a fixed-rate mortgage later?', answer: 'You cannot convert the same loan directly, but you can refinance into a fixed-rate mortgage before the ARM’s adjustment period begins, assuming you qualify and the numbers make sense at that time.' },
        { question: 'Which mortgage type has the lowest overall cost?', answer: 'It depends on your credit profile, down payment, and how long you keep the loan — a fixed-rate loan often costs less over a long hold, while an ARM can cost less if you sell or refinance before the rate adjusts. There is no single type that is cheapest for everyone.' },
      ],
      markdown: `Choosing a mortgage isn’t just about finding the lowest rate — it’s about picking a loan structure that fits your finances and your plans for the home. Here is a clear breakdown of the **main mortgage types** and who each one actually suits.

## Fixed-Rate Mortgages

A fixed-rate mortgage locks in one interest rate for the life of the loan, typically 15 or 30 years. Your principal-and-interest payment stays exactly the same every month, regardless of what happens to broader interest rates afterward. This predictability makes fixed-rate loans the most common choice for buyers planning to stay in a home long-term.

## Adjustable-Rate Mortgages (ARMs)

An ARM offers a lower introductory rate, fixed for a set period — often shown as 5/1, 7/1, or 10/1 — after which the rate adjusts periodically based on a market index plus the lender’s margin. Adjustments are usually bounded by caps that limit how much the rate can move at each reset and over the life of the loan.

- **Initial period** — the rate is fixed, often lower than a comparable 30-year fixed rate.
- **Adjustment period** — the rate resets periodically (commonly annually) based on the index plus margin.
- **Caps** — limit how much the rate can rise at each adjustment and in total, protecting against extreme swings.

> [!WARNING] An ARM’s lower introductory rate is temporary. If you don’t plan to sell or refinance before the fixed period ends, model what your payment would look like at the maximum allowed rate, not just the starting one.

## Government-Backed Loan Types

| Loan type | Backed by | Typical down payment | Notable feature |
| --- | --- | --- | --- |
| FHA | Federal Housing Administration | As low as ~3.5% | More flexible credit requirements; requires mortgage insurance |
| VA | Department of Veterans Affairs | Often 0% | For eligible veterans/service members; no PMI required |
| USDA | U.S. Department of Agriculture | Often 0% | For eligible rural and some suburban properties |

FHA loans are insured, not issued, by the government, which lets private lenders offer more flexible terms than a typical conventional loan. VA loans are guaranteed rather than insured, and available specifically to eligible military-connected borrowers. USDA loans support homeownership in designated rural and suburban areas.

## Conventional Loans

Conventional loans are not insured or guaranteed by a government agency. Conforming conventional loans follow underwriting guidelines set by Fannie Mae and Freddie Mac and are capped at a maximum loan amount. Conventional loans with less than 20% down typically require private mortgage insurance (PMI), which is separate from FHA’s mortgage insurance and generally easier to remove once enough equity builds.

## Jumbo Loans

A jumbo loan finances an amount above the conforming loan limit. Because these loans aren’t backed by Fannie Mae or Freddie Mac, lenders typically apply stricter requirements — higher credit scores, larger down payments, and larger cash reserves — to offset the additional risk of a larger, non-conforming balance.

## How to Choose Between Them

- **How long you plan to stay** in the home strongly favors fixed-rate loans for long holds and ARMs for shorter ones.
- **Your down payment savings** may point toward FHA, VA, or USDA if a large down payment isn’t realistic yet.
- **Your credit profile** affects which loan types you’ll qualify for and at what rate.
- **Military eligibility** makes VA loans worth checking first, given the strong terms available.

For how these differences translate into an actual rate offer, see [how mortgage interest rates work](mortgage-interest-rates).

## Common Mistakes

- Choosing an ARM for the lower initial rate without planning for what happens after the adjustment period.
- Assuming FHA is always cheaper than conventional, without factoring in FHA’s ongoing mortgage insurance costs.
- Not checking VA eligibility before assuming a larger down payment is required.
- Overlooking jumbo loan requirements until late in the process, causing delays.

## Conclusion

The “best” mortgage type isn’t universal — it depends on your credit, savings, and how long you expect to keep the loan. Once you’ve narrowed down a type that fits your situation, the next step is understanding [how mortgage interest rates work](mortgage-interest-rates) and [the mortgage approval process](mortgage-approval-process) that follows.`,
      futureArticleIdeas: [
        'FHA vs conventional loans: a full side-by-side comparison',
        'How VA loan eligibility actually works',
        '5/1 ARM vs 30-year fixed: which one wins over time',
        'USDA loans explained: eligible areas and requirements',
        'How conforming loan limits are set and updated',
        'Jumbo loan requirements: credit score, reserves, and down payment',
        'Can you have two mortgages of different types on one property',
        'How to switch from an ARM to a fixed-rate loan',
        'Interest-only mortgages explained: how they work and the risks',
        'Piggyback loans and how they help avoid PMI',
      ],
    },
    {
      slug: 'mortgage-interest-rates',
      title: 'How Mortgage Interest Rates Work',
      metaTitle: 'How Mortgage Interest Rates Work: Rate vs APR Explained',
      metaDescription: 'Learn what actually determines your mortgage interest rate, how discount points work, and why APR is not the same as your quoted rate.',
      excerpt: 'Your mortgage rate isn’t just set by the market — your credit, down payment, and loan type all shape the number you’re offered. Here is how it actually works.',
      focusKeyword: 'mortgage interest rates',
      secondaryKeywords: ['how mortgage rates are determined', 'mortgage points', 'APR vs interest rate', 'rate lock'],
      longTailKeywords: ['why did my mortgage rate offer differ from advertised rates', 'is it worth buying mortgage discount points', 'what is the difference between mortgage rate and APR'],
      searchIntent: 'Informational — readers trying to understand what drives the specific rate they are quoted.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Mortgage Rates',
      tags: ['mortgage rates', 'APR', 'discount points', 'rate lock'],
      heroImagePrompt: 'Realistic photograph of a person reviewing a printed loan estimate with a highlighted interest rate section, sitting at a home office desk with a calculator nearby, soft natural daylight, no readable text, no logos, 16:9 aspect ratio',
      socialImagePrompt: 'Realistic close-up photo of a calculator and a pen resting on a printed rate comparison sheet, editorial finance photography, no readable text, no logos, 16:9',
      coverImageAlt: 'Person reviewing a mortgage loan estimate and interest rate details',
      thumbnailAlt: 'Calculator and pen resting on a mortgage rate comparison document',
      imageFileName: 'mortgage-interest-rates.jpg',
      keyTakeaways: [
        'Mortgage rates broadly track bond-market conditions, but the exact rate you’re offered also reflects your personal risk profile.',
        'Credit score, down payment size, loan type, and debt-to-income ratio all influence your individual rate.',
        'Discount points let you pay upfront cash to lower your rate — worthwhile only if you’ll keep the loan long enough to recoup the cost.',
        'APR includes certain fees on top of the note rate, making it a more complete (though imperfect) measure for comparing loan offers.',
        'A rate lock guarantees your rate for a set window while your loan closes, protecting you from market moves during that period.',
      ],
      internalLinks: [
        { slug: 'complete-guide-to-mortgages', anchor: 'complete guide to mortgages' },
        { slug: 'mortgage-types', anchor: 'mortgage types explained' },
        { slug: 'mortgage-costs-and-fees', anchor: 'mortgage costs and fees' },
      ],
      faq: [
        { question: 'What determines my mortgage interest rate?', answer: 'Your rate reflects a combination of broad market conditions and your personal risk factors — credit score, down payment size, loan type, loan term, and debt-to-income ratio all factor into the specific number a lender offers you.' },
        { question: 'Why do mortgage rates change day to day?', answer: 'Mortgage rates broadly track movements in the bond market, particularly longer-term Treasury yields, along with investor demand for mortgage-backed securities, so rates can shift even without any change in your personal situation.' },
        { question: 'What are mortgage discount points?', answer: 'Discount points are an upfront fee paid at closing, usually priced as a percentage of the loan amount, in exchange for a lower interest rate over the life of the loan. Each point typically lowers the rate by a small, lender-specific amount.' },
        { question: 'Are mortgage points worth paying?', answer: 'It depends on how long you plan to keep the loan. Points make sense if you’ll stay in the home (or keep the loan) long enough for the monthly savings to exceed the upfront cost — otherwise, the break-even point is never reached.' },
        { question: 'What is the difference between my mortgage rate and the APR?', answer: 'The interest rate applies only to the loan balance, while the APR incorporates certain fees and costs into a single annual percentage, giving a fuller (though still imperfect) picture of the loan’s total cost.' },
        { question: 'Why is my APR higher than my quoted interest rate?', answer: 'APR spreads certain closing costs and fees across the loan term and expresses them as part of an annualized rate, which is why it’s almost always a bit higher than the plain interest rate quoted on your loan.' },
        { question: 'What is a rate lock?', answer: 'A rate lock is a lender’s commitment to hold your quoted interest rate for a set window of time — commonly 30 to 60 days — while your loan moves through underwriting and closing, protecting you from rate increases during that period.' },
        { question: 'Does my credit score really affect my mortgage rate that much?', answer: 'Yes. Lenders use credit-based pricing tiers, and even a modest difference in credit score can shift you into a different pricing bracket, changing your offered rate meaningfully over a 15- or 30-year term.' },
        { question: 'Does a bigger down payment lower my interest rate?', answer: 'Often yes, since a larger down payment lowers the loan-to-value ratio and reduces the lender’s risk, which can qualify you for better rate pricing tiers in addition to avoiding mortgage insurance.' },
        { question: 'Should I shop multiple lenders for a mortgage rate?', answer: 'Yes. Rates and fees can vary meaningfully between lenders for the exact same borrower profile, so comparing several loan estimates for the same loan type and term is one of the most effective ways to lower your total cost.' },
      ],
      markdown: `Two borrowers with identical loan amounts can be offered very different mortgage rates — and it isn’t random. Here is **how mortgage interest rates actually work**, from the market forces behind them to the personal factors that shape your specific offer.

## What Moves Mortgage Rates Broadly

Mortgage rates track the bond market more closely than most people expect, particularly the yields on longer-term Treasury securities, along with investor demand for mortgage-backed securities. When those yields rise, mortgage rates tend to follow; when they fall, mortgage rates typically ease as well. This is why rates can shift meaningfully within the same week, independent of anything happening in your personal finances.

## What Determines Your Personal Rate

On top of broad market conditions, lenders price your specific rate based on risk factors unique to you:

| Factor | How it affects your rate |
| --- | --- |
| Credit score | Higher scores generally unlock better rate tiers |
| Down payment / loan-to-value | Larger down payments typically lower risk-based pricing |
| Loan type | FHA, VA, conventional, and jumbo loans price differently |
| Loan term | Shorter terms (like 15-year) often carry lower rates than 30-year |
| Debt-to-income ratio | Lower DTI can support more favorable pricing |

## Discount Points: Buying Down Your Rate

A **discount point** is an upfront fee, usually priced as a percentage of the loan amount, paid at closing in exchange for a lower interest rate over the life of the loan. Whether points are worth it comes down to simple math:

- Calculate the upfront cost of the points.
- Calculate the monthly savings the lower rate produces.
- Divide the cost by the monthly savings to find your break-even point in months.
- Compare that break-even point to how long you actually expect to keep the loan.

> [!INFO] If you expect to sell or refinance before reaching the break-even point, paying points usually isn’t worth it — the upfront cost never gets fully recovered.

## Interest Rate vs APR

The quoted **interest rate** applies only to your loan balance. The **APR (annual percentage rate)** folds in certain additional costs — such as some fees and mortgage insurance in certain calculations — spreading them across the loan term and expressing the result as a single annualized percentage. Because of this, APR is almost always slightly higher than the plain interest rate, and comparing APRs across lenders (for the same loan type and term) gives a more complete cost comparison than the rate alone.

## Rate Locks

Once you’ve chosen a lender and loan terms, you can typically lock your rate for a set window — commonly 30 to 60 days — while the loan moves through underwriting and closing. This protects you from rate increases during that window, though some locks include a fee, and a lock can also mean missing out if rates happen to fall before closing (unless a float-down option is included).

## Why Shopping Multiple Lenders Matters

Because a meaningful share of your rate is set by lender-specific pricing and margins — not just the market — the same borrower can receive noticeably different offers from different lenders on the exact same day. Comparing multiple loan estimates for identical loan types and terms is one of the highest-value steps in the entire mortgage process. For how those rate differences translate into real dollars over the life of the loan, see our guide to [mortgage costs and fees](mortgage-costs-and-fees).

## Common Mistakes

- Comparing only the advertised interest rate and ignoring APR or fees.
- Paying for discount points without calculating the actual break-even period.
- Assuming all lenders will quote you the same rate for the same loan.
- Locking a rate too early or too late relative to your actual closing timeline.

## Conclusion

Your mortgage rate is shaped by forces you can’t control, like bond markets, and factors you can, like credit score and down payment. Understanding both halves — and comparing offers using APR rather than the headline rate alone — puts you in a much stronger position when you move into [the mortgage approval process](mortgage-approval-process).`,
      futureArticleIdeas: [
        'Why do mortgage rates change every day',
        'How credit score tiers affect mortgage pricing',
        'Are discount points worth it? A break-even calculator walkthrough',
        'APR vs interest rate: which number actually matters more',
        'What is a rate lock float-down option',
        '15-year vs 30-year mortgage rates: why the gap exists',
        'How debt-to-income ratio affects your mortgage rate offer',
        'How to read a loan estimate line by line',
        'Why identical borrowers get different rates from different lenders',
        'How Federal Reserve policy relates to mortgage rates',
      ],
    },
    {
      slug: 'mortgage-approval-process',
      title: 'The Mortgage Approval Process, Step by Step',
      metaTitle: 'The Mortgage Approval Process: Step-by-Step Guide',
      metaDescription: 'A step-by-step walkthrough of the mortgage approval process — from pre-qualification and pre-approval through underwriting and closing.',
      excerpt: 'Getting a mortgage moves through distinct stages, each with different requirements. Here is exactly what happens, step by step.',
      focusKeyword: 'mortgage approval process',
      secondaryKeywords: ['pre-qualification vs pre-approval', 'mortgage underwriting', 'mortgage closing process', 'how to get approved for a mortgage'],
      longTailKeywords: ['what documents do I need for mortgage pre-approval', 'how long does mortgage underwriting take', 'what happens at mortgage closing'],
      searchIntent: 'How-to — readers preparing to apply for a mortgage and wanting a clear, sequential walkthrough of each stage.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Mortgage Process',
      tags: ['mortgage approval', 'underwriting', 'closing process', 'pre-approval'],
      heroImagePrompt: 'Realistic photograph of a person handing over a folder of financial documents to a loan officer across a desk in a bright, modest office setting, professional but approachable atmosphere, no readable text, no logos, 16:9 aspect ratio',
      socialImagePrompt: 'Realistic photo of a checklist clipboard with blank checkboxes resting beside a pen and a small house figurine on a desk, editorial style, no readable text, no logos, 16:9',
      coverImageAlt: 'Homebuyer submitting documents during the mortgage approval process',
      thumbnailAlt: 'Checklist clipboard beside a small house figurine representing mortgage approval steps',
      imageFileName: 'mortgage-approval-process.jpg',
      keyTakeaways: [
        'Pre-qualification is an informal, unverified estimate, while pre-approval involves a credit check and produces a conditional commitment letter.',
        'Underwriting is where a lender formally verifies your income, assets, debts, and the property itself before final approval.',
        'An appraisal confirms the home’s value supports the loan amount, and is a required step for most mortgage types.',
        'Closing disclosure documents must be reviewed before signing, and typically arrive a set number of days before your closing date.',
        'The full process, from accepted offer to closing, commonly takes several weeks and depends heavily on how quickly documents are provided.',
      ],
      internalLinks: [
        { slug: 'complete-guide-to-mortgages', anchor: 'complete guide to mortgages' },
        { slug: 'mortgage-interest-rates', anchor: 'how mortgage interest rates work' },
        { slug: 'mortgage-costs-and-fees', anchor: 'mortgage costs and fees' },
      ],
      faq: [
        { question: 'What is the difference between pre-qualification and pre-approval?', answer: 'Pre-qualification is a rough, informal estimate based on information you self-report, with no credit check involved. Pre-approval is a more rigorous step where the lender checks your credit and reviews documentation, producing a conditional commitment letter that sellers take more seriously.' },
        { question: 'What documents do I need for mortgage pre-approval?', answer: 'Lenders commonly ask for recent pay stubs, W-2s or tax returns, bank statements, and identification. Self-employed borrowers or those with variable income may need to provide additional documentation, such as profit-and-loss statements.' },
        { question: 'What happens during mortgage underwriting?', answer: 'Underwriting is the formal review stage where the lender verifies your income, assets, employment, credit history, and the property’s appraised value, checking that everything matches the loan program’s requirements before issuing final approval.' },
        { question: 'How long does mortgage underwriting take?', answer: 'Underwriting timelines vary, but a common range is a few days to a couple of weeks, depending on the lender’s workload and how quickly you provide any additional documents they request.' },
        { question: 'What is a home appraisal and why is it required?', answer: 'An appraisal is an independent estimate of the home’s market value, ordered by the lender to confirm the property is worth at least the loan amount, protecting the lender from lending more than the collateral is worth.' },
        { question: 'What is a closing disclosure?', answer: 'A closing disclosure is a document that details the final terms and costs of your loan, including the interest rate, monthly payment, and closing costs, and by law must be provided a set number of days before your scheduled closing.' },
        { question: 'What happens on closing day?', answer: 'On closing day, you review and sign the final loan documents, pay any remaining closing costs and down payment, and the lender disburses funds to complete the purchase, after which ownership of the property transfers to you.' },
        { question: 'Can my mortgage still fall through after pre-approval?', answer: 'Yes. Pre-approval is conditional, not final — a change in your financial situation, a low appraisal, or issues discovered during underwriting or the title search can still affect or delay final approval.' },
        { question: 'Should I avoid large purchases or new credit while my mortgage is in process?', answer: 'Yes, this is strongly recommended. New debt, large withdrawals, or new credit inquiries can change your debt-to-income ratio or credit score and jeopardize your approval between pre-approval and closing.' },
        { question: 'How long does the entire mortgage process take from offer to closing?', answer: 'A typical timeline runs roughly three to six weeks after an accepted offer, though it can extend longer depending on appraisal scheduling, underwriting workload, and how quickly required documents are submitted.' },
      ],
      markdown: `Getting from “I want to buy a home” to holding the keys involves several distinct stages, each with a different level of commitment from the lender. Here is **the mortgage approval process**, broken down step by step.

## Step 1: Pre-Qualification

Pre-qualification is the fastest, least formal step. You share basic financial information — income, debts, estimated credit range — and the lender gives you a rough estimate of what you might be able to borrow. No credit check is typically involved, and the estimate carries no real weight with sellers.

## Step 2: Pre-Approval

Pre-approval is a meaningfully more rigorous step. The lender pulls your credit and reviews documentation such as:

- Recent pay stubs and W-2s (or tax returns for self-employed borrowers)
- Bank and asset statements
- Identification and Social Security verification
- Information on existing debts

Based on this, the lender issues a conditional pre-approval letter stating an estimated loan amount, which sellers take far more seriously than a pre-qualification when you make an offer.

> [!INFO] Pre-approval is conditional, not guaranteed. Final approval still depends on underwriting, the appraisal, and your finances staying stable through closing.

## Step 3: Loan Application and Property Under Contract

Once your offer on a specific home is accepted, you formally apply for the loan tied to that property, and the lender orders an appraisal to confirm the home’s value supports the loan amount.

## Step 4: Underwriting

Underwriting is where the lender formally verifies everything: income, employment, assets, debts, credit history, and the appraisal, checking that the full picture meets the loan program’s guidelines. This is typically the longest and most document-intensive stage.

| Stage | What’s verified | Typical output |
| --- | --- | --- |
| Pre-qualification | Self-reported estimates | Rough, non-binding estimate |
| Pre-approval | Credit check, basic documents | Conditional pre-approval letter |
| Underwriting | Full verification of income, assets, appraisal | Clear-to-close decision |
| Closing | Final signatures and fund disbursement | Completed purchase |

Underwriters may come back with "conditions" — additional documents or clarifications needed before issuing a **clear-to-close**.

## Step 5: Closing Disclosure Review

Once underwriting is complete, you receive a closing disclosure detailing the final loan terms, monthly payment, and closing costs. Regulations require this document be provided a set number of days before your scheduled closing, giving you time to review it against your original loan estimate.

## Step 6: Closing Day

At closing, you sign the final loan documents, pay any remaining closing costs and down payment, and the lender disburses the funds. Ownership transfers, keys are handed over, and your first mortgage payment schedule begins from there. Our guide to [mortgage costs and fees](mortgage-costs-and-fees) details exactly what you're paying for at this stage.

## What Can Delay or Derail an Approval

Even a strong pre-approval doesn’t guarantee a smooth path to closing. A handful of issues tend to cause the most delays:

- **A low appraisal**, where the home’s assessed value comes in below the purchase price, sometimes requiring renegotiation or additional down payment.
- **New debt or credit inquiries** taken on after pre-approval, which can shift your debt-to-income ratio enough to affect final approval.
- **Unexplained large deposits** in bank statements, which underwriters typically ask you to document the source of.
- **Title issues**, such as unresolved liens or ownership disputes uncovered during the title search.
- **Employment changes**, including a job switch or a gap in income, occurring between pre-approval and closing.

Staying financially steady, and responsive to document requests, is usually the single biggest factor in keeping a closing on schedule.

## Common Mistakes

- Treating a pre-qualification like a firm pre-approval when making an offer.
- Making large purchases or opening new credit accounts during underwriting, which can jeopardize approval.
- Not responding quickly to underwriter requests for additional documentation, delaying closing.
- Skipping a careful review of the closing disclosure against the original loan estimate.

## Conclusion

The mortgage approval process feels complex mainly because it involves several handoffs — but each stage exists to verify something specific before real money changes hands. Knowing what pre-qualification, pre-approval, underwriting, and closing each actually confirm makes the process far less opaque, and helps you respond quickly when a lender asks for something.`,
      futureArticleIdeas: [
        'What documents to gather before applying for pre-approval',
        'How underwriters evaluate self-employed income',
        'What to do if your mortgage is denied during underwriting',
        'How appraisals work and what happens if the value comes in low',
        'What is a mortgage contingency in a purchase offer',
        'How to read your closing disclosure line by line',
        'What not to do financially while your mortgage is in process',
        'How title insurance and title search fit into closing',
        'What is a clear-to-close and how long after it can you close',
        'First-time homebuyer walkthrough: offer to closing day',
      ],
    },
    {
      slug: 'refinancing-a-mortgage',
      title: 'Refinancing a Mortgage: When It Makes Sense',
      metaTitle: 'Refinancing a Mortgage: When It Actually Makes Sense',
      metaDescription: 'Learn when refinancing a mortgage makes financial sense, how to calculate your break-even point, and the difference between rate-and-term and cash-out refinancing.',
      excerpt: 'Refinancing can lower your rate or free up equity, but the closing costs mean it doesn’t always pay off. Here is how to know when it makes sense.',
      focusKeyword: 'refinancing a mortgage',
      secondaryKeywords: ['mortgage refinance', 'rate-and-term refinance', 'cash-out refinance', 'refinance break-even point'],
      longTailKeywords: ['when does it make sense to refinance a mortgage', 'how to calculate mortgage refinance break-even point', 'is a cash-out refinance a good idea'],
      searchIntent: 'Decision framework — readers weighing whether refinancing their existing mortgage is financially worthwhile.',
      audience: ['Intermediate', 'Professional'],
      subcategory: 'Refinancing',
      tags: ['refinancing', 'break-even analysis', 'cash-out refinance', 'rate-and-term refinance'],
      heroImagePrompt: 'Realistic photograph of a homeowner reviewing two side-by-side loan comparison printouts at a dining table, calculator and pen nearby, warm afternoon light, thoughtful expression, no readable text, no logos, 16:9 aspect ratio',
      socialImagePrompt: 'Realistic photo of two overlapping documents with a magnifying glass resting on top on a wooden desk, editorial finance photography, no readable text, no logos, 16:9',
      coverImageAlt: 'Homeowner comparing their current mortgage against a refinance offer',
      thumbnailAlt: 'Magnifying glass resting on overlapping mortgage documents',
      imageFileName: 'refinancing-a-mortgage.jpg',
      keyTakeaways: [
        'Refinancing replaces your existing mortgage with a new one, typically to secure a lower rate, change the term, or access home equity.',
        'A rate-and-term refinance changes your rate and/or term without increasing your loan balance beyond closing costs.',
        'A cash-out refinance borrows more than you currently owe, giving you the difference in cash, secured against your home equity.',
        'The break-even point — closing costs divided by monthly savings — tells you how long you need to stay in the loan for a refinance to pay off.',
        'Refinancing resets your amortization schedule, so refinancing late into an existing loan term can extend how long you pay predominantly interest.',
      ],
      internalLinks: [
        { slug: 'complete-guide-to-mortgages', anchor: 'complete guide to mortgages' },
        { slug: 'mortgage-interest-rates', anchor: 'how mortgage interest rates work' },
        { slug: 'mortgage-costs-and-fees', anchor: 'mortgage costs and fees' },
      ],
      faq: [
        { question: 'What does it mean to refinance a mortgage?', answer: 'Refinancing means replacing your current mortgage with a new loan, usually to get a lower interest rate, change your loan term, or convert home equity into cash, and it involves a new closing process similar to your original mortgage.' },
        { question: 'What is a rate-and-term refinance?', answer: 'A rate-and-term refinance replaces your existing loan with a new one at a different interest rate, a different term, or both, without significantly increasing the loan balance beyond the cost of refinancing itself.' },
        { question: 'What is a cash-out refinance?', answer: 'A cash-out refinance replaces your mortgage with a larger loan than you currently owe, and you receive the difference in cash, secured against the equity you’ve built in the home.' },
        { question: 'How do I calculate my refinance break-even point?', answer: 'Divide the total closing costs of the refinance by the monthly payment savings the new loan produces. The result is the number of months you’d need to keep the new loan before the refinance actually saves you money.' },
        { question: 'Is it worth refinancing to save a small amount on my interest rate?', answer: 'It depends on the closing costs and how long you plan to keep the loan. Even a modest rate reduction can be worthwhile on a large balance held for many years, but the break-even calculation should always be run before deciding.' },
        { question: 'Does refinancing reset my loan term?', answer: 'Yes, unless you specifically choose a shorter term. Refinancing into a new 30-year loan late into an existing mortgage can extend the total time spent paying predominantly interest, even if the new rate is lower.' },
        { question: 'What credit score do I need to refinance?', answer: 'Requirements vary by lender and loan type, similar to a purchase mortgage, but generally a stronger credit score than at your original closing can help you qualify for the best available refinance rates.' },
        { question: 'Are closing costs for a refinance similar to a purchase mortgage?', answer: 'Yes, refinancing typically involves many of the same categories of closing costs as a purchase — origination fees, appraisal, title work — usually totaling a percentage of the new loan amount.' },
        { question: 'When does a cash-out refinance make more sense than a home equity loan?', answer: 'A cash-out refinance can make sense when it also improves your primary mortgage rate or term, since it replaces the whole loan; a separate home equity loan or line of credit may make more sense if your current mortgage rate is already favorable and you don’t want to disturb it.' },
        { question: 'Can I refinance more than once?', answer: 'Yes, there’s generally no limit on how many times you can refinance, as long as you qualify each time and it makes financial sense — though each refinance brings its own closing costs to weigh against the benefit.' },
      ],
      markdown: `Refinancing sounds simple — get a new mortgage, pay off the old one — but whether it’s actually a good move depends entirely on the math. Here is a clear framework for deciding **when refinancing a mortgage makes sense**.

## What Refinancing Actually Does

Refinancing replaces your existing mortgage with a brand-new loan, which pays off the original balance. The new loan can carry a different interest rate, a different term, or a larger balance than what you currently owe. It is, functionally, a second version of the mortgage approval process — including a new appraisal, underwriting, and closing costs.

## Rate-and-Term Refinance

A rate-and-term refinance changes your interest rate, your loan term, or both, without meaningfully increasing your balance beyond what’s needed to cover closing costs. Common reasons to pursue one include:

- Securing a lower interest rate than your original loan.
- Switching from an adjustable-rate mortgage to a fixed rate before an adjustment period begins.
- Shortening the term (for example, 30 years down to 15) to pay off the loan faster and reduce total interest.
- Lengthening the term to lower the monthly payment, at the cost of more interest over time.

## Cash-Out Refinance

A cash-out refinance replaces your mortgage with a larger loan than you currently owe, and you receive the difference in cash. This effectively converts home equity into usable funds, commonly used for renovations, debt consolidation, or other large expenses — but it also increases your loan balance and resets amortization on that larger amount.

> [!WARNING] A cash-out refinance uses your home as collateral for the new, larger balance. Missing payments carries the same foreclosure risk as any other mortgage, so it’s worth being deliberate about what the cash is used for.

## Calculating Your Break-Even Point

The core question for any refinance is simple: will the savings outweigh the cost before you sell or refinance again?

1. Add up the total closing costs of the refinance.
2. Calculate the difference between your old and new monthly payment.
3. Divide the closing costs by the monthly savings to get your break-even point, in months.
4. Compare that number to how long you realistically expect to keep the loan.

| Scenario | Closing costs | Monthly savings | Break-even point |
| --- | --- | --- | --- |
| Small rate improvement, low costs | Lower | Modest | Shorter |
| Large rate improvement, standard costs | Standard | Larger | Moderate |
| Refinance late in loan term | Standard | Variable | Depends heavily on remaining years |

If you plan to stay well beyond the break-even point, the refinance is likely worthwhile. If you might sell or refinance again sooner, it may not be.

## The Amortization Reset Trap

Refinancing restarts your loan’s amortization schedule. Early in any mortgage, a larger share of each payment goes toward interest rather than principal. Refinancing into a new 30-year loan after already paying down several years of an original 30-year mortgage can extend the total number of years spent paying predominantly interest — worth watching closely, even when the new rate is lower.

## Common Mistakes

- Refinancing purely because rates dropped slightly, without running the break-even math.
- Ignoring how a reset amortization schedule affects total interest paid over time.
- Treating a cash-out refinance like "free money" rather than new debt secured by the home.
- Not comparing refinance offers across multiple lenders, the same way you would for a purchase mortgage.

## Conclusion

Refinancing can genuinely lower your costs or unlock equity, but it is a new financial decision with its own closing costs — not an automatic win whenever rates move. Running the break-even calculation, and being honest about how long you’ll keep the loan, is what separates a refinance that pays off from one that doesn’t. For a full breakdown of what those closing costs actually include, see our guide to [mortgage costs and fees](mortgage-costs-and-fees).`,
      futureArticleIdeas: [
        'How to calculate your exact refinance break-even point',
        'Cash-out refinance vs home equity loan: which is better',
        'How many times can you refinance a mortgage',
        'Refinancing from an ARM to a fixed-rate loan before adjustment',
        'Does refinancing hurt your credit score',
        'Refinancing to remove PMI once you have enough equity',
        'How closing costs differ between purchase and refinance loans',
        'Streamline refinance programs explained (FHA, VA)',
        'When a shorter loan term refinance saves the most money',
        'How rising home values change your refinance options',
      ],
    },
    {
      slug: 'mortgage-costs-and-fees',
      title: 'Mortgage Costs & Fees: What You’ll Actually Pay',
      metaTitle: 'Mortgage Costs & Fees: What You’ll Actually Pay',
      metaDescription: 'A breakdown of what mortgages really cost — closing costs, PMI, origination fees, escrow, and how to tell which fees are negotiable.',
      excerpt: 'The interest rate is only part of what a mortgage costs. Here is a clear breakdown of the closing costs, insurance, and fees you’ll actually pay.',
      focusKeyword: 'mortgage costs and fees',
      secondaryKeywords: ['closing costs', 'PMI', 'origination fee', 'escrow account'],
      longTailKeywords: ['what are typical mortgage closing costs', 'how does PMI get removed from a mortgage', 'what is held in a mortgage escrow account'],
      searchIntent: 'Informational — readers wanting a clear, itemized understanding of total mortgage costs beyond the interest rate.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Mortgage Costs',
      tags: ['closing costs', 'PMI', 'escrow', 'origination fees'],
      heroImagePrompt: 'Realistic photograph of a person reviewing an itemized closing cost worksheet with a calculator on a kitchen table, small stack of receipts nearby, soft daylight, no readable text, no logos, 16:9 aspect ratio',
      socialImagePrompt: 'Realistic photo of a small stack of coins next to a folded closing cost worksheet on a wooden desk, editorial finance photography, no readable text, no logos, 16:9',
      coverImageAlt: 'Homeowner reviewing an itemized breakdown of mortgage closing costs',
      thumbnailAlt: 'Stack of coins beside a folded mortgage cost worksheet',
      imageFileName: 'mortgage-costs-and-fees.jpg',
      keyTakeaways: [
        'Closing costs typically run a few percent of the loan amount and cover a range of separate fees, not one single charge.',
        'PMI is generally required on conventional loans with less than 20% down and can usually be removed once sufficient equity builds.',
        'FHA loans carry their own mortgage insurance premium (MIP), which works differently from conventional PMI and is not always removable.',
        'An escrow account collects a portion of property taxes and homeowners insurance each month, so the lender can pay those bills on your behalf.',
        'Some fees are lender-specific and negotiable or shoppable, while others (like government recording fees) are fixed regardless of lender.',
      ],
      internalLinks: [
        { slug: 'complete-guide-to-mortgages', anchor: 'complete guide to mortgages' },
        { slug: 'mortgage-approval-process', anchor: 'the mortgage approval process' },
        { slug: 'refinancing-a-mortgage', anchor: 'refinancing a mortgage' },
      ],
      faq: [
        { question: 'How much are typical mortgage closing costs?', answer: 'Closing costs commonly run a few percent of the loan amount, though the exact figure varies by lender, location, and loan type — your loan estimate and closing disclosure will itemize the specific charges for your loan.' },
        { question: 'What is included in closing costs?', answer: 'Closing costs typically include an origination fee, appraisal fee, title insurance and search fees, recording fees, and prepaid items like homeowners insurance and initial escrow deposits for taxes and insurance.' },
        { question: 'What is PMI and when is it required?', answer: 'Private mortgage insurance (PMI) is generally required on conventional loans when the down payment is less than 20% of the home’s value. It protects the lender if you default, not the borrower.' },
        { question: 'How do I get rid of PMI?', answer: 'PMI can typically be removed once your loan balance drops to a set percentage of the home’s original or current value, either through automatic termination provisions or by requesting a lender-ordered appraisal once you believe you’ve reached that threshold.' },
        { question: 'What is the difference between PMI and FHA’s MIP?', answer: 'PMI applies to conventional loans and can usually be removed once enough equity builds. FHA’s mortgage insurance premium (MIP) applies to FHA loans and, depending on the down payment and loan terms, may last for the life of the loan rather than being automatically removable.' },
        { question: 'What is an escrow account?', answer: 'An escrow account is a fund the lender manages on your behalf, collecting a portion of your property taxes and homeowners insurance with each monthly payment, then paying those bills when they come due so you don’t have to pay them in one lump sum.' },
        { question: 'Are origination fees negotiable?', answer: 'Some lender-specific fees, including certain origination charges, can sometimes be negotiated or offset through lender credits, while government fees like recording charges are fixed and the same regardless of lender.' },
        { question: 'What is title insurance and why do I need it?', answer: 'Title insurance protects against claims or disputes over legal ownership of the property that existed before your purchase, such as unresolved liens or errors in public records. Lenders typically require a lender’s title policy, and buyers often purchase an owner’s policy as well.' },
        { question: 'Can closing costs be rolled into the loan amount?', answer: 'In some cases, particularly with certain refinances, closing costs can be added to the loan balance rather than paid upfront, though this increases the total amount you’re borrowing and paying interest on over time.' },
        { question: 'Why do I need homeowners insurance to get a mortgage?', answer: 'Lenders require homeowners insurance because the home is their collateral, and the policy protects both you and the lender against loss from fire, certain weather events, and other covered damage to the property.' },
      ],
      markdown: `The interest rate gets most of the attention, but it’s far from the only cost tied to a mortgage. Here is what you’ll actually pay, itemized clearly, from closing day through every month afterward.

## Closing Costs: The One-Time Charges

Closing costs are a bundle of separate fees due at signing, commonly totaling a few percent of the loan amount. They aren’t one line item — they’re a collection of distinct charges, each covering a different service required to complete the loan.

| Fee category | What it covers |
| --- | --- |
| Origination fee | Lender’s cost for processing and underwriting the loan |
| Appraisal fee | Independent valuation confirming the home’s market value |
| Title search and insurance | Confirms clear legal ownership and protects against ownership disputes |
| Recording fees | Government charge to record the deed and mortgage publicly |
| Prepaid interest and escrow | Interest from closing to your first payment, plus initial tax/insurance escrow deposit |

Your loan estimate and closing disclosure will list these individually, letting you compare the specific charges — not just the headline rate — across lenders.

## Mortgage Insurance: PMI and MIP

If your down payment is below 20% on a conventional loan, lenders typically require **private mortgage insurance (PMI)**, which protects the lender — not you — if you default. PMI can usually be removed once your loan balance falls to a set percentage of the home's value, either automatically or by request.

FHA loans carry a different structure: **mortgage insurance premium (MIP)**, which includes an upfront charge and an ongoing monthly cost. Depending on your down payment and loan terms, FHA’s MIP can last for the life of the loan rather than being automatically removable — a meaningful difference from conventional PMI worth factoring into your loan-type decision.

> [!INFO] If avoiding long-term mortgage insurance matters to you, compare the total cost of FHA’s MIP against a conventional loan with PMI you can eventually remove — the "cheaper" loan type isn’t always the same over the full life of the loan.

## Escrow Accounts: Ongoing Monthly Costs

Many mortgages include an **escrow account**, where a portion of your monthly payment is set aside specifically for property taxes and homeowners insurance. The lender collects these funds throughout the year and pays the bills directly when they’re due, smoothing out what would otherwise be large, lump-sum annual payments.

- Property taxes are billed by your local government and can change year to year.
- Homeowners insurance premiums are billed by your insurer and can also change at renewal.
- Your escrow payment is periodically reviewed and adjusted (an "escrow analysis") to reflect these changes.

## Which Fees Are Negotiable

Not every fee is fixed. Lender-specific charges — such as parts of the origination fee — can sometimes be negotiated, waived, or offset with lender credits (often in exchange for a slightly higher rate). Third-party and government fees — appraisal, recording, and certain title charges — are generally the same regardless of which lender you choose, since they’re set by the service provider or government office, not the lender.

## How to Compare Total Cost Across Lenders

- Compare the **APR**, not just the interest rate, since it incorporates certain fees.
- Review the **loan estimate** line by line for each lender, not just the bottom-line total.
- Ask directly which fees are negotiable versus fixed.
- Factor in **PMI or MIP** duration and cost, not just the rate, when comparing loan types.

## Common Mistakes

- Budgeting only for the down payment and forgetting closing costs entirely.
- Not comparing PMI removal timelines against FHA’s potentially lifelong MIP when choosing a loan type.
- Assuming your escrow payment is fixed forever, rather than expecting periodic adjustments.
- Focusing only on the lowest rate while ignoring a lender’s higher fees.

## Conclusion

A mortgage’s true cost is the rate plus a real set of closing costs, possible mortgage insurance, and an ongoing escrow contribution — not the rate alone. Reviewing your loan estimate and closing disclosure line by line, and comparing APR rather than headline rate, gives you a far more accurate picture before you sign. If you're weighing whether a future rate drop or equity position might justify redoing this math, see our guide to [refinancing a mortgage](refinancing-a-mortgage).`,
      futureArticleIdeas: [
        'How to read a loan estimate line by line',
        'PMI vs FHA MIP: full cost comparison over time',
        'How escrow analysis and annual adjustments actually work',
        'Which mortgage closing costs are negotiable',
        'Lender credits explained: trading a higher rate for lower fees',
        'How property tax reassessments affect your escrow payment',
        'Title insurance explained: owner’s policy vs lender’s policy',
        'How to shop mortgage lenders using loan estimates',
        'What is prepaid interest at mortgage closing',
        'How to remove PMI once you reach 20% equity',
      ],
    },
  ],
};
