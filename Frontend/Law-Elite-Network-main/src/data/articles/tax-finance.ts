import type { LawArticle } from '../law-content';

export const taxFinanceArticles: LawArticle[] = [
  {
    id: 'tf-001',
    title: 'Understanding Corporate Tax Basics',
    slug: 'understanding-corporate-tax-basics',
    alphabet: 'U',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_corporate',
    category: { id: 'cat_tax_finance', name: 'Tax & Finance', slug: 'tax-finance' },
    subcategory: { id: 'sub_tf_corporate', name: 'Corporate Tax', slug: 'corporate-tax' },
    summary:
      'A plain-language guide to how companies are taxed on their profits, the obligations involved, and why corporate tax rules vary widely between countries.',
    author: 'Priya Nair',
    updatedAt: 'March 14, 2026',
    readingTime: 9,
    views: 7420,
    featured: true,
    imageSeed: 'corporate-tax-ledger',
    content: `<p>Corporate tax is a charge that governments impose on the profits earned by companies and certain other legal entities. Unlike taxes on individuals, it applies to a business as a separate legal "person", which means the company itself files returns, calculates what it owes, and pays the tax — distinct from any tax later paid by its owners or shareholders. Understanding how this system works helps founders, finance teams, and investors anticipate obligations and avoid costly surprises.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Corporate tax is levied on a company's profits, not its total revenue — deductible costs are subtracted first.</li><li>Most systems tax resident companies on worldwide income and non-resident companies on locally sourced income.</li><li>Rates, allowances, and filing deadlines differ significantly across the US, UK, EU member states, and India.</li><li>Accurate record-keeping and timely filing are core compliance duties, and penalties for failure can be substantial.</li></ul></div>

<h2>What Corporate Tax Actually Taxes</h2>
<p>The starting point is usually accounting profit — revenue minus business expenses — which is then adjusted under tax law to arrive at "taxable profit". Tax rules rarely accept accounting figures unchanged. They add back items that are not deductible for tax purposes and allow specific reliefs that accounting standards do not recognise.</p>
<h3>Common Adjustments</h3>
<ul>
<li>Depreciation in the accounts is often replaced by a statutory capital allowance system.</li>
<li>Some entertainment, fines, and penalties may be disallowed as deductions.</li>
<li>Losses from earlier years can frequently be carried forward to reduce future taxable profit.</li>
</ul>

<h2>Residence and Source</h2>
<p>Two concepts decide where a company pays tax. Residence usually depends on where a company is incorporated or where its central management sits. Source refers to where income is actually generated. A resident company is commonly taxed on its worldwide profits, while a non-resident is typically taxed only on profits connected to that country.</p>
<h3>Why Double Taxation Treaties Matter</h3>
<p>Because two countries can both claim a right to tax the same profit, networks of bilateral treaties exist to allocate taxing rights and provide relief, often through credits or exemptions. Multinational groups rely heavily on these rules.</p>

<h2>Filing and Compliance Duties</h2>
<p>Running a company brings recurring obligations. While details differ by jurisdiction, the general shape is consistent worldwide.</p>
<ul>
<li>Maintain accurate books and supporting records for a legally required retention period.</li>
<li>Calculate taxable profit and submit a corporate tax return by the statutory deadline.</li>
<li>Pay tax due — sometimes in instalments or estimated payments throughout the year.</li>
<li>Disclose related-party and cross-border transactions where transfer-pricing rules apply.</li>
</ul>

<h2>How Jurisdictions Differ</h2>
<p>Approaches vary considerably, which is why generic advice can mislead. In the United States, federal corporate tax sits alongside separate state-level taxes, so a company may face several overlapping regimes. The United Kingdom operates a single corporation tax with its own allowance and loss rules. Across the European Union, each member state sets its own corporate rate and base, although shared directives influence areas such as parent-subsidiary distributions. India layers corporate income tax with surcharges and offers concessional regimes for certain newer companies.</p>
<p>Rates themselves change frequently with national budgets, so any specific percentage should be treated as illustrative and verified against current law rather than assumed.</p>

<h2>Common Pitfalls</h2>
<p>Many disputes arise not from aggressive planning but from avoidable errors. Misclassifying capital and revenue expenditure, missing instalment deadlines, and failing to document intra-group pricing are frequent triggers for assessments and penalties. Treating accounting profit as taxable profit without statutory adjustment is another recurring mistake.</p>

<h2>Transfer Pricing and the OECD BEPS Framework</h2>
<p>Multinational groups routinely transact between their own subsidiaries — one entity licensing intellectual property to another, or a manufacturing arm selling goods to a distribution arm in a different country. Because these are not arm's-length market transactions, tax authorities worldwide require such intra-group pricing to reflect what unrelated parties would have charged each other, a principle enforced through transfer-pricing rules. The OECD's Base Erosion and Profit Shifting (BEPS) project, adopted in some form by well over 100 jurisdictions, specifically targets arrangements that artificially shift profits into low-tax jurisdictions with little real economic activity. This has pushed most tax authorities toward requiring detailed transfer-pricing documentation as a matter of course, not just in an audit — a group operating across borders without this documentation in place is taking on meaningful, avoidable risk.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Can a company be taxed twice on the same profit in two countries?</strong> It can happen without protection, but double-tax treaties and unilateral relief mechanisms (foreign tax credits, exemptions) exist specifically to prevent this — checking whether a relevant treaty applies is a standard part of cross-border tax planning.</p>
<p><strong>Do tax losses expire if a company doesn't use them right away?</strong> It depends on the jurisdiction — many allow losses to be carried forward indefinitely against future profits, while others impose a time limit or restrict carryforward after a change of ownership, so this is worth confirming rather than assuming.</p>
<p><strong>Is a lower headline corporate tax rate always better for a business?</strong> Not necessarily — the effective rate depends on the tax base (what counts as deductible), available credits and incentives, and compliance costs, so comparing headline rates alone can be misleading when choosing where to incorporate or operate.</p>
<p><strong>Do startups and small companies get any corporate tax relief?</strong> Many jurisdictions offer reduced rates, exemptions, or credits for smaller companies or specific activities like research and development — these concessions can meaningfully lower the effective rate for a young or growing business, so it is worth checking what applies before assuming the standard headline rate is what you will actually pay.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>OECD, Base Erosion and Profit Shifting (BEPS) Action Plan</li>
<li>U.S. Internal Revenue Service, corporate tax guidance</li>
<li>UK HMRC, Corporation Tax guidance</li>
<li>India, Income Tax Act 1961, corporate tax provisions</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Map your company's residence and the sources of its income, confirm the current rate and filing calendar in each relevant country, and build a record-keeping routine that captures the documents tax authorities expect. Where the business operates across borders or within a group, engage a tax professional early, because cross-border structures are where the largest risks and reliefs both concentrate.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'tf-002',
    title: 'How Personal Income Tax Works',
    slug: 'how-personal-income-tax-works',
    alphabet: 'H',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_income',
    category: { id: 'cat_tax_finance', name: 'Tax & Finance', slug: 'tax-finance' },
    subcategory: { id: 'sub_tf_income', name: 'Income Tax', slug: 'income-tax' },
    summary:
      'An accessible explainer on how individuals are taxed on their earnings, the deductions and brackets involved, and how filing duties differ worldwide.',
    author: 'Daniel Okafor',
    updatedAt: 'May 2, 2026',
    readingTime: 8,
    views: 5360,
    featured: false,
    imageSeed: 'income-tax-bracket-chart',
    content: `<p>Personal income tax is one of the most widely shared experiences in modern economies: a charge levied by governments on the money individuals earn. While the underlying idea is simple — you pay a portion of your income to the state — the mechanics of who pays, on what, and how much, can be surprisingly intricate. Knowing the building blocks helps you read a payslip, file a return correctly, and understand why two people earning the same amount can owe different sums.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Income tax applies to earnings such as wages, self-employment profit, rent, and often investment returns.</li><li>Most countries use progressive brackets, so higher slices of income are taxed at higher rates.</li><li>Allowances, deductions, and credits reduce the amount actually taxed or the final bill.</li><li>Filing systems range from automatic withholding to mandatory annual self-assessment, depending on the country.</li></ul></div>

<h2>What Counts as Taxable Income</h2>
<p>Tax law usually casts a wide net over the kinds of money it treats as income. The category typically includes employment wages, profits from self-employment or a small business, rental income, pensions, and frequently interest, dividends, and capital gains — although gains are sometimes taxed under separate rules.</p>
<h3>Income That May Be Exempt</h3>
<ul>
<li>Certain government benefits or social support payments.</li>
<li>Specific savings vehicles designed to be tax-free up to a limit.</li>
<li>Some gifts and inheritances, which may instead fall under separate tax regimes.</li>
</ul>

<h2>Brackets and Marginal Rates</h2>
<p>Most systems are progressive, meaning income is divided into bands and each band is taxed at its own rate. A common misunderstanding is that moving into a higher bracket taxes all your income at the higher rate. In reality, only the portion of income that falls within each band is taxed at that band's rate. The "marginal rate" is simply the rate applied to your next unit of income, while your overall effective rate is usually lower.</p>

<h2>Reducing the Bill: Allowances, Deductions, and Credits</h2>
<p>Three mechanisms commonly lower what you owe, and it helps to distinguish them.</p>
<ul>
<li>A personal allowance is an amount of income taxed at zero before any rate applies.</li>
<li>A deduction reduces the income figure that tax is calculated on.</li>
<li>A credit reduces the final tax bill directly, often pound-for-pound or dollar-for-dollar.</li>
</ul>
<p>Because a credit cuts the tax itself rather than the taxable base, it is frequently more valuable than an equivalent deduction.</p>

<h2>How You File: Withholding vs Self-Assessment</h2>
<p>Countries collect income tax in different ways. Many operate employer withholding, where tax is deducted from each paycheck and remitted on the worker's behalf, sometimes settling the year automatically. Others require individuals to file an annual return declaring all income and claiming reliefs themselves.</p>
<h3>Jurisdictional Snapshots</h3>
<p>In the United States, most workers file a federal return each year and may also owe state income tax. The United Kingdom uses a pay-as-you-earn system for many employees, with self-assessment reserved for the self-employed and those with more complex affairs. EU member states each run their own income tax with distinct bands and allowances. India operates an annual filing system with multiple regimes a taxpayer may choose between, and a withholding mechanism for many payments.</p>
<p>As with all tax figures, specific rates and thresholds change with national budgets and should be treated as illustrative rather than current fact.</p>

<h2>Common Pitfalls</h2>
<p>Frequent errors include forgetting to declare side income such as freelance work or rent, missing filing deadlines, and assuming withholding has settled a liability that actually requires a return. Failing to keep receipts for claimed deductions can also unravel an otherwise valid claim if questioned.</p>

<h2>Tax Residence and Cross-Border Work</h2>
<p>Where you owe income tax is not always simply where you happen to be sitting when you earn it. Most countries determine tax residence using tests based on physical presence (commonly a threshold like 183 days in a tax year), the location of a permanent home, or the center of a person's economic and personal life. Someone who works remotely for a foreign employer, splits time between two countries, or moves mid-year can end up navigating two different tax systems' residence rules simultaneously — and, without a bilateral tax treaty allocating taxing rights, potentially owing tax on the same income in both places. Digital nomads and remote workers in particular should not assume that working for a company based elsewhere exempts them from tax obligations in the country where they are physically resident.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Do I owe tax on income earned while living abroad?</strong> It depends on your citizenship and residence rules — some countries (like the United States) tax citizens on worldwide income regardless of where they live, while most others tax based on residence, not citizenship, so the answer varies significantly by country.</p>
<p><strong>Is cryptocurrency taxed the same way as regular income?</strong> Usually not identically — many jurisdictions treat crypto gains as capital gains rather than ordinary income, with different rates and rules for tracking cost basis, though treatment varies and some countries are still actively developing specific crypto tax guidance.</p>
<p><strong>What happens if I simply don't file a required tax return?</strong> Consequences generally escalate from late-filing penalties and interest on unpaid tax to, in serious or repeated cases, criminal prosecution for tax evasion — voluntarily filing late (even without full payment) is almost always treated more leniently than not filing at all.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>OECD Model Tax Convention on Income and on Capital</li>
<li>U.S. Internal Revenue Service, Publication 17 (individual income tax guidance)</li>
<li>UK HMRC, Statutory Residence Test guidance</li>
<li>India, Income Tax Act 1961, individual residence and taxation provisions</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Identify every source of income you receive, confirm whether your country expects withholding or an annual return, and check which allowances and credits you genuinely qualify for. Keep clear records throughout the year rather than reconstructing them at deadline, and seek professional help where income spans multiple countries or includes significant investment or business activity.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
