'use strict';
/*
 * Flagship content batch. Updates the existing published article at
 * /personal-finance/understanding-the-stock-market (categorySlug: personal-finance).
 * Structure: what a share is → how exchanges work → why prices move → how
 * people actually invest → risks — a mechanics-first structure suited to a
 * "how it works" beginner guide.
 */
module.exports = {
  slug: 'understanding-the-stock-market',
  categorySlug: 'personal-finance',
  title: 'How the Stock Market Works: A Beginner’s Guide',
  metaTitle: 'How the Stock Market Works | Beginner’s Guide',
  metaDescription:
    'How the stock market actually works — what a share is, how exchanges match buyers and sellers, why prices move, and how beginners actually get started investing.',
  excerpt:
    'The stock market lets people buy and sell small ownership pieces of companies. Here is what shares are, how exchanges work, and why prices move.',
  focusKeyword: 'how the stock market works',
  secondaryKeywords: ['stock market for beginners', 'what is the stock market', 'stock exchange', 'why stock prices move', 'how to invest in stocks'],
  longTailKeywords: ['how does buying a stock actually work', 'what makes stock prices go up and down', 'how do I start investing in the stock market'],
  searchIntent: 'Informational — beginners want to understand the mechanics of the stock market before investing.',
  keyTakeaways: [
    'A share is a small unit of ownership in a company; the stock market is where those shares are bought and sold between investors.',
    'Companies first sell shares to the public through an IPO, and from then on, shares trade between investors on an exchange.',
    'Stock exchanges match buyers and sellers electronically, and prices are set continuously by supply and demand, not by any single authority.',
    'Prices move based on company performance, broader economic news, industry trends, interest rates, and investor sentiment — often all at once.',
    'Most beginners invest through a brokerage account, often starting with diversified funds rather than picking individual stocks.',
  ],
  internalLinks: [
    { slug: 'etfs', anchor: 'exchange-traded funds' },
    { slug: 'bonds', anchor: 'bonds' },
    { slug: 'compound-interest', anchor: 'compound interest' },
    { slug: 'savings-vs-investing', anchor: 'savings vs investing' },
  ],
  faq: [
    {
      question: 'What actually happens when I buy a stock?',
      answer:
        'You place an order through a brokerage account specifying how many shares you want and at what price; the exchange matches your order with a seller willing to trade at that price, and ownership of those shares transfers to you.',
    },
    {
      question: 'Who sets stock prices?',
      answer:
        'No single person or authority sets the price — it emerges continuously from the balance of buy and sell orders on the exchange. If more people want to buy at a given price than sell, the price tends to rise, and vice versa.',
    },
    {
      question: 'Why do stock prices go up and down so much?',
      answer:
        'Prices reflect investors’ constantly updating expectations about a company’s future performance, which shift with earnings reports, economic data, interest rate changes, industry news, and broader investor sentiment — sometimes several of these move a stock in the same day.',
    },
    {
      question: 'Do I need a lot of money to start investing in stocks?',
      answer:
        'No. Many modern brokerages allow fractional share purchases, meaning you can invest a fixed dollar amount (even a small one) rather than needing enough money to buy a whole share.',
    },
    {
      question: 'What is the difference between a stock and an ETF?',
      answer:
        'A stock represents ownership in one specific company. An [ETF (exchange-traded fund)](etfs) holds a basket of many stocks (or other assets) in a single fund that itself trades like a stock, which spreads risk across multiple companies instead of concentrating it in one.',
    },
    {
      question: 'Can I lose all my money in the stock market?',
      answer:
        'A single company’s stock can lose most or all of its value if the company fails, though this is a much less common outcome for diversified investments spread across many companies, since it would require most or all of them to fail simultaneously.',
    },
  ],
  sources: [
    { name: 'U.S. Securities and Exchange Commission — Investor.gov', url: 'https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work' },
    { name: 'FINRA — Investing Basics', url: 'https://www.finra.org/investors/investing/investing-basics' },
  ],
  markdown: `The stock market can sound abstract from the outside — a scrolling ticker of numbers — but the underlying mechanics are more concrete than they first appear. This guide walks through what a share actually is, how an exchange works, why prices move as much as they do, and how beginners typically get started.

## What You'll Learn

By the end of this guide you'll understand what buying a share actually means, how a stock exchange matches buyers and sellers, the main forces that move prices, and the basic path most beginners take to start investing.

## Overview: What the Stock Market Is

The stock market is where **shares** — small units of ownership in a company — are bought and sold between investors. When you own a share, you own a proportional slice of that company: its assets, its future earnings, and (for some companies) a claim to dividend payments if the company distributes profits to shareholders. "The stock market" isn't a single place but a network of exchanges (like the NYSE and Nasdaq) where this buying and selling happens.

## How It Works: From IPO to Everyday Trading

A company's shares typically enter the public market through an **IPO (initial public offering)** — the first time it sells shares directly to public investors, usually to raise money for growth. After the IPO, those shares trade between investors on an exchange; the company itself isn't a party to most day-to-day trades — you're buying from, or selling to, another investor.

Exchanges match buyers and sellers electronically and continuously throughout the trading day. Every buy order looking to purchase at a certain price is matched against a sell order willing to accept that price, and this constant matching is what produces a stock's live price — there's no single authority "setting" it.

## Why Prices Move

Stock prices move because investors are constantly re-evaluating what a company (and its future earnings) is worth. The main drivers include:

- **Company performance** — earnings reports, revenue growth, new products, or management changes.
- **Industry and competitive news** — a shift affecting the company's whole sector, not just that one business.
- **Economic data and interest rates** — broader conditions that affect how attractive stocks are relative to other investments like [bonds](bonds).
- **Investor sentiment** — expectations and emotion, which can move prices even without new company-specific news.

Because several of these can shift at once, prices can move quickly and by meaningful amounts even on an ordinary trading day.

## How People Actually Get Started

Most beginners invest through a **brokerage account**, which acts as the gateway to placing buy and sell orders. From there, the common paths are:

- **Individual stocks** — buying shares of specific companies you've researched, which concentrates both potential reward and risk in those companies.
- **ETFs and mutual funds** — buying a fund that holds many stocks at once, spreading risk across companies and sectors instead of betting on any single one; see our [ETF guide](etfs) for how these work.
- **Fractional shares** — many brokerages now let you invest a fixed dollar amount rather than needing enough money for a whole share, lowering the practical barrier to getting started.

Over long time horizons, the reason investing (rather than only saving) is often recommended for long-term goals comes back to [compound growth](compound-interest) — reinvested gains have more time to build on themselves the earlier you start.

## Risks & Common Misunderstandings

- **A stock's price isn't the same as its value.** A "cheap" stock (low share price) isn't automatically a good deal, and an "expensive" one isn't automatically overpriced — price alone doesn't tell you much without context.
- **Short-term price swings are normal, not necessarily a sign something is wrong.** Day-to-day volatility is a feature of how markets work, not evidence of a mistake.
- **Concentration risk is real.** A single company's stock can lose most or all of its value if the business fails — a risk that diversified funds are specifically designed to reduce, not eliminate.
- **Past performance doesn't guarantee future results.** A stock or fund that has performed well historically carries no guarantee of continuing to do so.

## Related Concepts

Understanding the stock market connects directly to how [ETFs](etfs) diversify risk across many companies at once, how [bonds](bonds) offer a different risk/return trade-off within a portfolio, and why [compound interest](compound-interest) rewards investors who start earlier rather than those who invest more but later.

## Continue Learning

1. **Fundamental concept:** [How compound interest makes long-term investing powerful](compound-interest)
2. **Related concept:** [How ETFs spread risk across many companies at once](etfs)
3. **More advanced concept:** [How bonds work, and how they differ from stocks](bonds)
4. **Practical tool:** Before investing, review the [savings vs. investing](savings-vs-investing) framework to confirm the money you're putting into stocks is genuinely long-term money you won't need soon.`,
};
