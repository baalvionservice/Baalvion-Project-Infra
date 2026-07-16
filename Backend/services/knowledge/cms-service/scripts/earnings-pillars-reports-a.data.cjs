'use strict';
/*
 * Earnings pillar + cluster (part A) — part of the "Earnings" content program.
 * Consumed by seed-investing-pillars.cjs, which converts `markdown` into the
 * live CMS block shape and attaches customFields (faq, author, images, sources, cta, etc).
 *
 * This file contains the pillar page plus articles 1-8 of a planned 15-article
 * cluster. Articles 9-15 live in the companion "-b" file written separately;
 * this file links to those slugs by name so cross-links resolve once both
 * files are merged and seeded together.
 */

module.exports = {
  categorySlug: 'earnings',
  categoryName: 'Earnings',
  sources: [
    { name: 'U.S. SEC — EDGAR', url: 'https://www.sec.gov/edgar' },
    { name: 'U.S. SEC — Investor.gov', url: 'https://www.investor.gov' },
    { name: 'FASB — Financial Accounting Standards Board', url: 'https://www.fasb.org' },
    { name: 'Nasdaq — Investor Education', url: 'https://www.nasdaq.com' },
    { name: 'NYSE — Investor Relations Resources', url: 'https://www.nyse.com' },
  ],

  pillar: {
    slug: 'earnings-reports-complete-guide',
    title: 'The Complete Guide to Reading and Analyzing Corporate Earnings Reports',
    metaTitle: 'Earnings Reports Explained: How to Read & Analyze Them',
    metaDescription: 'A complete guide to corporate earnings reports — what they contain, how earnings season works, and how to read and analyze them like a professional investor.',
    excerpt: 'Earnings reports drive some of the biggest single-day stock moves in the market. This guide explains what they contain, how earnings season works, and how to read one with confidence.',
    focusKeyword: 'earnings reports',
    secondaryKeywords: ['what is an earnings report', 'corporate earnings', 'earnings season', 'how to read earnings reports', 'quarterly earnings'],
    longTailKeywords: ['how to read a company earnings report for beginners', 'why do stocks move on earnings day', 'what does an earnings report tell investors', 'how often do companies report earnings'],
    searchIntent: 'Informational — investors researching how to interpret quarterly corporate earnings before making investment decisions.',
    audience: ['Beginner', 'Intermediate', 'Professional'],
    subcategory: 'Earnings Fundamentals',
    tags: ['earnings reports', 'earnings season', 'corporate earnings', 'investing basics'],
    heroImagePrompt: 'Ultra-realistic professional photograph of a financial analyst reviewing a corporate earnings report on a dual-monitor setup showing a bar chart of quarterly revenue, modern office with soft natural light, shallow depth of field, corporate finance publication quality, no logos, no text overlays, 16:9 aspect ratio',
    socialImagePrompt: 'Realistic minimalist financial photograph of a printed quarterly earnings summary sheet beside a pen and a cup of coffee on a walnut desk, warm editorial lighting, high-end business magazine cover style, no text, no logos, 16:9',
    coverImageAlt: 'Financial analyst reviewing a corporate quarterly earnings report on a monitor',
    thumbnailAlt: 'Printed quarterly earnings summary on a desk',
    imageFileName: 'earnings-reports-complete-guide-hero.jpg',
    keyTakeaways: [
      'An earnings report is a company’s official disclosure of its financial performance for a specific period, typically a fiscal quarter.',
      'Public companies report earnings on a predictable quarterly cadence, and the market widely refers to this recurring window as "earnings season."',
      'The headline numbers — revenue, net income, and earnings per share (EPS) — matter, but so does forward guidance about future performance.',
      'Stock prices often react more to how results compare with analyst expectations than to whether the numbers themselves grew or shrank.',
      'Reading an earnings report well means looking past the headline and into the income statement, the accompanying commentary, and the guidance.',
      'Consistent, disciplined analysis of earnings reports over time reveals far more than reacting to any single quarter in isolation.',
    ],
    internalLinks: [
      { slug: 'what-is-an-earnings-report', anchor: 'what an earnings report actually is' },
      { slug: 'earnings-per-share-eps-explained', anchor: 'earnings per share (EPS)' },
      { slug: 'gaap-vs-non-gaap-earnings', anchor: 'GAAP vs non-GAAP earnings' },
      { slug: 'how-to-read-an-income-statement', anchor: 'how to read an income statement' },
      { slug: 'earnings-season-calendar-explained', anchor: 'the earnings season calendar' },
      { slug: 'what-is-an-earnings-call', anchor: 'earnings calls' },
      { slug: 'earnings-beat-vs-earnings-miss', anchor: 'earnings beats and misses' },
      { slug: 'revenue-vs-earnings-explained', anchor: 'revenue vs earnings' },
    ],
    faq: [
      { question: 'What exactly is an earnings report?', answer: 'An earnings report is a company’s official summary of its financial results for a set period, usually a fiscal quarter, including revenue, expenses, profit, and often forward-looking commentary from management about the period ahead.' },
      { question: 'How often do public companies report earnings?', answer: 'Most publicly traded companies report earnings four times a year, once per fiscal quarter, alongside a more detailed annual report covering the full fiscal year.' },
      { question: 'Why do investors pay so much attention to earnings reports?', answer: 'Earnings reports are one of the few moments when a company discloses audited or reviewed financial performance directly, giving investors concrete data to evaluate the business rather than relying on speculation.' },
      { question: 'What is the difference between revenue and earnings?', answer: 'Revenue is the total money a company brings in from sales before any costs are subtracted, while earnings (or net income) is what remains after all expenses, taxes, and interest are paid — see our guide on revenue vs earnings for a full breakdown.' },
      { question: 'Why do stocks sometimes fall even when a company reports higher profit?', answer: 'Stock prices react to how results compare with what investors already expected. If profit grows but falls short of analyst estimates or the company lowers its outlook, the stock can still decline despite the year-over-year improvement.' },
      { question: 'What is earnings season?', answer: 'Earnings season refers to the multi-week windows, roughly four times a year, when a large concentration of public companies release their quarterly results in a short span of time.' },
      { question: 'What is forward guidance in an earnings report?', answer: 'Forward guidance is management’s outlook for future performance, such as expected revenue or profit ranges for the next quarter or year, and it often moves stock prices as much as the historical results themselves.' },
      { question: 'What is the difference between GAAP and non-GAAP earnings?', answer: 'GAAP earnings follow standardized accounting rules set by the Financial Accounting Standards Board, while non-GAAP (or "adjusted") earnings exclude certain items management considers non-representative of core operations — both have a place in analysis when understood correctly.' },
      { question: 'Where can I find a company’s earnings report?', answer: 'Companies publish earnings materials on their investor relations websites, and in the United States, detailed filings such as the quarterly Form 10-Q and annual Form 10-K are available through the SEC’s EDGAR database.' },
      { question: 'Do I need to be an accountant to understand earnings reports?', answer: 'No. While professional analysts go deep into financial statements, an individual investor can learn to read the headline metrics, guidance, and a few key ratios well enough to make informed decisions without a formal accounting background.' },
    ],
    markdown: `Every quarter, thousands of publicly traded companies open their books to the world through a single event: the **earnings report**. For investors, these releases are among the most consequential moments in the market calendar — capable of moving a stock's price by double digits in a single trading session. Yet many individual investors never learn to read one beyond the headline numbers flashing across a financial news ticker.

This guide explains what an earnings report actually is, why it matters so much to markets, how the reporting calendar works, how to interpret the numbers and commentary inside it, and the mistakes to avoid along the way.

## Why Earnings Reports Matter

An earnings report is the closest thing markets get to a formal check-in on a company's health. It tells investors, employees, lenders, and competitors how the business actually performed — not how it was expected to perform, not how management hopes it will perform, but what happened, backed by structured financial statements. Because so much of a stock's price reflects expectations about future profitability, earnings reports are the events that most directly test whether those expectations were reasonable. Learn more about [what an earnings report actually is](what-is-an-earnings-report) and why it carries so much weight.

## What's Inside an Earnings Report

While formats vary, most earnings releases share a common core of information:

| Component | What it tells you |
| --- | --- |
| Revenue | Total sales generated during the period, before costs |
| Net income | Profit remaining after all expenses, taxes, and interest |
| Earnings per share (EPS) | Net income divided across each outstanding share |
| Guidance | Management's outlook for the next quarter or fiscal year |
| Segment/geographic detail | Performance broken out by business line or region |
| Management commentary | Context on what drove the results and what may come next |

Understanding [revenue vs earnings](revenue-vs-earnings-explained) and [earnings per share](earnings-per-share-eps-explained) is essential before comparing one report to another, since these figures interact in ways that headlines often oversimplify.

## The Earnings Season Cadence

Public companies generally report on a predictable quarterly rhythm tied to the end of their fiscal quarter, with results typically following a few weeks after the quarter closes. Because so many companies share a calendar-year fiscal schedule, results tend to cluster into recurring multi-week windows commonly called "earnings season" — a pattern explored fully in our guide to the [earnings season calendar](earnings-season-calendar-explained). Large banks are often among the earliest reporters each cycle, with the broader market following over the subsequent weeks.

> [!INFO] Not every company follows a calendar-year fiscal schedule. Some businesses use a fiscal year that ends in a different month, which shifts when their "quarterly" reports land relative to the broader earnings season.

## How Markets React: Beats, Misses, and Expectations

One of the most counterintuitive lessons for new investors is that a stock's reaction to an earnings report often has less to do with whether results improved and more to do with how they compared to what analysts and investors already expected. A company that grows profit but falls short of the consensus estimate can see its stock fall, while a company whose results decline less than feared can see its stock rise. This dynamic — commonly described as an [earnings beat versus an earnings miss](earnings-beat-vs-earnings-miss) — is central to understanding short-term price action around earnings dates.

## How to Read an Earnings Report Step by Step

1. **Start with the headline numbers** — revenue, net income, and EPS — and compare them to the prior year's same quarter, not just the prior quarter.
2. **Check how results compared with expectations**, not just whether they grew.
3. **Read the income statement** to see where money was made or lost; see our guide on [how to read an income statement](how-to-read-an-income-statement).
4. **Separate GAAP from non-GAAP figures** using our explainer on [GAAP vs non-GAAP earnings](gaap-vs-non-gaap-earnings), since companies often highlight the more flattering measure.
5. **Read or listen to the accompanying [earnings call](what-is-an-earnings-call)**, where management explains results and answers analyst questions.
6. **Weigh the guidance** for future periods as heavily as the historical results — markets are forward-looking.

## Common Mistakes

- **Reacting only to the stock's initial price move** without reading what actually drove it.
- **Ignoring guidance** and focusing solely on the quarter that already happened.
- **Treating non-GAAP "adjusted" earnings as automatically equivalent to GAAP earnings**, when the adjustments can be significant.
- **Comparing a company's results to the wrong prior period**, distorting the sense of growth or decline.
- **Overweighting a single quarter** rather than tracking trends across several reporting periods.

## Expert Tips

- Build a habit of comparing results against both the prior-year quarter and the sequential prior quarter to separate seasonal effects from real trends.
- Read the full press release and, when available, the transcript of the earnings call rather than relying solely on summarized headlines.
- Track a company's guidance history over several quarters to see whether management tends to under-promise or over-promise.
- Pay attention to margin trends, not just top-line revenue, since rising sales with shrinking margins can signal underlying cost pressure.
- Keep a simple personal log of the guidance given and the guidance actually delivered each quarter — over time this reveals whether a management team's forecasts are reliable.

## Reading Earnings Reports as an Ongoing Practice

No single earnings report tells a complete story on its own. The real value comes from reading several consecutive quarters together, watching how revenue, margins, and guidance evolve, and noticing whether management's tone and credibility hold up over time. Investors who build this habit — rather than reacting only to the immediate stock-price move on earnings day — tend to develop a far more reliable sense of a company's actual trajectory than those who check in only once or twice a year.

## Conclusion

Earnings reports are where expectations meet reality, and learning to read them carefully — beyond the headline number and the first minute of stock-price reaction — is one of the most valuable skills an individual investor can build. Start with the fundamentals of [what an earnings report is](what-is-an-earnings-report) and [earnings per share](earnings-per-share-eps-explained), then work through the income statement, the guidance, and the earnings call to form a complete picture each quarter.`,
  },

  articles: [
    {
      slug: 'what-is-an-earnings-report',
      title: 'What Is an Earnings Report and Why It Matters',
      metaTitle: 'What Is an Earnings Report? A Plain-English Guide',
      metaDescription: 'Learn what a corporate earnings report is, what it contains, who reads it, and why it matters so much to stock prices every quarter.',
      excerpt: 'An earnings report is a company’s formal scorecard for a fiscal period. Here is what it actually contains and why markets pay so much attention.',
      focusKeyword: 'what is an earnings report',
      secondaryKeywords: ['earnings report definition', 'quarterly earnings report', 'corporate financial disclosure', 'earnings release'],
      longTailKeywords: ['what does an earnings report include', 'why do companies release earnings reports', 'difference between earnings report and press release'],
      searchIntent: 'Informational — beginners seeking a foundational definition before engaging with more advanced earnings content.',
      audience: ['Beginner'],
      subcategory: 'Earnings Fundamentals',
      tags: ['earnings report', 'earnings basics', 'financial disclosure'],
      heroImagePrompt: 'Realistic professional photograph of an investor reading a printed quarterly earnings summary at a home office desk, laptop open beside it showing a stock chart, warm natural light, approachable and professional, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic close-up photo of a folded financial newspaper-style earnings summary sheet on a desk beside reading glasses, editorial finance photography, no logos, no readable text, 16:9',
      coverImageAlt: 'Investor reading a printed quarterly earnings report at a desk',
      thumbnailAlt: 'Printed earnings report summary beside a laptop',
      imageFileName: 'what-is-an-earnings-report.jpg',
      keyTakeaways: [
        'An earnings report is a company’s formal disclosure of financial performance for a fiscal period, usually a quarter.',
        'It typically includes revenue, net income, earnings per share, and management commentary on results and outlook.',
        'Public companies in the U.S. are required to file periodic reports, such as the Form 10-Q and Form 10-K, with the SEC.',
        'Earnings reports are distinct from press releases — the release often summarizes the report and is issued alongside it.',
        'Analysts, investors, employees, and competitors all use earnings reports, but each reads them for different purposes.',
      ],
      internalLinks: [
        { slug: 'earnings-reports-complete-guide', anchor: 'complete guide to earnings reports' },
        { slug: 'earnings-per-share-eps-explained', anchor: 'earnings per share explained' },
        { slug: 'how-to-read-an-income-statement', anchor: 'how to read an income statement' },
        { slug: 'revenue-vs-earnings-explained', anchor: 'revenue vs earnings' },
      ],
      faq: [
        { question: 'What is an earnings report in simple terms?', answer: 'An earnings report is a structured summary of how much money a company made and spent over a set period, usually a fiscal quarter, along with commentary from management about what drove those results.' },
        { question: 'Who is required to publish earnings reports?', answer: 'Publicly traded companies are generally required by securities regulators to periodically disclose financial results, since investors who own shares in the open market are entitled to standardized, timely information about the business.' },
        { question: 'What is the difference between an earnings report and an earnings release?', answer: 'The earnings release is typically a shorter press release announcing headline results, issued around the same time as the more detailed formal filing, which contains the full financial statements and notes.' },
        { question: 'What is a Form 10-Q?', answer: 'In the United States, a Form 10-Q is the quarterly report public companies file with the SEC, containing unaudited financial statements and disclosures for the quarter, distinct from the more comprehensive annual Form 10-K.' },
        { question: 'Do private companies release earnings reports?', answer: 'Private companies are generally not required to publicly disclose earnings the way listed companies are, though they may share financial information privately with lenders, investors, or partners under specific agreements.' },
        { question: 'What sections typically appear in an earnings report?', answer: 'Common sections include the income statement, balance sheet, cash flow statement, management discussion and analysis, and often a forward-looking guidance section.' },
        { question: 'Why do earnings reports move stock prices?', answer: 'Stock prices reflect investor expectations about a company’s future profitability, and an earnings report either confirms, exceeds, or falls short of those expectations, prompting the market to reprice the stock accordingly.' },
        { question: 'How can I access a company’s earnings report?', answer: 'Companies post earnings materials on their investor relations websites, and detailed regulatory filings can be found through official sources such as the SEC’s EDGAR database for U.S.-listed companies.' },
        { question: 'Are earnings reports audited?', answer: 'Quarterly reports are typically reviewed but not fully audited, while the annual report generally includes financial statements that have gone through a full independent audit.' },
        { question: 'Why do earnings reports matter to more than just investors?', answer: 'Employees, suppliers, competitors, and job seekers may also read earnings reports to gauge a company’s stability, growth trajectory, and competitive position within its industry.' },
      ],
      markdown: `Before diving into ratios, growth rates, and stock reactions, it helps to answer a more basic question: **what is an earnings report, exactly?** Understanding the shape and purpose of this document is the foundation for everything else in earnings analysis.

## A Formal Financial Scorecard

An earnings report is a structured disclosure of a company's financial performance over a defined period, most commonly a fiscal quarter. It goes beyond a simple announcement — it typically includes detailed financial statements covering revenue, expenses, profit, assets, liabilities, and cash flow, along with narrative commentary from management explaining what happened and why.

For companies listed on public stock exchanges, this disclosure is not optional. Securities regulators require periodic reporting so that anyone who owns or is considering owning shares has access to timely, standardized information rather than relying on rumor or selective company statements.

## Earnings Release vs Formal Filing

It's worth distinguishing between two related but different documents:

- **The earnings release** is a press release, usually a few pages, highlighting headline results such as revenue, net income, and EPS, along with a summary of guidance. This is what most financial news coverage is built around.
- **The formal filing** — in the U.S., the quarterly Form 10-Q or annual Form 10-K filed with the SEC — contains the complete financial statements, detailed notes, and legal disclosures. It is longer, more technical, and considered the authoritative record.

Serious analysis typically starts with the release for a quick read and moves into the filing for depth, particularly when reviewing [how to read an income statement](how-to-read-an-income-statement).

## What's Typically Inside

Most earnings reports include:

- **Revenue and net income** for the period, usually compared with the prior-year period.
- **Earnings per share (EPS)**, both basic and diluted — see our full explainer on [earnings per share](earnings-per-share-eps-explained).
- **A breakdown by business segment or geography**, for companies with multiple lines of business.
- **Management discussion and analysis**, offering context on what drove the numbers.
- **Forward guidance**, when a company chooses to provide it.

## Why It Matters So Much to Markets

Stock prices are, in large part, a reflection of collective expectations about a company's future profitability. An earnings report is one of the few scheduled moments when those expectations are tested against real, disclosed results. That's why earnings reports — even for well-established, slow-moving businesses — can trigger outsized price reactions relative to other news events.

> [!INFO] A company doesn't need to report a loss for its stock to fall on earnings day. If results simply fall short of what the market had already priced in, the reaction can still be negative.

## Who Reads Earnings Reports — and Why

- **Individual investors** use them to decide whether to buy, hold, or sell a position.
- **Analysts** build financial models and price targets from the detailed figures.
- **Employees and job seekers** gauge company stability and growth.
- **Competitors** benchmark their own performance against industry peers.
- **Lenders and credit analysts** assess a company's ability to service debt.

## Common Mistakes

- Confusing the short press release with the full, more detailed regulatory filing.
- Assuming an earnings report only matters to professional investors.
- Skipping the management commentary and reading only the numbers.
- Not checking whether figures are compared against the right prior period.

## Expert Tips

- Bookmark a company's investor relations page rather than relying solely on secondhand summaries of its results.
- Read the full press release first, then move into the formal filing if a specific line item needs more detail.
- Note the exact fiscal period being reported — a "Q1" label means different calendar months for different companies.
- Treat the first quarter you read for a new company as a baseline, then compare every subsequent report against it to build a real trend line.

## Conclusion

An earnings report is far more than a number on a screen — it's a structured, regulated disclosure that anchors how markets evaluate a company's performance every quarter. Understanding its structure and purpose sets the stage for deeper skills, from reading [earnings per share](earnings-per-share-eps-explained) to interpreting [revenue vs earnings](revenue-vs-earnings-explained) with real confidence.`,
    },

    {
      slug: 'earnings-per-share-eps-explained',
      title: 'Earnings Per Share (EPS) Explained',
      metaTitle: 'Earnings Per Share (EPS) Explained Simply',
      metaDescription: 'Learn what earnings per share (EPS) means, how it is calculated, the difference between basic and diluted EPS, and why it matters to investors.',
      excerpt: 'EPS distills a company’s profit into a single per-share number. Here is how it is calculated and why it is one of the most-watched figures in investing.',
      focusKeyword: 'earnings per share eps explained',
      secondaryKeywords: ['what is eps', 'basic vs diluted eps', 'eps formula', 'eps meaning in stocks'],
      longTailKeywords: ['how is earnings per share calculated', 'why does eps matter to investors', 'what is diluted eps'],
      searchIntent: 'Informational — investors wanting to understand a core earnings metric before comparing companies.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Earnings Metrics',
      tags: ['eps', 'earnings per share', 'earnings metrics'],
      heroImagePrompt: 'Realistic professional photograph of a financial analyst calculating figures on a calculator next to a laptop displaying a per-share earnings chart, modern office, natural light, corporate finance publication quality, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of a calculator and pen resting on a printed spreadsheet of per-share financial figures, editorial style, no logos, no readable text, 16:9',
      coverImageAlt: 'Analyst calculating earnings per share figures at a desk',
      thumbnailAlt: 'Calculator and financial spreadsheet showing per-share figures',
      imageFileName: 'eps-explained.jpg',
      keyTakeaways: [
        'EPS divides a company’s net income (minus preferred dividends) by its weighted average number of outstanding shares.',
        'Basic EPS uses actual shares outstanding; diluted EPS accounts for shares that could be created from options, warrants, or convertible securities.',
        'EPS lets investors compare profitability on a per-share basis, which matters more to a shareholder than total net income alone.',
        'Share buybacks can raise EPS even if net income stays flat, simply by reducing the share count in the denominator.',
        'EPS should be viewed alongside revenue and margin trends, not treated as a complete measure of company health on its own.',
      ],
      internalLinks: [
        { slug: 'earnings-reports-complete-guide', anchor: 'complete guide to earnings reports' },
        { slug: 'gaap-vs-non-gaap-earnings', anchor: 'GAAP vs non-GAAP earnings' },
        { slug: 'revenue-vs-earnings-explained', anchor: 'revenue vs earnings' },
        { slug: 'what-is-an-earnings-report', anchor: 'what an earnings report is' },
      ],
      faq: [
        { question: 'What does EPS stand for?', answer: 'EPS stands for earnings per share, a measure of how much of a company’s profit is attributable to each individual outstanding share of its stock.' },
        { question: 'How is EPS calculated?', answer: 'EPS is calculated by taking net income, subtracting any preferred dividends owed, and dividing the result by the weighted average number of shares outstanding during the period.' },
        { question: 'What is the difference between basic and diluted EPS?', answer: 'Basic EPS uses the actual number of shares currently outstanding, while diluted EPS also factors in shares that could be created from stock options, warrants, or convertible securities, producing a more conservative figure.' },
        { question: 'Why do companies report both basic and diluted EPS?', answer: 'Reporting both gives investors a fuller picture — basic EPS reflects current ownership, while diluted EPS shows what profitability per share would look like if all potential dilutive securities were exercised or converted.' },
        { question: 'Can EPS rise even if net income stays the same?', answer: 'Yes. If a company reduces its share count through buybacks, the same net income is divided across fewer shares, which mechanically increases EPS without any underlying change in profitability.' },
        { question: 'Is a higher EPS always better?', answer: 'Generally more profit per share is favorable, but EPS should be evaluated alongside revenue growth, margins, and share count trends, since it can be influenced by financial engineering as well as genuine operating performance.' },
        { question: 'How is EPS used in stock valuation?', answer: 'EPS is a core input in valuation metrics such as the price-to-earnings ratio, which compares a stock’s price to its per-share earnings to gauge how expensive a stock is relative to its profitability.' },
        { question: 'What is adjusted or non-GAAP EPS?', answer: 'Adjusted EPS excludes certain items management considers non-recurring or non-representative of core operations, which can differ meaningfully from GAAP EPS — see our guide on GAAP vs non-GAAP earnings for more detail.' },
        { question: 'Does EPS account for dividends paid to common shareholders?', answer: 'EPS reflects earnings available to common shareholders after preferred dividends are subtracted, but it does not represent cash actually distributed to common shareholders as dividends.' },
        { question: 'Why do analysts focus so heavily on EPS estimates?', answer: 'EPS is a standardized, comparable figure across companies and time periods, making it a convenient benchmark for analysts to forecast and for markets to judge whether a company beat or missed expectations.' },
      ],
      markdown: `Few figures get more attention on earnings day than **earnings per share**, commonly abbreviated EPS. It condenses a company's entire quarterly profit into a single per-share number — but understanding what actually goes into that number is essential before treating it as a shortcut for company quality.

## What EPS Measures

EPS answers a simple question: for every single share of stock outstanding, how much profit did the company generate? It translates total company-level profit into a per-share figure that's directly comparable to the stock's price and to other companies' per-share profitability.

## The EPS Formula

The basic formula is:

**EPS = (Net Income − Preferred Dividends) ÷ Weighted Average Shares Outstanding**

Preferred dividends are subtracted first because that portion of profit belongs to preferred shareholders, not common shareholders. The weighted average share count accounts for shares issued or repurchased at different points during the period, rather than using a single snapshot date.

## Basic EPS vs Diluted EPS

| Metric | What it includes |
| --- | --- |
| Basic EPS | Actual shares currently outstanding |
| Diluted EPS | Basic shares plus shares that could be created from stock options, warrants, restricted stock units, or convertible securities |

Diluted EPS is almost always equal to or lower than basic EPS, since it assumes additional shares could enter circulation. Companies with significant stock-based compensation or convertible debt often show a meaningful gap between the two figures, making diluted EPS the more conservative and often more informative measure.

## Why Share Buybacks Complicate EPS

Because EPS divides profit by share count, reducing the number of shares outstanding — for example, through a share buyback program — mechanically raises EPS even if net income doesn't grow at all.

> [!INFO] A rising EPS driven mainly by a shrinking share count is a different story than one driven by genuine growth in net income. Both can produce the same headline number, but they reflect very different underlying business dynamics.

This is one reason experienced investors look beyond the EPS headline and check whether growth is coming from real operating improvement or financial engineering.

## EPS and Stock Valuation

EPS is the denominator's counterpart in one of the most widely used valuation tools in investing: the price-to-earnings ratio, which divides a stock's price by its EPS to show how much investors are paying for each dollar of profit. Because EPS feeds directly into this and other valuation metrics, small differences in how EPS is calculated or adjusted can meaningfully change how "expensive" or "cheap" a stock appears.

## GAAP EPS vs Adjusted EPS

Companies frequently report both a standardized GAAP EPS figure and an adjusted, non-GAAP version that excludes items management considers unusual or non-recurring, such as restructuring charges or one-time gains. The two can diverge significantly. Our guide to [GAAP vs non-GAAP earnings](gaap-vs-non-gaap-earnings) explains how to interpret both responsibly.

## Common Mistakes

- Treating EPS growth as automatically synonymous with genuine business growth.
- Ignoring the gap between basic and diluted EPS for companies with heavy stock-based compensation.
- Comparing EPS across companies with very different capital structures without adjusting for context.
- Focusing on EPS in isolation instead of alongside [revenue trends](revenue-vs-earnings-explained).

## Expert Tips

- Always check whether a reported EPS figure is basic or diluted before comparing it against a prior period or a competitor.
- Track a company's share count over several years, not just one quarter, to see whether buybacks are a persistent trend or a one-off event.
- When EPS growth outpaces revenue growth by a wide margin, dig into whether margin expansion or share buybacks are doing the heavy lifting.
- Use EPS trends alongside net income trends, since the two can diverge meaningfully once share count changes are factored in.

## Conclusion

EPS is a genuinely useful shorthand for per-share profitability, but it's a shorthand — not the full story. Understanding how it's calculated, why basic and diluted figures differ, and how buybacks and accounting adjustments can shape the number equips you to read it with the right amount of skepticism rather than taking it at face value.`,
    },

    {
      slug: 'gaap-vs-non-gaap-earnings',
      title: "GAAP vs Non-GAAP Earnings: What's the Difference",
      metaTitle: 'GAAP vs Non-GAAP Earnings: What’s the Difference?',
      metaDescription: 'Understand the difference between GAAP and non-GAAP (adjusted) earnings, why companies report both, and how to evaluate each responsibly.',
      excerpt: 'Companies often report two versions of their profit. Here is what separates standardized GAAP earnings from adjusted non-GAAP figures.',
      focusKeyword: 'gaap vs non-gaap earnings',
      secondaryKeywords: ['gaap earnings', 'non-gaap earnings', 'adjusted earnings', 'pro forma earnings'],
      longTailKeywords: ['what is the difference between gaap and non-gaap earnings', 'why do companies report adjusted earnings', 'is non-gaap earnings misleading'],
      searchIntent: 'Informational — investors wanting to interpret two competing profit figures reported in the same earnings release.',
      audience: ['Intermediate', 'Professional'],
      subcategory: 'Earnings Accounting',
      tags: ['gaap', 'non-gaap', 'adjusted earnings', 'accounting standards'],
      heroImagePrompt: 'Realistic professional photograph of two side-by-side financial summary sheets on a desk, one labeled with standard figures and one with adjusted figures, magnifying glass resting nearby, editorial finance photography, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic close-up photo of a financial reconciliation spreadsheet with two profit columns on a desk, editorial style, no logos, no readable text, 16:9',
      coverImageAlt: 'Two financial summary sheets being compared with a magnifying glass',
      thumbnailAlt: 'Financial reconciliation spreadsheet comparing two profit figures',
      imageFileName: 'gaap-vs-non-gaap-earnings.jpg',
      keyTakeaways: [
        'GAAP earnings follow standardized accounting rules set by the Financial Accounting Standards Board, allowing consistent comparison across companies.',
        'Non-GAAP (adjusted) earnings exclude items management considers non-recurring or not reflective of core operations.',
        'Common adjustments include stock-based compensation, restructuring charges, impairments, and one-time gains or losses.',
        'Regulators generally require companies to reconcile non-GAAP figures back to the nearest GAAP measure.',
        'Neither figure is inherently "correct" — each serves a different analytical purpose when used with proper context.',
        'A consistent pattern of large, recurring "one-time" adjustments can be a red flag worth investigating further.',
      ],
      internalLinks: [
        { slug: 'earnings-reports-complete-guide', anchor: 'complete guide to earnings reports' },
        { slug: 'earnings-per-share-eps-explained', anchor: 'earnings per share explained' },
        { slug: 'how-to-read-an-income-statement', anchor: 'how to read an income statement' },
        { slug: 'what-is-an-earnings-report', anchor: 'what an earnings report is' },
      ],
      faq: [
        { question: 'What does GAAP stand for?', answer: 'GAAP stands for Generally Accepted Accounting Principles, the standardized set of accounting rules and conventions used in the United States, maintained by the Financial Accounting Standards Board.' },
        { question: 'What is non-GAAP earnings?', answer: 'Non-GAAP earnings, sometimes called adjusted or pro forma earnings, are a company’s own alternative profit figure that excludes certain items management believes distort the picture of core operating performance.' },
        { question: 'Why do companies report non-GAAP figures at all?', answer: 'Companies argue that certain costs — such as one-time restructuring charges or non-cash stock compensation — obscure the underlying trend in the business, so they present an adjusted figure to highlight what they consider ongoing operational performance.' },
        { question: 'What items are commonly excluded in non-GAAP earnings?', answer: 'Frequent exclusions include stock-based compensation expense, restructuring and severance costs, impairment charges, merger and acquisition costs, and gains or losses from asset sales.' },
        { question: 'Is it legal for companies to report non-GAAP figures?', answer: 'Yes, but regulators such as the SEC require companies to present the comparable GAAP figure with equal or greater prominence and to reconcile the non-GAAP figure back to it, to prevent misleading disclosures.' },
        { question: 'Which figure should investors trust more, GAAP or non-GAAP?', answer: 'Neither should be trusted blindly — GAAP offers consistency and comparability, while non-GAAP can offer useful insight into recurring operations, but only when the adjustments are reasonable and reviewed critically rather than accepted at face value.' },
        { question: 'Can non-GAAP adjustments be misleading?', answer: 'Yes, particularly when companies repeatedly label genuinely recurring costs as "one-time" items quarter after quarter, which can flatter adjusted earnings while understating real, ongoing expenses.' },
        { question: 'How do stock-based compensation adjustments affect non-GAAP earnings?', answer: 'Excluding stock-based compensation, a very common non-GAAP adjustment, raises reported adjusted profit even though this compensation represents a real economic cost that dilutes existing shareholders over time.' },
        { question: 'How can I compare GAAP and non-GAAP figures myself?', answer: 'Earnings releases typically include a reconciliation table showing the specific adjustments made to move from the GAAP figure to the non-GAAP figure, which is worth reviewing line by line rather than skipping.' },
        { question: 'Does every country use GAAP?', answer: 'GAAP is primarily a U.S. accounting standard; many other countries use International Financial Reporting Standards (IFRS), which share similar goals of standardization but differ in specific rules.' },
      ],
      markdown: `Open almost any earnings release and you'll often find two different profit figures for the same quarter. Understanding **GAAP vs non-GAAP earnings** — and why companies report both — is essential to avoid being misled by whichever number looks more favorable.

## What GAAP Earnings Are

GAAP stands for Generally Accepted Accounting Principles, a standardized rulebook maintained by the Financial Accounting Standards Board (FASB) that governs how U.S. companies must record and report financial results. Because every public company follows the same core rules, GAAP earnings are directly comparable across companies and time periods — a foundational strength that makes them the baseline figure used in official regulatory filings.

## What Non-GAAP Earnings Are

Non-GAAP earnings, also called adjusted or pro forma earnings, are a company's own alternative calculation of profit that excludes specific items management believes obscure the "true" trend in the underlying business. Because there's no single standardized formula for these adjustments, non-GAAP figures can vary widely in how conservative or aggressive they are from one company to the next.

## Common Adjustments

| Adjustment type | Why companies exclude it |
| --- | --- |
| Stock-based compensation | Considered a non-cash expense, though it is a real cost to shareholders |
| Restructuring or severance charges | Framed as one-time, not part of ongoing operations |
| Impairment charges | Non-cash write-downs of asset value |
| Merger and acquisition costs | Deal-related expenses seen as outside normal operations |
| Gains or losses on asset sales | One-off items unrelated to core business performance |

## Why This Matters for Investors

Non-GAAP earnings are frequently higher than GAAP earnings, since the adjustments almost always remove expenses rather than add them back. That means the two figures can tell noticeably different stories about how profitable a company really is in a given quarter.

> [!WARNING] When a company's non-GAAP earnings consistently and significantly exceed its GAAP earnings quarter after quarter, it's worth investigating what's being excluded — recurring "one-time" charges may not be as one-time as the label suggests.

## Regulatory Guardrails

In the U.S., the SEC requires that companies reporting non-GAAP figures also present the comparable GAAP measure with equal or greater prominence, and provide a clear reconciliation between the two. This reconciliation table — usually near the end of the earnings release — is one of the most informative sections for investors who want to understand exactly what was excluded and why.

## How to Use Both Figures Responsibly

- Read the reconciliation table before accepting either figure at face value.
- Track whether the same types of adjustments recur every quarter, which weakens the "one-time" justification.
- Compare GAAP and non-GAAP [EPS](earnings-per-share-eps-explained) side by side rather than quoting only one.
- Use GAAP figures as the primary basis for cross-company comparison, since the standardized rules make them more consistent.

## Common Mistakes

- Assuming non-GAAP earnings are inherently manipulative — many adjustments are reasonable and genuinely improve comparability.
- Assuming GAAP earnings are always the "real" number without considering that some GAAP items, like large non-cash impairments, can distort a single quarter.
- Skipping the reconciliation table and relying only on the headline adjusted figure reported in press coverage.

## Expert Tips

- Read the reconciliation table line by line at least once for any company you follow closely, rather than trusting a summarized adjusted figure.
- Watch how the size of the gap between GAAP and non-GAAP earnings changes over time — a widening gap deserves closer scrutiny.
- Compare a company's adjustment practices with its closest industry peers, since some sectors have more standardized conventions than others.
- When in doubt, default to the GAAP figure for cross-company comparisons, and use the non-GAAP figure only to understand management's own framing.

## Conclusion

Neither GAAP nor non-GAAP earnings tells the complete story on its own. GAAP offers standardized comparability across companies, while non-GAAP can offer useful insight into recurring operations — but only when its adjustments are reasonable, consistent, and reviewed with a critical eye rather than accepted automatically. Pairing this understanding with a careful read of [the income statement](how-to-read-an-income-statement) gives you a far more complete view of true profitability.`,
    },

    {
      slug: 'how-to-read-an-income-statement',
      title: 'How to Read an Income Statement',
      metaTitle: 'How to Read an Income Statement (Step by Step)',
      metaDescription: 'A step-by-step guide to reading a company income statement — from revenue and cost of goods sold down to net income — for everyday investors.',
      excerpt: 'The income statement tells you how a company turned sales into profit. Here is how to read it line by line.',
      focusKeyword: 'how to read an income statement',
      secondaryKeywords: ['income statement explained', 'profit and loss statement', 'gross profit vs net income', 'operating income'],
      longTailKeywords: ['what is an income statement in simple terms', 'how to read a company profit and loss statement', 'difference between gross profit and net income'],
      searchIntent: 'Informational/how-to — investors wanting a practical walkthrough of a core financial statement.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Financial Statements',
      tags: ['income statement', 'financial statements', 'profit and loss'],
      heroImagePrompt: 'Realistic professional photograph of an investor highlighting line items on a printed income statement with a highlighter pen, laptop in the background, natural office lighting, corporate finance publication quality, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of a highlighted financial statement page with a pen resting across it on a wooden desk, editorial style, no logos, no readable text, 16:9',
      coverImageAlt: 'Investor highlighting line items on a printed income statement',
      thumbnailAlt: 'Highlighted income statement document on a desk',
      imageFileName: 'how-to-read-income-statement.jpg',
      keyTakeaways: [
        'The income statement shows how a company’s revenue turns into profit (or loss) over a specific period.',
        'It flows in order from revenue, to gross profit, to operating income, to net income, subtracting different categories of cost along the way.',
        'Gross profit reflects revenue minus the direct cost of producing goods or services sold.',
        'Operating income reflects profit from core business operations, before interest and taxes.',
        'Net income is the "bottom line" — what remains after every expense, including taxes and interest, has been subtracted.',
      ],
      internalLinks: [
        { slug: 'earnings-reports-complete-guide', anchor: 'complete guide to earnings reports' },
        { slug: 'revenue-vs-earnings-explained', anchor: 'revenue vs earnings' },
        { slug: 'earnings-per-share-eps-explained', anchor: 'earnings per share explained' },
        { slug: 'gaap-vs-non-gaap-earnings', anchor: 'GAAP vs non-GAAP earnings' },
      ],
      faq: [
        { question: 'What is an income statement?', answer: 'An income statement, sometimes called a profit and loss statement, is a financial report showing a company’s revenue, expenses, and resulting profit or loss over a specific period, such as a fiscal quarter or year.' },
        { question: 'What is the first line of an income statement?', answer: 'The first line is typically total revenue, sometimes called net sales, representing all money earned from the company’s core business activities before any costs are subtracted.' },
        { question: 'What is gross profit?', answer: 'Gross profit is revenue minus the cost of goods sold (COGS) — the direct costs of producing the goods or delivering the services that generated that revenue.' },
        { question: 'What is operating income?', answer: 'Operating income is gross profit minus operating expenses, such as selling, general and administrative costs and research and development, reflecting profit from core operations before interest and taxes.' },
        { question: 'What is the difference between operating income and net income?', answer: 'Operating income reflects profit from core business operations alone, while net income also accounts for non-operating items such as interest expense, investment gains or losses, and taxes.' },
        { question: 'Why is net income called the "bottom line"?', answer: 'Net income appears as the final line of the income statement after every expense category has been subtracted, which is why it’s colloquially referred to as the bottom line.' },
        { question: 'What is the difference between the income statement and the balance sheet?', answer: 'The income statement shows performance over a period of time, while the balance sheet shows a snapshot of what a company owns and owes at a single point in time.' },
        { question: 'What are operating expenses?', answer: 'Operating expenses are the ongoing costs of running the business that aren’t directly tied to producing goods or services, such as marketing, administrative salaries, and research and development.' },
        { question: 'Can a company have rising revenue but falling net income?', answer: 'Yes — if costs grow faster than revenue, or if a company incurs large non-operating charges like interest expense or a write-down, net income can fall even as top-line revenue climbs.' },
        { question: 'How does the income statement relate to earnings per share?', answer: 'Net income, the final figure on the income statement, is the numerator used to calculate earnings per share once preferred dividends are subtracted and it’s divided by the weighted average share count.' },
      ],
      markdown: `Of all the documents inside an earnings report, the income statement is arguably the most important — and the most misread. Learning **how to read an income statement** means understanding how a business turns sales into profit, one line at a time.

## What the Income Statement Shows

The income statement, sometimes called a profit and loss statement, reports a company's financial performance over a defined period — a quarter or a full fiscal year. Unlike the balance sheet, which is a snapshot at a single moment, the income statement covers a stretch of time, showing the flow of money in and out of the business.

## The Structure, Step by Step

Most income statements follow a consistent top-to-bottom flow:

| Line item | What it represents |
| --- | --- |
| Revenue (net sales) | Total money earned from core business activity |
| − Cost of goods sold (COGS) | Direct costs of producing goods or services sold |
| = Gross profit | Revenue left after direct production costs |
| − Operating expenses | Marketing, admin, R&D, and other operating costs |
| = Operating income | Profit from core operations before interest and taxes |
| +/− Non-operating items | Interest expense, investment gains/losses, one-time items |
| = Pretax income | Profit before taxes are applied |
| − Taxes | Income tax expense for the period |
| = Net income | The company's final "bottom line" profit |

## Revenue: The Starting Point

Everything begins with revenue, also called net sales — the total amount earned from selling goods or services before any costs are removed. This is the figure most closely tracked for growth, but on its own it says nothing about profitability. See our companion guide on [revenue vs earnings](revenue-vs-earnings-explained) for why this distinction matters so much.

## Gross Profit: The First Profitability Checkpoint

Subtracting the cost of goods sold — the direct cost of producing what was sold — from revenue gives gross profit. This figure, and the gross margin percentage derived from it, shows how efficiently a company converts sales into profit before considering broader operating costs.

## Operating Income: Core Business Performance

After subtracting operating expenses like marketing, administrative overhead, and research and development from gross profit, you arrive at operating income. This figure isolates how profitable the core business is, stripped of financing decisions and tax effects — useful for comparing companies with different capital structures.

> [!INFO] Operating income is often considered a cleaner measure of core business health than net income, because it excludes interest expense and tax effects that can vary significantly for reasons unrelated to day-to-day operations.

## Net Income: The Bottom Line

Finally, after accounting for interest expense, investment gains or losses, one-time items, and taxes, you reach net income — the number most closely associated with a company's overall profitability, and the starting point for calculating [earnings per share](earnings-per-share-eps-explained).

## Common Mistakes

- Focusing only on the top (revenue) and bottom (net income) lines while skipping the middle, where margin trends actually live.
- Ignoring gross margin trends, which often reveal cost pressures before they show up in net income.
- Confusing operating income with net income when comparing companies with different debt loads or tax situations.
- Not checking whether reported figures are GAAP or non-GAAP — see our guide on [GAAP vs non-GAAP earnings](gaap-vs-non-gaap-earnings).

## Expert Tips

- Calculate gross margin and operating margin yourself each quarter rather than relying only on the headline dollar figures, since percentages reveal trends dollars alone can hide.
- Compare a company's income statement structure to close industry peers, since "normal" cost ratios vary significantly between sectors.
- Read the notes accompanying the income statement in the full filing when a specific line item looks unusual — the explanation is often there.
- Track how each major line item moves as a percentage of revenue over several quarters to catch shifts in cost structure early.

## Conclusion

The income statement tells the full story of how a company converts sales into profit, and reading it line by line — rather than jumping straight to the bottom — reveals far more than the headline numbers alone. Once this structure feels familiar, comparing income statements across quarters and companies becomes a genuinely powerful analytical habit.`,
    },

    {
      slug: 'earnings-season-calendar-explained',
      title: 'Understanding the Earnings Season Calendar',
      metaTitle: 'The Earnings Season Calendar Explained',
      metaDescription: 'Learn how the quarterly earnings season calendar works, why companies report in clusters, and how to track upcoming earnings dates.',
      excerpt: 'Earnings season follows a predictable, recurring rhythm each year. Here is how the calendar works and how to track it.',
      focusKeyword: 'earnings season calendar explained',
      secondaryKeywords: ['earnings season', 'quarterly earnings calendar', 'when do companies report earnings', 'fiscal quarter reporting'],
      longTailKeywords: ['what months are earnings season', 'why do companies report earnings around the same time', 'how to find upcoming earnings dates'],
      searchIntent: 'Informational — investors wanting to understand the timing and structure of quarterly earnings reporting.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Earnings Timing',
      tags: ['earnings season', 'reporting calendar', 'fiscal quarter'],
      heroImagePrompt: 'Realistic professional photograph of a wall calendar with several dates circled next to a laptop showing a stock watchlist, modern office desk, natural light, corporate finance publication quality, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of a desk calendar with a pen resting beside it and a blurred stock chart on a monitor in the background, editorial style, no logos, no readable text, 16:9',
      coverImageAlt: 'Calendar with circled dates beside a laptop showing a stock watchlist',
      thumbnailAlt: 'Desk calendar used for tracking earnings dates',
      imageFileName: 'earnings-season-calendar.jpg',
      keyTakeaways: [
        'Most public companies report earnings four times a year, roughly a few weeks after each fiscal quarter ends.',
        'Because many companies share a calendar-year fiscal schedule, reporting clusters into recurring multi-week windows known as earnings season.',
        'Large banks are often among the first companies to report each cycle, offering an early read on the broader economy.',
        'Not every company follows a calendar-year fiscal year, which shifts their reporting dates relative to the broader season.',
        'Company investor relations pages and financial exchanges publish confirmed or estimated earnings dates ahead of time.',
      ],
      internalLinks: [
        { slug: 'earnings-reports-complete-guide', anchor: 'complete guide to earnings reports' },
        { slug: 'what-is-an-earnings-call', anchor: 'what an earnings call is' },
        { slug: 'quarterly-vs-annual-reports', anchor: 'quarterly vs annual reports' },
        { slug: 'how-earnings-surprises-move-stocks', anchor: 'how earnings surprises move stocks' },
      ],
      faq: [
        { question: 'What is earnings season?', answer: 'Earnings season refers to the recurring multi-week windows, roughly four times a year, when a large concentration of public companies release their quarterly financial results.' },
        { question: 'How many times a year do companies report earnings?', answer: 'Most public companies report quarterly, meaning four times per fiscal year, plus a more comprehensive annual report covering the full fiscal year.' },
        { question: 'Why do so many companies report earnings around the same time?', answer: 'Many companies use a calendar-year fiscal schedule with quarters ending in March, June, September, and December, and tend to report a few weeks after each quarter closes, which naturally clusters reporting into recurring windows.' },
        { question: 'Which companies usually report first each earnings season?', answer: 'Large financial institutions are often among the earliest reporters each cycle, and their results are frequently watched as an early signal for the broader corporate reporting season ahead.' },
        { question: 'Do all companies use the same fiscal year?', answer: 'No. While many companies align their fiscal year with the calendar year, others use a fiscal year ending in a different month, which shifts when their quarterly reports land relative to the broader earnings season.' },
        { question: 'How can I find out when a company will report earnings?', answer: 'Companies typically announce their upcoming earnings date on their investor relations website in advance, and financial exchanges and market data providers also publish confirmed or estimated earnings calendars.' },
        { question: 'What is a "blackout period" related to earnings?', answer: 'A blackout period is a window before an earnings announcement during which company insiders are typically restricted from trading company stock, reducing the risk of trading on material non-public information.' },
        { question: 'Does earnings season affect the whole stock market, or just individual stocks?', answer: 'Both — individual stocks react to their own results, but heavy earnings weeks can also influence overall market volatility and sector-wide sentiment as investors process results from many companies at once.' },
        { question: 'What happens if a company delays its earnings report?', answer: 'A delayed earnings report can itself be a signal worth investigating, sometimes reflecting accounting complications, though delays can also stem from more routine administrative reasons.' },
        { question: 'Is earnings season the same every year?', answer: 'The general structure repeats each year — four recurring windows tied to fiscal quarter-ends — though specific dates shift slightly year to year based on weekends, holidays, and each company’s own schedule.' },
      ],
      markdown: `If you've ever noticed a sudden wave of stock-moving headlines every few months, you've witnessed **earnings season** in action. Understanding this recurring calendar helps investors anticipate — rather than be surprised by — some of the market's busiest and most volatile weeks.

## Why Reporting Clusters Into "Seasons"

Public companies generally report financial results a few weeks after each fiscal quarter closes. Because a large share of companies use a calendar-year fiscal schedule — with quarters ending in March, June, September, and December — their reporting windows naturally overlap, creating recurring multi-week stretches when a large volume of companies announce results in quick succession. This clustering is what the financial media refers to as earnings season.

## The General Rhythm

| Quarter end | Typical reporting window begins |
| --- | --- |
| March (Q1) | Mid-to-late April |
| June (Q2) | Mid-to-late July |
| September (Q3) | Mid-to-late October |
| December (Q4) / fiscal year-end | Mid-January through February |

These windows are approximate — individual companies set their own specific reporting dates, and the exact cadence shifts slightly year to year around weekends and holidays.

## Banks Often Report First

In many reporting cycles, large financial institutions are among the earliest companies to release results, in part because their businesses can close their books relatively quickly. Because banks' lending and trading activity is closely tied to overall economic conditions, their early results are often scrutinized as a preliminary signal for how the broader season might unfold — though no single sector's results guarantee what's ahead for the rest of the market.

## Not Every Company Follows the Calendar Year

Some companies use a fiscal year that ends in a month other than December — for example, a fiscal year ending in June. For these companies, "Q1" and "Q4" fall in different calendar months than companies on a standard calendar-year schedule, which shifts when their reports land relative to the broader earnings season. Always check a specific company's fiscal calendar rather than assuming it matches the majority pattern.

> [!INFO] The label "Q1," "Q2," "Q3," or "Q4" always refers to a company's own fiscal quarter, which may or may not align with the standard calendar quarter — always confirm the actual quarter-end date being reported.

## Tracking Upcoming Earnings Dates

- Check a company's **investor relations website**, where upcoming earnings dates are typically announced in advance.
- Use **earnings calendars** published by major exchanges and financial data providers.
- Watch for the company's own **guidance from the prior quarter's [earnings call](what-is-an-earnings-call)**, which sometimes references the next expected reporting date.

## Why the Calendar Matters to Investors

Knowing when a company is scheduled to report helps investors avoid being caught off guard by volatility, plan research and portfolio review around key dates, and understand why an entire sector's stocks might move together during a heavy reporting week even without company-specific news. It also helps distinguish a routine [quarterly report from the more comprehensive annual report](quarterly-vs-annual-reports).

## Common Mistakes

- Assuming every company reports on a calendar-year schedule.
- Confusing a company's internal fiscal quarter labels with standard calendar quarters.
- Ignoring the earnings calendar entirely and being surprised by sudden stock volatility.
- Assuming an early reporter's results predict how every other company's season will go.

## Expert Tips

- Set calendar reminders a few days ahead of any earnings date for stocks you hold, so you have time to review prior quarters before new results land.
- Note whether a company has historically reported earlier or later within its typical window, since some businesses are consistently early or late relative to peers.
- During the busiest weeks of earnings season, expect wider intraday volatility across the market generally, not just for the specific stocks reporting.
- Cross-check a company's self-reported upcoming date against a second source close to the release, since dates can occasionally shift.

## Conclusion

Earnings season isn't random — it's a predictable rhythm shaped by fiscal quarter-ends and reporting timelines that repeat every year. Understanding this cadence, and knowing where to check specific dates, turns what can feel like chaotic market noise into a calendar you can actually plan around.`,
    },

    {
      slug: 'what-is-an-earnings-call',
      title: 'What Is an Earnings Call and How to Follow One',
      metaTitle: 'What Is an Earnings Call? How to Follow One',
      metaDescription: 'Learn what an earnings call is, how it is structured, where to access one, and what to listen for as an individual investor.',
      excerpt: 'An earnings call is where numbers get context. Here is how these calls work and what to pay attention to.',
      focusKeyword: 'what is an earnings call',
      secondaryKeywords: ['earnings call explained', 'quarterly earnings call', 'how to listen to earnings calls', 'earnings call transcript'],
      longTailKeywords: ['what happens on a company earnings call', 'where can I listen to earnings calls', 'what is the q&a section of an earnings call'],
      searchIntent: 'Informational/how-to — investors wanting to understand and follow earnings calls directly.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Earnings Communication',
      tags: ['earnings call', 'investor relations', 'management commentary'],
      heroImagePrompt: 'Realistic professional photograph of an investor listening to a webcast earnings call on a laptop with a notepad and pen nearby, home office setting, warm natural light, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of headphones resting on a notebook beside a laptop displaying an audio waveform, editorial style, no logos, no readable text, 16:9',
      coverImageAlt: 'Investor listening to a company earnings call webcast on a laptop',
      thumbnailAlt: 'Headphones and notebook set up for listening to an earnings call',
      imageFileName: 'what-is-an-earnings-call.jpg',
      keyTakeaways: [
        'An earnings call is a scheduled conference call where company management discusses quarterly results and answers analyst questions.',
        'Calls typically begin with prepared remarks from the CEO and CFO, followed by a live question-and-answer session with analysts.',
        'Earnings calls are usually webcast publicly and often accompanied by a published transcript afterward.',
        'Fair disclosure regulations generally require material information to be shared broadly, not selectively, during these events.',
        'The Q&A section often reveals more nuance and risk detail than the scripted opening remarks.',
      ],
      internalLinks: [
        { slug: 'earnings-reports-complete-guide', anchor: 'complete guide to earnings reports' },
        { slug: 'what-is-forward-guidance', anchor: 'forward guidance' },
        { slug: 'earnings-season-calendar-explained', anchor: 'the earnings season calendar' },
        { slug: 'analyst-estimates-and-whisper-numbers', anchor: 'analyst estimates' },
      ],
      faq: [
        { question: 'What is an earnings call?', answer: 'An earnings call is a scheduled conference call, usually held shortly after a company releases its quarterly results, where executives discuss the results and answer questions from analysts.' },
        { question: 'Who typically speaks on an earnings call?', answer: 'The CEO and CFO usually lead the call, often joined by an investor relations representative who moderates the discussion and manages the analyst question queue.' },
        { question: 'How is an earnings call structured?', answer: 'Calls typically open with prepared remarks summarizing results and outlook, followed by a live question-and-answer session where analysts covering the stock ask follow-up questions directly to management.' },
        { question: 'Can individual investors listen to earnings calls?', answer: 'Yes, most earnings calls are webcast publicly and accessible through a company’s investor relations website, often with the option to listen live or access a recording afterward.' },
        { question: 'What is an earnings call transcript?', answer: 'A transcript is a written, word-for-word record of everything said during the call, which many investors use to review specific comments in detail rather than re-listening to the full audio.' },
        { question: 'Why is the Q&A section often more important than the prepared remarks?', answer: 'Prepared remarks are scripted and reviewed in advance, while the Q&A section involves live, unscripted responses to pointed analyst questions, often revealing more nuance, risk factors, or hesitation than the opening statement.' },
        { question: 'What is Regulation Fair Disclosure and how does it relate to earnings calls?', answer: 'In the U.S., Regulation FD generally requires companies to disclose material information broadly and simultaneously rather than selectively to certain analysts or investors, which is part of why calls are typically open to the public.' },
        { question: 'Who is allowed to ask questions during an earnings call?', answer: 'The live question period is typically reserved for analysts who formally cover the stock, though individual investors listening in can still hear every question and answer in real time.' },
        { question: 'What should I listen for during an earnings call?', answer: 'Pay attention to any change in tone or confidence from management, how directly questions are answered, updates to forward guidance, and any recurring themes analysts press on across multiple questions.' },
        { question: 'How soon after the earnings release does the call typically happen?', answer: 'Earnings calls are usually held the same day as the earnings release, often within an hour or two, giving investors and analysts a chance to react to the numbers and then hear management’s explanation shortly after.' },
      ],
      markdown: `Numbers alone rarely tell the full story of a quarter. That's where the **earnings call** comes in — the moment when company leadership steps in to explain the results, answer tough questions, and offer a window into how they see the business heading forward.

## What Happens on an Earnings Call

An earnings call is a scheduled conference call, typically held the same day an earnings report is released, where a company's leadership — usually the CEO and CFO — walks through the quarter's results and takes questions from analysts. It's one of the few recurring moments when investors can hear management respond to pointed, sometimes uncomfortable questions in real time rather than reading only a polished press release.

## The Typical Structure

Most earnings calls follow a consistent two-part format:

1. **Prepared remarks** — the CEO typically opens with a summary of the quarter's performance and strategic highlights, followed by the CFO, who walks through the financial details in more depth.
2. **Question-and-answer session** — analysts who formally cover the stock ask live, unscripted questions, and management responds in real time.

The prepared remarks are carefully reviewed and rehearsed in advance. The Q&A section is not — which is exactly why it's often the most revealing part of the call.

> [!INFO] Watch how management responds to a question they clearly didn't want to get. A confident, direct answer versus a vague, deflecting one can tell you as much as the actual content of the response.

## Where to Access Earnings Calls

Public companies are generally required to make material information available broadly rather than selectively, a principle behind fair disclosure regulations. In practice, this means earnings calls are typically:

- **Webcast live** and accessible through the company's investor relations website.
- **Recorded** for on-demand listening after the live call ends.
- **Transcribed**, with written transcripts published by the company or third-party financial data providers shortly afterward.

## What to Listen For

- **Changes in tone** compared with prior calls — growing confidence, hedging language, or noticeably cautious phrasing can all be meaningful signals.
- **Updates to guidance**, discussed further in our guide to [forward guidance](what-is-forward-guidance).
- **Recurring analyst questions**, which often signal a shared concern across the analyst community worth digging into further.
- **How directly questions are answered** — repeated deflection on a specific topic is itself informative.

## Analysts and Estimates

The analysts asking questions on the call are often the same ones who publish the estimates that determine whether a quarter is later described as a [beat or a miss](earnings-beat-vs-earnings-miss). Understanding how [analyst estimates and whisper numbers](analyst-estimates-and-whisper-numbers) work adds useful context to why certain questions get asked repeatedly on a call.

## Common Mistakes

- Skipping the call entirely and relying only on headline numbers from the press release.
- Reading only summarized coverage instead of the full transcript when a specific comment matters.
- Treating scripted opening remarks as equally revealing as the live Q&A session.
- Ignoring tone and phrasing changes compared with prior quarters' calls.

## Expert Tips

- Read the transcript alongside the audio when possible — seeing the exact wording can clarify nuance that's easy to miss by ear alone.
- Keep short notes across several consecutive calls so you can compare tone and specific phrasing quarter over quarter.
- Pay close attention to which analysts get called on and what topics they consistently press, since that often signals what the professional community is most focused on.
- Don't skip a call just because the headline numbers looked routine — some of the most useful context comes from otherwise unremarkable quarters.

## Conclusion

An earnings call turns a page of numbers into a conversation, offering context, nuance, and candor that a press release alone can't capture. Making a habit of listening to — or reading the transcript of — a company's earnings call adds a layer of understanding that pure number-reading simply can't replace.`,
    },

    {
      slug: 'earnings-beat-vs-earnings-miss',
      title: 'Earnings Beat vs Earnings Miss: How Stocks React',
      metaTitle: 'Earnings Beat vs Earnings Miss: How Stocks React',
      metaDescription: 'Learn what it means when a company beats or misses earnings estimates, and why stock reactions often depend on more than the numbers alone.',
      excerpt: 'A "beat" doesn’t always send a stock up, and a "miss" doesn’t always send it down. Here is why expectations drive the reaction more than the raw numbers.',
      focusKeyword: 'earnings beat vs earnings miss',
      secondaryKeywords: ['earnings beat', 'earnings miss', 'earnings surprise', 'beat expectations stock'],
      longTailKeywords: ['why does a stock fall after beating earnings', 'what does it mean to miss earnings estimates', 'how are earnings beats and misses determined'],
      searchIntent: 'Informational — investors trying to understand why stock reactions to earnings don’t always match the headline results.',
      audience: ['Beginner', 'Intermediate'],
      subcategory: 'Market Reaction',
      tags: ['earnings beat', 'earnings miss', 'stock reaction', 'analyst estimates'],
      heroImagePrompt: 'Realistic professional photograph of a stock price chart on a monitor showing a sharp move immediately after a scheduled earnings release marker, trading desk setting, natural light, corporate finance publication quality, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of a financial chart with a steep line movement displayed on a tablet resting on a desk, editorial style, no logos, no readable text, 16:9',
      coverImageAlt: 'Stock price chart showing a sharp move around an earnings release',
      thumbnailAlt: 'Financial chart displayed on a tablet showing a price move',
      imageFileName: 'earnings-beat-vs-miss.jpg',
      keyTakeaways: [
        'An earnings beat means results exceeded the average analyst estimate; a miss means results fell short of it.',
        'Stock reactions depend heavily on how results compare with expectations, not just whether they improved year over year.',
        'A company can beat estimates and still see its stock fall if guidance disappoints or the quality of the beat looks weak.',
        'A company can miss estimates and still see its stock rise if the miss was smaller than feared or guidance improves.',
        'Consensus estimates come from analysts covering the stock, and their accuracy varies by company and sector.',
      ],
      internalLinks: [
        { slug: 'earnings-reports-complete-guide', anchor: 'complete guide to earnings reports' },
        { slug: 'analyst-estimates-and-whisper-numbers', anchor: 'analyst estimates and whisper numbers' },
        { slug: 'what-is-forward-guidance', anchor: 'forward guidance' },
        { slug: 'how-earnings-surprises-move-stocks', anchor: 'how earnings surprises move stocks' },
        { slug: 'what-is-an-earnings-report', anchor: 'what an earnings report is' },
      ],
      faq: [
        { question: 'What does it mean when a company "beats earnings"?', answer: 'A company "beats earnings" when its reported revenue, earnings per share, or both come in higher than the average estimate compiled from analysts covering the stock.' },
        { question: 'What does it mean when a company "misses earnings"?', answer: 'A company "misses earnings" when its reported results fall short of the average analyst estimate, regardless of whether the results still represent growth compared with the prior year.' },
        { question: 'Why can a stock fall even after beating earnings estimates?', answer: 'A stock can fall after a beat if the company simultaneously issues disappointing forward guidance, if the beat was driven by unsustainable one-time factors, or if the size of the beat was smaller than investors had informally expected.' },
        { question: 'Why can a stock rise even after missing earnings estimates?', answer: 'A stock can rise after a miss if the shortfall was smaller than feared, if guidance for future periods improves, or if investors interpret the underlying trends as better than the headline miss suggests.' },
        { question: 'Who sets the estimates that determine a beat or a miss?', answer: 'Consensus estimates are typically compiled by aggregating forecasts from professional analysts who cover the stock, each independently modeling the company’s expected results before the report.' },
        { question: 'Is the size of a beat or miss important?', answer: 'Yes. A narrow beat or miss often produces a smaller stock reaction than a wide one, and markets also weigh whether the deviation came from revenue, margins, or one-time items.' },
        { question: 'What is a "whisper number"?', answer: 'A whisper number is an informal, unofficial estimate that some investors believe more accurately reflects true market expectations than the official consensus, though it is unverified and can vary by source — covered in depth in our guide to analyst estimates and whisper numbers.' },
        { question: 'Does an earnings beat guarantee long-term stock outperformance?', answer: 'No. A single quarter’s beat is only one data point, and longer-term stock performance depends far more on sustained business fundamentals, competitive position, and valuation than any individual earnings reaction.' },
        { question: 'How quickly does a stock react to an earnings beat or miss?', answer: 'Reactions often begin within seconds to minutes of the release, particularly for widely followed stocks, though the reaction can continue evolving throughout the trading session and the following earnings call.' },
        { question: 'Should I make investment decisions based only on a beat or miss?', answer: 'Relying solely on a single quarter’s beat or miss is risky; more durable decisions typically come from evaluating trends across several quarters alongside guidance, margins, and competitive positioning.' },
      ],
      markdown: `Ask most investors why a stock moved sharply after earnings, and the answer usually comes down to two words: beat or miss. But **earnings beat vs earnings miss** is a more nuanced concept than it first appears — and understanding it explains some of the market's most confusing short-term reactions.

## What "Beat" and "Miss" Actually Mean

A company "beats" earnings when its reported revenue, earnings per share, or both come in above the average estimate compiled from analysts covering the stock — known as the consensus estimate. A "miss" is the opposite: results fall short of that same consensus figure. Crucially, this comparison is against expectations, not necessarily against the company's own prior-year results.

## Why Expectations Matter More Than Raw Numbers

Stock prices are forward-looking — they already reflect what investors collectively expect a company to report. By the time an earnings report is released, much of the anticipated outcome is already "priced in." That's why the market reaction hinges on the gap between what actually happened and what was already expected, not simply whether results grew.

| Scenario | Common stock reaction pattern |
| --- | --- |
| Beat estimates + raised guidance | Often positive |
| Beat estimates + disappointing guidance | Can still be negative |
| Miss estimates + smaller-than-feared shortfall | Can be positive if guidance holds or improves |
| Miss estimates + weak guidance | Often negative |

## Why a "Beat" Can Still Send a Stock Down

This is one of the most common sources of investor confusion. A company can report record revenue and higher-than-expected profit and still watch its stock fall the same day. This typically happens when:

- **Guidance for the next quarter or year disappoints**, overshadowing the historical beat — see our guide to [forward guidance](what-is-forward-guidance).
- **The quality of the beat looks weak**, such as being driven by a one-time tax benefit rather than core operations.
- **Informal expectations — sometimes called [whisper numbers](analyst-estimates-and-whisper-numbers)** — were higher than the official consensus, meaning the "beat" still fell short of what active traders had actually priced in.

> [!INFO] The market doesn't just ask "did results improve?" It asks "did results improve by more, or less, than what was already expected?" That second question usually drives the immediate price reaction.

## Why a "Miss" Can Still Send a Stock Up

The reverse is equally common. A company can report a genuine earnings miss and still see its stock rise if:

- The shortfall is smaller than the market had informally feared going into the report.
- Forward guidance improves or reassures investors despite the current quarter's weakness.
- Management addresses a known concern convincingly during the [earnings call](what-is-an-earnings-call).

## How to Think About This as an Investor

Rather than reacting purely to beat/miss headlines, look at the full picture: the size of the beat or miss, whether it came from revenue or margins, how guidance changed, and what management said on the call. For more on how these individual pieces combine into larger price swings, see our guide on [how earnings surprises move stocks](how-earnings-surprises-move-stocks).

## Common Mistakes

- Assuming a beat automatically means a stock will rise, or a miss automatically means it will fall.
- Ignoring guidance changes that often matter more than the historical quarter.
- Treating a single quarter's beat or miss as a verdict on the company's long-term quality.
- Overlooking the difference between the official consensus estimate and informal whisper numbers.

## Expert Tips

- Read past the headline beat/miss label and check whether the surprise came from revenue, margins, or a one-time item, since each tells a different story.
- Pay close attention to guidance changes alongside the beat or miss — markets are forward-looking, and updated guidance often carries more weight than the historical quarter.
- Track a company's beat/miss pattern over several consecutive quarters rather than reacting to any single result in isolation.
- Remember that short-term price reactions around earnings can reverse in the days or weeks that follow, once the market has had time to digest the full report.

## Conclusion

Earnings beats and misses are measured against expectations, not against some absolute standard of "good" or "bad" — which is exactly why stock reactions can seem to defy the headline numbers. Learning to weigh the size of the surprise, the quality behind it, and the accompanying guidance gives you a far more accurate read than the beat/miss label alone.`,
    },

    {
      slug: 'revenue-vs-earnings-explained',
      title: 'Revenue vs Earnings: Understanding the Difference',
      metaTitle: 'Revenue vs Earnings: What’s the Real Difference?',
      metaDescription: 'Understand the difference between revenue and earnings, why a company can grow sales while profit shrinks, and why both figures matter.',
      excerpt: 'Revenue and earnings are often confused, but they measure very different things. Here is how to tell them apart and why both matter.',
      focusKeyword: 'revenue vs earnings explained',
      secondaryKeywords: ['revenue vs profit', 'revenue vs net income', 'top line vs bottom line', 'sales vs earnings'],
      longTailKeywords: ['what is the difference between revenue and earnings', 'can a company have high revenue and low profit', 'why does revenue growth not always mean profit growth'],
      searchIntent: 'Informational — investors confusing two commonly conflated financial terms.',
      audience: ['Beginner'],
      subcategory: 'Earnings Fundamentals',
      tags: ['revenue', 'earnings', 'net income', 'profit margin'],
      heroImagePrompt: 'Realistic professional photograph of two simple bar chart printouts side by side on a desk, one taller labeled as sales and one shorter representing profit, natural office lighting, corporate finance publication quality, no text overlays, no logos, 16:9',
      socialImagePrompt: 'Realistic photo of two contrasting bar chart printouts resting on a wooden desk beside a pen, editorial style, no logos, no readable text, 16:9',
      coverImageAlt: 'Two bar chart printouts comparing revenue and profit',
      thumbnailAlt: 'Bar chart printouts illustrating revenue versus profit',
      imageFileName: 'revenue-vs-earnings.jpg',
      keyTakeaways: [
        'Revenue (the "top line") is total money earned from sales before any costs are subtracted.',
        'Earnings, or net income (the "bottom line"), is what remains after every expense, tax, and interest cost is subtracted from revenue.',
        'A company can grow revenue while earnings shrink if costs rise faster than sales.',
        'Profit margin — earnings divided by revenue — shows how efficiently a company converts sales into profit.',
        'Evaluating both revenue and earnings trends together gives a far more complete picture than looking at either alone.',
      ],
      internalLinks: [
        { slug: 'earnings-reports-complete-guide', anchor: 'complete guide to earnings reports' },
        { slug: 'how-to-read-an-income-statement', anchor: 'how to read an income statement' },
        { slug: 'gaap-vs-non-gaap-earnings', anchor: 'GAAP vs non-GAAP earnings' },
        { slug: 'earnings-per-share-eps-explained', anchor: 'earnings per share explained' },
      ],
      faq: [
        { question: 'What is the difference between revenue and earnings?', answer: 'Revenue is the total amount of money a company brings in from sales before any costs are subtracted, while earnings, or net income, is what remains after every expense, tax, and interest cost has been deducted from that revenue.' },
        { question: 'Why is revenue called the "top line"?', answer: 'Revenue is called the top line because it appears as the first line item at the top of the income statement, before any costs are subtracted.' },
        { question: 'Why is net income called the "bottom line"?', answer: 'Net income is called the bottom line because it appears as the final calculated figure at the bottom of the income statement, after all expenses have been subtracted from revenue.' },
        { question: 'Can a company have rising revenue but falling earnings?', answer: 'Yes. If a company’s costs — such as production expenses, wages, or interest payments — grow faster than its sales, net income can fall even while revenue continues to climb.' },
        { question: 'What is profit margin and how does it relate to revenue and earnings?', answer: 'Profit margin is earnings divided by revenue, expressed as a percentage, and it shows how much of every dollar in sales a company actually keeps as profit after all costs.' },
        { question: 'Is revenue growth or earnings growth more important?', answer: 'Both matter, but for different reasons — revenue growth shows demand for a company’s products or services, while earnings growth shows whether that demand is translating into actual profitability.' },
        { question: 'Can a company be profitable with declining revenue?', answer: 'Yes, if a company cuts costs meaningfully or improves efficiency, it can grow earnings even while revenue declines, though this is generally not sustainable as a long-term strategy on its own.' },
        { question: 'How do analysts use revenue and earnings together?', answer: 'Analysts often examine both figures together, along with margin trends, to distinguish between genuine, sustainable growth and growth that is masking underlying cost or pricing problems.' },
        { question: 'Does higher revenue always mean a company is doing better?', answer: 'Not necessarily. Revenue reflects sales volume and pricing, but without examining costs and margins alongside it, rising revenue alone doesn’t confirm that a company’s overall financial health is improving.' },
        { question: 'Where can I find both revenue and earnings in an earnings report?', answer: 'Both figures appear on the income statement — revenue at the top and net income at the bottom — with all the cost categories in between explaining the gap between the two.' },
      ],
      markdown: `It's one of the most common mix-ups in investing: hearing that a company had a "great quarter" because sales were up, without asking whether it actually made more money. Understanding **revenue vs earnings** clears up this confusion and reveals why the two figures can tell very different stories.

## Revenue: The Top Line

Revenue — sometimes called net sales — is the total amount of money a company generates from its core business activities during a given period, before subtracting any costs. It sits at the very top of the income statement, which is why it's commonly referred to as the "top line." Revenue growth generally reflects rising demand, successful pricing strategy, or expansion into new markets or products.

## Earnings: The Bottom Line

Earnings, more formally called net income, is what remains after every single expense has been subtracted from revenue — the cost of producing goods or services, operating expenses like marketing and administration, interest on debt, and taxes. Because it's the final calculated figure at the end of the income statement, it's commonly called the "bottom line." For a full walkthrough of everything that happens between the two, see our guide on [how to read an income statement](how-to-read-an-income-statement).

## A Simple Illustration

Consider a hypothetical company, Company A, across two quarters:

| Metric | Quarter 1 | Quarter 2 |
| --- | --- | --- |
| Revenue | $100 million | $120 million |
| Total costs and expenses | $80 million | $105 million |
| Net income (earnings) | $20 million | $15 million |

Even though Company A's revenue grew 20% between the two quarters, its earnings actually fell, because costs grew even faster. A reader who only checked the revenue headline would have missed the more important story entirely.

## Why This Gap Happens

Revenue and earnings can diverge for many reasons, including:

- **Rising input or production costs** that outpace price increases.
- **Increased spending on marketing, staffing, or research and development.**
- **Higher interest expense** from increased borrowing.
- **One-time charges**, such as restructuring costs or legal settlements.
- **Pricing pressure** from competitors that forces margins lower even as volume grows.

> [!WARNING] Revenue growth funded by aggressive discounting or unsustainable spending can look impressive on the surface while quietly eroding profitability underneath. Always check the earnings trend alongside the revenue trend.

## Profit Margin: Connecting the Two

Profit margin — earnings divided by revenue — expresses how much of every dollar in sales a company actually converts into profit. Tracking margin trends over several quarters is one of the most reliable ways to spot whether revenue growth is translating into genuine business improvement or masking rising cost pressure.

## Why Both Figures Matter

- **Revenue** tells you whether demand for the company's products or services is growing.
- **Earnings** tells you whether that demand is actually profitable.
- **Margin trends** tell you whether the relationship between the two is improving or deteriorating over time.

This distinction also matters when interpreting [GAAP vs non-GAAP earnings](gaap-vs-non-gaap-earnings), since adjustments to earnings can further complicate a simple revenue-to-profit comparison, and it directly feeds into [earnings per share](earnings-per-share-eps-explained), which is calculated from net income, not revenue.

## Common Mistakes

- Treating strong revenue growth alone as proof of a healthy, improving business.
- Ignoring margin trends when comparing quarters or companies.
- Assuming falling revenue always means a company is struggling, without checking if earnings are actually improving through cost discipline.
- Comparing revenue growth at one company to earnings growth at another as if they were the same measure.

## Expert Tips

- Plot revenue and net income together over several quarters, rather than viewing either figure in a single isolated snapshot.
- Calculate profit margin yourself each quarter — dividing earnings by revenue — to spot gradual shifts before they become dramatic.
- When a company highlights strong revenue growth, look specifically for how it explains the corresponding change, or lack of change, in profitability.
- Compare margin trends against close industry peers to judge whether a company's profitability is improving in absolute terms or only relative to its own past performance.

## Conclusion

Revenue and earnings answer two different questions: how much did the company sell, and how much did it actually keep. Learning to track both together — rather than reacting to a single headline number — is one of the simplest, highest-value habits an investor can build when reading any earnings report.`,
    },
  ],
};
