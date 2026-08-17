'use strict';
/*
 * Flagship content batch. Updates the existing published article at
 * /etfs/etfs (categorySlug: etfs).
 * Structure: what an ETF is → how it works → common types → cost example →
 * ETFs vs mutual funds → risks.
 */
module.exports = {
  slug: 'etfs',
  categorySlug: 'etfs',
  title: 'What Is an ETF? Exchange-Traded Funds Explained',
  metaTitle: 'What Is an ETF? Exchange-Traded Funds Explained',
  metaDescription:
    'ETFs explained clearly — how exchange-traded funds work, common types, how expense ratios affect long-term returns, and how ETFs differ from mutual funds.',
  excerpt:
    'An ETF is a fund that holds a basket of investments and trades on an exchange like a stock, giving instant diversification in a single trade.',
  focusKeyword: 'what is an etf',
  secondaryKeywords: ['exchange-traded fund', 'etf vs mutual fund', 'index fund etf', 'etf expense ratio'],
  longTailKeywords: ['how do etfs work', 'are etfs good for beginners', 'etf vs mutual fund which is better'],
  searchIntent: 'Informational — readers want to understand what an ETF is before deciding whether to invest in one.',
  keyTakeaways: [
    'An ETF (exchange-traded fund) holds a basket of assets — often stocks or bonds — and trades on an exchange throughout the day like a single stock.',
    'Most ETFs are index funds, meaning they aim to track a specific market index (like the S&P 500) rather than beat it through active stock picking.',
    'Buying one ETF share gives instant diversification across every holding in the fund, spreading risk instead of concentrating it in one company.',
    'ETFs charge an expense ratio — an annual fee, expressed as a percentage of your investment — and even small differences compound meaningfully over decades.',
    'ETFs and mutual funds are similar in what they hold, but differ in how they trade: ETFs trade all day at live prices; mutual funds trade once per day.',
  ],
  internalLinks: [
    { slug: 'understanding-the-stock-market', anchor: 'how the stock market works' },
    { slug: 'bonds', anchor: 'bonds' },
    { slug: 'compound-interest', anchor: 'compound interest' },
    { slug: 'savings-vs-investing', anchor: 'savings vs investing' },
  ],
  faq: [
    {
      question: 'What does ETF stand for?',
      answer:
        'ETF stands for exchange-traded fund — a fund that pools money from many investors to buy a basket of assets, and whose own shares trade on a stock exchange throughout the trading day.',
    },
    {
      question: 'How is an ETF different from a single stock?',
      answer:
        'A single stock represents ownership in one company. An ETF typically holds many different stocks (or other assets) inside one fund, so buying a single ETF share spreads your money across every holding in the fund rather than concentrating it in one company.',
    },
    {
      question: 'What is an expense ratio, and why does it matter?',
      answer:
        'An expense ratio is the annual fee a fund charges, expressed as a percentage of your investment — for example, a 0.20% expense ratio costs $2 per year for every $1,000 invested. Because this fee is deducted every year, even small differences compound into a meaningfully different outcome over long time horizons.',
    },
    {
      question: 'What is the difference between an ETF and a mutual fund?',
      answer:
        'Both pool money to buy a basket of assets, but ETFs trade throughout the day on an exchange at live, fluctuating prices — the same way a stock does — while traditional mutual funds are only priced and traded once per day, after markets close.',
    },
    {
      question: 'Are ETFs actively managed or passive?',
      answer:
        'Most ETFs are passively managed, meaning they aim to track a specific market index (like the S&P 500) rather than have a manager actively pick which stocks to buy or sell. Actively managed ETFs exist too, but they’re a smaller share of the overall ETF market and typically charge higher fees.',
    },
    {
      question: 'Can an ETF lose money?',
      answer:
        'Yes. An ETF’s value moves with the value of its underlying holdings, so a broad market decline will typically reduce the value of a stock ETF as well — diversification reduces the risk of any single company sinking the whole investment, but it doesn’t eliminate market-wide risk.',
    },
  ],
  sources: [
    { name: 'U.S. Securities and Exchange Commission — Investor.gov: ETFs', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-1' },
    { name: 'FINRA — Exchange-Traded Funds (ETFs)', url: 'https://www.finra.org/investors/investing/investment-products/exchange-traded-funds-etfs' },
  ],
  markdown: `An ETF is one of the most common ways beginner and experienced investors alike get diversified exposure to the market in a single trade. This guide covers what an ETF actually is, how it works, what it costs, and how it compares to the similarly-named mutual fund.

## What You'll Learn

By the end of this guide you'll understand what an ETF holds, how buying one gives you instant diversification, how expense ratios work and why they matter over time, and the key practical difference between an ETF and a mutual fund.

## Overview: What an ETF Is

An **exchange-traded fund (ETF)** is a fund that pools money from many investors to buy a collection — a "basket" — of assets, most commonly stocks or bonds. The fund itself then trades on a stock exchange, meaning you buy and sell shares of the ETF the same way you'd buy and sell shares of an individual company, but each ETF share represents a proportional slice of everything the fund holds, not ownership in a single business.

## How It Works

Most ETFs are built to **track an index** — a defined list of securities meant to represent a market or segment of it, like the S&P 500 (roughly the 500 largest U.S. public companies) or a bond index. Rather than a manager actively deciding which individual stocks to buy, an index-tracking ETF simply holds (or closely approximates) everything in that index, in roughly the same proportions.

Because the ETF trades on an exchange, its price moves continuously throughout the trading day based on supply, demand, and the real-time value of its underlying holdings — much like the [stock market](understanding-the-stock-market) mechanics that apply to any individual stock.

## Common Types of ETFs

- **Broad market index ETFs** — track a wide index like the S&P 500 or total U.S. stock market.
- **Bond ETFs** — hold a basket of [bonds](bonds) instead of stocks, aiming for income and lower volatility than stock funds.
- **Sector ETFs** — focus on one industry (technology, healthcare, energy) rather than the whole market.
- **International ETFs** — hold companies based outside the investor's home country, for geographic diversification.

## A Cost Example: Why Expense Ratios Matter

Every ETF charges an **expense ratio** — an annual fee, expressed as a percentage of your investment, deducted automatically rather than billed separately. Consider $10,000 invested for 20 years at an assumed 7% annual return, comparing two expense ratios:

- **Fund A, 0.05% expense ratio:** grows to roughly **$38,470** after fees.
- **Fund B, 0.75% expense ratio:** grows to roughly **$33,760** after fees.

The difference — about **$4,700** on the same $10,000 investment, same return, same 20 years — comes entirely from a 0.70 percentage point gap in annual fees, compounded over time. This is why comparing expense ratios is a standard part of choosing between similar ETFs.

## ETFs vs. Mutual Funds

ETFs and mutual funds are similar in what they hold — both pool money into a diversified basket of assets — but differ in how they trade:

| | ETF | Mutual Fund |
| --- | --- | --- |
| Trading | Throughout the day, at live prices | Once per day, after markets close |
| Minimum investment | Often the price of one share (or a fraction) | Sometimes a fixed dollar minimum |
| Typical fees | Often lower expense ratios | Can be higher, especially if actively managed |

Neither structure is universally "better" — the right choice often depends on the specific fund's holdings, cost, and how it fits your goals, more than the ETF-versus-mutual-fund structure itself.

## Risks & Common Misunderstandings

- **Diversification reduces company-specific risk, not market-wide risk.** A broad market ETF can still lose value in a market-wide downturn — it just isn't dependent on any single company's fate.
- **Not all ETFs are diversified in the same way.** A sector or single-country ETF can be just as concentrated in one theme as an individual stock is in one company.
- **Trading like a stock doesn't mean day-trading is the point.** Most of an ETF's practical benefit for long-term investors comes from buying and holding, not frequent trading.
- **Low cost isn't the only factor.** Expense ratio matters, but so does what the fund actually holds and whether that matches your goals and risk tolerance.

## Related Concepts

ETFs are a practical way to apply the diversification principle underlying [how the stock market works](understanding-the-stock-market), often used alongside or instead of individual [bonds](bonds) depending on an investor's goals, and their long-term value depends heavily on the same [compounding](compound-interest) math that applies to any investment held over time.

## Continue Learning

1. **Fundamental concept:** [How the stock market works](understanding-the-stock-market)
2. **Related concept:** [How bonds work, and how they differ from stock-based ETFs](bonds)
3. **More advanced concept:** [How compound interest makes low fees matter more over long time horizons](compound-interest)
4. **Practical tool:** Compare the expense ratios of two or three ETFs that hold similar assets — a 0.5 percentage point difference is worth checking against the math in the cost example above.`,
};
