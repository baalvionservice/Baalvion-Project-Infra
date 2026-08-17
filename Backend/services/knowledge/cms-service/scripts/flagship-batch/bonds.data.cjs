'use strict';
/*
 * Flagship content batch. Updates the existing published article at
 * /bonds/bonds (categorySlug: bonds).
 * Structure: what a bond is → key terms → how price and yield relate
 * (worked example) → types of bonds → risks.
 */
module.exports = {
  slug: 'bonds',
  categorySlug: 'bonds',
  title: 'How Bonds Work: A Beginner’s Guide to Fixed-Income Investing',
  metaTitle: 'How Bonds Work: A Beginner’s Guide',
  metaDescription:
    'Bonds explained clearly — what a bond actually is, how price and yield relate, common types of bonds, and the real risks bond investors should understand.',
  excerpt:
    'A bond is essentially a loan you make to a government or company, paid back with interest. Here is exactly how bonds work, priced with a real example.',
  focusKeyword: 'bonds',
  secondaryKeywords: ['how bonds work', 'bond yield', 'types of bonds', 'bond price vs yield'],
  longTailKeywords: ['why do bond prices fall when interest rates rise', 'what is a bond coupon rate', 'are bonds safer than stocks'],
  searchIntent: 'Informational — readers want to understand bond mechanics before considering them as part of a portfolio.',
  keyTakeaways: [
    'A bond is essentially a loan: you lend money to a government or company, which agrees to pay you interest and return your principal at maturity.',
    'Key bond terms are face value (what you get back at maturity), coupon rate (the stated interest rate), and maturity date (when the loan is repaid).',
    'Bond prices and interest rates move inversely — when rates rise, existing bonds with lower fixed rates typically fall in price, and vice versa.',
    'Bonds are generally considered lower-risk than stocks, but "lower-risk" doesn’t mean risk-free — they can still lose value, especially before maturity.',
    'Government bonds and high-quality corporate bonds are generally considered safer than lower-rated ("high-yield") corporate bonds, which pay more to compensate for higher risk.',
  ],
  internalLinks: [
    { slug: 'complete-guide-to-interest-rates', anchor: 'how interest rates work' },
    { slug: 'understanding-the-stock-market', anchor: 'how the stock market works' },
    { slug: 'etfs', anchor: 'exchange-traded funds' },
    { slug: 'savings-vs-investing', anchor: 'savings vs investing' },
  ],
  faq: [
    {
      question: 'What is a bond in simple terms?',
      answer:
        'A bond is essentially a loan. When you buy a bond, you’re lending money to the issuer — a government or a company — which agrees to pay you periodic interest (the coupon) and return your original investment (the face value) when the bond matures.',
    },
    {
      question: 'Why do bond prices fall when interest rates rise?',
      answer:
        'An existing bond pays a fixed coupon rate set when it was issued. If new bonds start offering higher rates because overall interest rates rose, your older, lower-rate bond becomes less attractive by comparison — so its market price falls to make its effective yield competitive with newer bonds.',
    },
    {
      question: 'What is the difference between a bond’s coupon rate and its yield?',
      answer:
        'The coupon rate is the fixed interest rate stated when the bond was issued, applied to its face value. Yield reflects the bond’s actual return based on its current market price, which can differ from the coupon rate if the bond is trading above or below face value.',
    },
    {
      question: 'Are bonds risk-free?',
      answer:
        'No. Bonds carry interest rate risk (prices fall when rates rise), credit risk (the issuer could default, more relevant for corporate bonds than government bonds), and inflation risk (a fixed payment buys less if inflation runs high). Government bonds from stable issuers are generally considered lower-risk, not risk-free.',
    },
    {
      question: 'What happens if I sell a bond before it matures?',
      answer:
        'You receive whatever the bond is currently worth on the market, which may be more or less than what you paid, depending on how interest rates and the issuer’s credit standing have changed since you bought it. If you hold a bond to maturity, you generally receive its full face value (barring default).',
    },
    {
      question: 'Should I own individual bonds or a bond fund?',
      answer:
        'Individual bonds let you hold to a specific maturity date and know your exact return if held that long, while bond ETFs or mutual funds offer instant diversification across many bonds but don’t have a single fixed maturity date — the right choice depends on your goals and how much you want to manage individual holdings.',
    },
  ],
  sources: [
    { name: 'U.S. Securities and Exchange Commission — Investor.gov: Bonds', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products' },
    { name: 'FINRA — Bonds', url: 'https://www.finra.org/investors/investing/investment-products/bonds' },
  ],
  markdown: `Bonds have a reputation as the "boring" half of a portfolio, but understanding how they actually work explains a lot about interest rates, risk, and why a diversified portfolio usually holds more than just stocks. This guide covers what a bond is, how price and yield relate, the main types of bonds, and the real risks involved.

## What You'll Learn

By the end of this guide you'll understand the core terms every bond uses, why bond prices and interest rates move in opposite directions (with a worked example), the main categories of bonds available to investors, and where bonds carry real risk despite their reputation for safety.

## Overview: What a Bond Is

A bond is essentially a **loan**. When a government or company needs to raise money, it can issue bonds — effectively borrowing from investors — and agrees to pay those investors interest over time, then return the original amount when the bond matures. Buying a bond makes you the lender, not an owner, which is the fundamental difference between a bond and a [stock](understanding-the-stock-market).

## Key Terms

- **Face value (or par value)** — the amount the bond will be worth, and repay, at maturity (commonly $1,000 per bond for many types).
- **Coupon rate** — the stated annual interest rate, applied to face value, that the bond pays (often split into semiannual payments).
- **Maturity date** — when the bond's term ends and the issuer repays the face value.
- **Yield** — the bond's actual return based on its current market price, which can differ from the coupon rate depending on whether the bond trades above or below face value.

## How Price and Yield Relate: A Worked Example

Bond prices and [interest rates](complete-guide-to-interest-rates) move in opposite directions. Here's why, with numbers:

Suppose you own a bond with a **$1,000 face value** and a **4% coupon rate**, paying $40 per year. Now imagine overall interest rates rise, and newly issued bonds of similar quality start offering a **5% coupon** — meaning $50 per year on the same $1,000 face value.

Your existing 4% bond is now less attractive by comparison. If you tried to sell it, a buyer wouldn't pay full face value for a bond paying less than what's newly available — so its market price falls, to a level where its effective yield becomes competitive with the new 5% bonds. Conversely, if rates had fallen instead, your 4% bond would look relatively attractive, and its price would tend to rise above face value.

This inverse relationship is one of the most important mechanics in fixed-income investing, and it's why bond prices (not just stock prices) can fluctuate meaningfully even though the coupon payment itself doesn't change.

## Types of Bonds

- **U.S. Treasury bonds** — issued by the federal government, generally considered among the lowest-risk bonds available since they're backed by the full faith and credit of the U.S. government.
- **Municipal bonds** — issued by state or local governments, sometimes offering tax advantages depending on your situation.
- **Corporate bonds** — issued by companies, with risk and yield varying widely based on the issuing company's financial health and credit rating.
- **High-yield ("junk") bonds** — corporate bonds from lower-rated issuers, paying higher interest to compensate investors for taking on more credit risk.

## Risks & Common Misunderstandings

- **"Lower-risk" doesn't mean risk-free.** Bonds carry interest rate risk (prices fall when rates rise), credit risk (the issuer could fail to pay, more relevant to corporate than government bonds), and inflation risk (a fixed payment loses purchasing power if inflation runs high).
- **Selling before maturity means accepting the current market price**, which may be less than what you paid — holding to maturity is what guarantees receiving full face value (barring default), not simply owning a bond.
- **Higher yield usually means higher risk.** A bond paying an unusually high rate relative to comparable bonds is often compensating investors for greater credit risk, not offering a "free" better deal.
- **Bonds and bond funds aren't identical.** An individual bond has a fixed maturity date and a knowable return if held to that date; a bond [ETF](etfs) or mutual fund typically doesn't, since it continuously buys and sells bonds within the fund.

## Related Concepts

Bond prices move inversely with [interest rates](complete-guide-to-interest-rates), bonds are often held alongside [stocks](understanding-the-stock-market) as part of a diversified portfolio, and many investors gain bond exposure through [ETFs](etfs) rather than buying individual bonds directly.

## Continue Learning

1. **Fundamental concept:** [How interest rates work, and why bond prices move opposite to them](complete-guide-to-interest-rates)
2. **Related concept:** [How the stock market works, for comparison with bonds](understanding-the-stock-market)
3. **More advanced concept:** [How ETFs can provide diversified bond exposure in a single fund](etfs)
4. **Practical tool:** Review the [savings vs. investing](savings-vs-investing) framework to think through how much of your portfolio's risk you actually want in bonds versus stocks, based on your own time horizon.`,
};
