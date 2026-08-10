import type { LawArticle } from '../law-content';

const TAX_FINANCE_CATEGORY = {
  id: 'cat_tax_finance',
  name: 'Tax & Finance',
  slug: 'tax-finance',
};

export const taxFinanceExtraArticles: LawArticle[] = [
  {
    id: 'tf-101',
    title: 'What Is Capital Gains Tax and How Does It Work?',
    slug: 'what-is-capital-gains-tax',
    alphabet: 'C',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_income',
    category: TAX_FINANCE_CATEGORY,
    subcategory: { id: 'sub_tf_income', name: 'Income Tax', slug: 'income-tax' },
    summary:
      'Capital gains tax is a charge on the profit you make when you sell an asset for more than you paid for it, such as shares, property, or a business.',
    author: 'Priya Nair',
    updatedAt: 'June 17, 2026',
    readingTime: 9,
    views: 7860,
    featured: true,
    imageSeed: 'capital-gains-tax-explained',
    country: 'United States',
    content: `<p>Capital gains tax is a tax on the profit you make when you sell or dispose of an asset for more than it cost you. The "gain" is the difference between what you receive and what you originally paid, not the full sale price. It applies to things like shares, investment property, and business interests, and it is one of the most widely misunderstood taxes because it is triggered by a sale, not by simply owning something that has risen in value.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Capital gains tax is charged on the profit from selling an asset, not on the whole sale price.</li><li>It is usually triggered by a sale or disposal, not by an unrealised rise in value.</li><li>Many systems tax long-held assets more lightly than short-term gains.</li><li>Allowances, exemptions, and reliefs — such as for a main home — can reduce or remove the tax.</li><li>Rates, exemptions, and rules differ sharply between countries and change with budgets.</li></ul></div>

<h2>What Counts as a Capital Gain</h2>
<p>A capital gain arises when you dispose of a "capital asset" for more than its base cost. The calculation is broadly the sale proceeds minus what you paid and minus allowable costs such as buying and selling fees or qualifying improvements. The result is the taxable gain. A capital <strong>loss</strong> happens when you sell for less than you paid, and many systems let you offset losses against gains to reduce the tax.</p>
<h3>Realised vs Unrealised Gains</h3>
<p>A crucial point is that most systems tax only <strong>realised</strong> gains — those locked in by an actual sale or disposal. If an asset rises in value but you keep holding it, there is usually no tax yet. This is why long-term investors can defer tax simply by not selling.</p>

<h2>Assets That Are Commonly Taxed</h2>
<p>The range of assets covered varies, but typical examples include:</p>
<ul>
<li>Shares and other securities.</li>
<li>Investment or second properties.</li>
<li>Business assets or the sale of a business.</li>
<li>Valuable personal possessions above a threshold, in some systems.</li>
</ul>
<p>Some assets are often exempt, most notably a person's main home in many countries, certain government savings vehicles, and small disposals below an annual allowance.</p>

<h2>How the Tax Is Often Calculated</h2>
<h3>Short-Term vs Long-Term</h3>
<p>Many systems distinguish between assets held for a short time and those held longer. Short-term gains are frequently taxed at higher rates — sometimes as ordinary income — while long-term gains may attract lower rates to reward longer holding. The exact holding period that counts as "long-term" varies by country.</p>
<h3>Allowances and Reliefs</h3>
<p>Most systems provide ways to reduce the bill: an annual tax-free allowance, exemptions for a main residence, reliefs for selling a business, and the ability to offset losses. Inflation indexing, where the cost base is adjusted for inflation, exists in some countries but not others.</p>

<h2>How Jurisdictions Differ</h2>
<p>Capital gains tax is one of the most variable taxes worldwide.</p>
<ul>
<li><strong>United States:</strong> Federal tax distinguishes short-term gains (taxed as ordinary income) from long-term gains (taxed at lower rates), and many states add their own tax.</li>
<li><strong>United Kingdom:</strong> A separate Capital Gains Tax applies above an annual exempt amount, with different rates for property and other assets, and a main-home exemption.</li>
<li><strong>European Union:</strong> Member states set their own rules; some tax gains as income, others apply flat rates, and holding periods can affect the charge.</li>
<li><strong>India:</strong> Gains are split into short-term and long-term based on holding periods that differ by asset class, each with its own rate and indexation rules.</li>
</ul>
<p>Because rates and exemptions change with national budgets, any specific figure should be treated as illustrative and checked against current law.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Assuming a rise in value is taxed before you actually sell.</li>
<li>Forgetting to claim allowable costs and reliefs that lower the gain.</li>
<li>Overlooking that gifting or transferring an asset can count as a disposal.</li>
<li>Missing reporting deadlines, which in some countries are tight for property sales.</li>
</ul>

<h2>Tax-Loss Harvesting and Wash-Sale Rules</h2>
<p>Investors with both gains and losses in a portfolio can often reduce their overall tax bill by deliberately realizing losses to offset realized gains — a strategy commonly called tax-loss harvesting. However, most systems that allow this also include an anti-abuse rule (in the U.S., the "wash sale" rule) that disallows the loss if the investor buys back a substantially identical asset within a short window before or after the sale, closing the obvious loophole of selling purely to bank a tax loss while keeping the same economic position. The exact rules — what counts as "substantially identical," the length of the restricted window, and whether it applies across account types (including retirement accounts) — vary by jurisdiction, so a harvesting strategy should be checked against current local rules rather than assumed to work identically everywhere.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Do I owe capital gains tax when I inherit an asset?</strong> Generally not at the moment of inheritance itself — many systems instead adjust ("step up" or otherwise reset) the asset's cost basis to its value at the date of death, so tax is only calculated on gains after that point when the heir eventually sells, though rules vary by country.</p>
<p><strong>Is selling my primary home always tax-free?</strong> Not always fully — many jurisdictions offer a substantial exemption on gains from a main home (sometimes with residency-period requirements), but the exemption may be capped, may not apply to a second home, or may be reduced if part of the property was used for business or rented out.</p>
<p><strong>Does currency exchange count as a capital gain?</strong> In some jurisdictions, yes — converting between currencies, or holding foreign-currency accounts that fluctuate in value, can trigger a taxable gain or loss in certain systems, which often surprises taxpayers who don't think of currency as an "asset" in the ordinary sense.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>U.S. Internal Revenue Service, Topic No. 409 (capital gains and losses)</li>
<li>UK HMRC, Capital Gains Tax guidance</li>
<li>India, Income Tax Act 1961, capital gains provisions and indexation rules</li>
<li>OECD, taxation of capital gains comparative reports</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before selling a significant asset, work out the likely gain, check which exemptions and reliefs apply, and confirm the reporting deadline in your country. Keep records of what you paid, the costs of buying and selling, and any improvements, as these reduce the taxable gain. For large disposals, business sales, or assets across borders, take advice from a tax professional early, because timing a sale and structuring it correctly can make a substantial difference to the tax due.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'tf-102',
    title: 'VAT vs Sales Tax: What Is the Difference?',
    slug: 'vat-vs-sales-tax',
    alphabet: 'V',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_sales_vat',
    category: TAX_FINANCE_CATEGORY,
    subcategory: { id: 'sub_tf_sales_vat', name: 'Sales Tax & VAT', slug: 'sales-tax-vat' },
    summary:
      'VAT is collected in stages across the supply chain with credits for business inputs, while sales tax is charged once at the final sale to the consumer.',
    author: 'Daniel Okafor',
    updatedAt: 'June 4, 2026',
    readingTime: 8,
    views: 5640,
    featured: false,
    imageSeed: 'vat-vs-sales-tax',
    content: `<p>VAT (value-added tax) and sales tax are both taxes on what consumers spend, but they work in fundamentally different ways. Sales tax is charged once, at the final sale to the end customer. VAT is charged at every stage of the supply chain, with businesses reclaiming the tax they pay on their inputs, so only the "value added" at each step is effectively taxed. The end consumer usually bears a similar burden either way — the difference lies in how the tax is collected along the route.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Sales tax is collected once, at the final retail sale to the consumer.</li><li>VAT is collected in stages, with businesses crediting the tax they pay on inputs.</li><li>VAT (and its cousin GST) is used by most of the world; classic sales tax is most associated with the US.</li><li>VAT's credit system creates a paper trail that reduces evasion but adds compliance work.</li><li>Both ultimately fall on the consumer, but rates, exemptions, and registration rules differ widely.</li></ul></div>

<h2>How Sales Tax Works</h2>
<p>Sales tax is conceptually simple. It is added at the point of final sale, paid by the consumer, and collected by the retailer, who passes it to the government. Crucially, it is charged only once, on the final transaction. Sales between businesses earlier in the chain are typically exempt if the buyer will resell the goods, using a resale certificate to avoid the tax. The retailer is the single collection point.</p>

<h2>How VAT Works</h2>
<p>VAT spreads collection across the whole supply chain. At each stage — manufacturer, wholesaler, retailer — the seller charges VAT on its sales (output tax) but reclaims the VAT it paid on its purchases (input tax), remitting only the difference. The effect is that tax is paid only on the value added at each step, and the cumulative amount reaching the consumer is the same as a single-stage tax of the same rate.</p>
<h3>A Simple Illustration</h3>
<p>If a manufacturer sells goods to a retailer, it charges VAT and remits it. The retailer charges VAT to the consumer but reclaims the VAT it paid to the manufacturer, sending only the balance to the government. The consumer ultimately bears the full VAT, while each business in between is largely neutral.</p>

<h2>The Key Differences at a Glance</h2>
<ul>
<li><strong>When it is collected:</strong> sales tax once at the end; VAT at every stage.</li>
<li><strong>Who remits:</strong> sales tax mainly the final retailer; VAT every registered business in the chain.</li>
<li><strong>Input credits:</strong> VAT lets businesses reclaim tax on inputs; classic sales tax does not (it relies on resale exemptions).</li>
<li><strong>Visibility:</strong> VAT's credit chain creates records that make under-reporting harder.</li>
</ul>

<h2>Strengths and Trade-Offs</h2>
<p>VAT's staged collection makes it harder to evade, because each business has an incentive to obtain valid invoices to claim its input credit, creating a self-policing paper trail. That same mechanism, however, imposes more record-keeping and filing on businesses of every size. Sales tax is simpler for most businesses, since only the final seller collects it, but it relies heavily on that single point and on resale exemptions working correctly, which can create gaps.</p>

<h2>How Jurisdictions Differ</h2>
<p>The two systems map fairly cleanly onto different parts of the world.</p>
<ul>
<li><strong>United States:</strong> Uses retail sales tax, set and collected mainly at state and local level, so rates and rules vary by location and there is no national VAT.</li>
<li><strong>United Kingdom:</strong> Operates VAT with standard, reduced, and zero rates, and a registration threshold for businesses.</li>
<li><strong>European Union:</strong> All member states use VAT under a common framework, though each sets its own rates within agreed limits.</li>
<li><strong>India:</strong> Uses Goods and Services Tax (GST), a VAT-style system with input credits that replaced a patchwork of earlier indirect taxes.</li>
</ul>

<h2>What This Means for Businesses</h2>
<p>If you sell goods or services, the system in your country shapes your obligations. Under VAT or GST, you may need to register once you pass a threshold, charge tax on sales, keep invoices to claim input credits, and file regular returns. Under sales tax, you may need to register where you have a sufficient presence, collect tax at the correct local rate, and manage resale exemptions. Selling across borders or online adds further rules about where tax is due.</p>

<h2>Cross-Border E-Commerce and Digital Sales</h2>
<p>Online selling has significantly complicated both systems. In the U.S., the concept of "economic nexus" — established after a landmark Supreme Court decision — now requires many out-of-state online sellers to collect sales tax once they cross a threshold of sales or transactions into a state, even without any physical presence there, a major shift from the older physical-presence rule. In VAT/GST systems, most jurisdictions now require foreign sellers of digital services (software, streaming, e-books) to register and charge local VAT/GST directly to consumers, often through simplified single-registration schemes designed for exactly this cross-border digital-sales problem. A business selling online across multiple countries should assume registration obligations exist in more places than its home country alone, rather than defaulting to charging only local tax.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Do small businesses have to register for VAT or collect sales tax?</strong> Usually only above a registration or nexus threshold — most systems exempt very small sellers below a defined turnover or transaction count, though the exact threshold and what counts toward it varies significantly by jurisdiction.</p>
<p><strong>Can a business get a VAT refund if it pays more input tax than it collects in output tax?</strong> Yes, in most VAT/GST systems — a net input-tax position typically results in a refund or a credit carried forward, which is common for exporters (who often sell without charging local VAT but still pay it on their own inputs).</p>
<p><strong>Is GST the same thing as VAT?</strong> Functionally, yes — GST (Goods and Services Tax) is essentially a VAT-style system under a different name, used by countries including India, Australia, and Canada, applying the same staged-collection, input-credit logic as VAT elsewhere.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>U.S. Supreme Court, <em>South Dakota v. Wayfair, Inc.</em> (2018)</li>
<li>UK HMRC, VAT guidance and registration thresholds</li>
<li>India, Central Goods and Services Tax Act 2017</li>
<li>OECD, International VAT/GST Guidelines</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Identify whether your country uses VAT, GST, or sales tax, and find the registration threshold and rates that apply to what you sell. Keep clean records of the tax you charge and, under VAT or GST, the tax you pay on inputs so you can claim credits. Where you sell into multiple regions or countries, take professional advice early, because cross-border indirect tax is a frequent source of unexpected liabilities and penalties.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
