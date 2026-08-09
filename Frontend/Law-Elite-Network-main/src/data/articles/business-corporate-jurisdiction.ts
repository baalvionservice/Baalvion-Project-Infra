import type { LawArticle } from '../law-content';

const BUSINESS_CORPORATE_CATEGORY = {
  id: 'cat_business_corporate',
  name: 'Business & Corporate',
  slug: 'business',
};

/**
 * Jurisdiction-specific companion to the comparative `bc-101` "LLC vs
 * Corporation" pillar, which already flags in its own FAQ that "S-corp" is a
 * US federal tax election rather than a separate entity type -- this piece
 * is the deeper, US-specific explainer that FAQ line points toward, covering
 * the actual eligibility rules, election mechanics, and the self-employment
 * tax planning that is the real reason most small US corporations elect it.
 */
export const businessCorporateJurisdictionArticles: LawArticle[] = [
  {
    id: 'bc-301',
    title: 'What Is an S Corporation? How the Tax Election Actually Works',
    slug: 'what-is-an-s-corporation',
    alphabet: 'W',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_formation',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_formation', name: 'Company Formation', slug: 'company-formation' },
    summary:
      "An S corporation isn't a type of company you form — it's a US federal tax election an eligible corporation or LLC makes with the IRS. Here is who qualifies, how to file, and why it's the default recommendation for so many small US businesses.",
    author: 'Elena Rossi',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 's-corporation-tax-election-us',
    country: 'United States',
    content: `<p>Ask a small business owner in the US what an "S-corp" is, and many will describe it as a kind of company, alongside an LLC or a corporation. That's not quite right. An S corporation isn't a separate legal entity type at all — it's a federal tax election that an eligible corporation, or an LLC that chooses to be taxed as a corporation, files with the IRS. You still form a corporation or LLC under your state's law first; the S-election only changes how the entity's profits are taxed afterward, and eligibility for it comes with real, strictly enforced conditions.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>"S-corp" is a tax election under Subchapter S of the Internal Revenue Code, made by filing IRS Form 2553 — not a distinct entity type you form at the state level.</li><li>Eligibility is strict: no more than 100 shareholders, only individuals, certain trusts, or estates as shareholders (no corporations or partnerships), no nonresident alien shareholders, and only one class of stock.</li><li>Like an LLC or partnership, profits and losses pass through to shareholders' personal returns, avoiding the corporate-level "double taxation" a standard C-corp faces.</li><li>The main planning driver for most small businesses is self-employment tax: shareholder-employees pay payroll tax only on "reasonable compensation," not on additional profit distributions — a distinction the IRS actively audits.</li><li>The one-class-of-stock rule is exactly why most venture-backed startups use C-corps instead — S-corp status can't support the preferred-stock structures investors typically require.</li></ul></div>

<h2>A Tax Election, Not an Entity Type</h2>
<p>The process always starts the same way regardless of the eventual tax treatment: you form a corporation, or an LLC, under the law of a US state. An S-election is then a separate, additional step — filing IRS Form 2553 to ask the IRS to tax that existing entity under Subchapter S of the Internal Revenue Code instead of the default rules that would otherwise apply. Some states also require or allow a separate state-level S-corp filing or impose their own entity-level tax even after a federal S-election (California is a well-known example, with its own minimum franchise tax), so the federal election doesn't automatically determine every state tax consequence.</p>

<h2>Who Actually Qualifies</h2>
<p>Eligibility for S-corp status is narrower than most founders expect, and the requirements are checked closely by the IRS:</p>
<ul>
<li><strong>Domestic entity only.</strong> The corporation (or electing LLC) must be a US domestic entity.</li>
<li><strong>No more than 100 shareholders.</strong> Certain family members can elect to be counted as a single shareholder for this limit.</li>
<li><strong>Eligible shareholders only.</strong> Shareholders must be individuals, certain trusts, or estates — corporations and partnerships generally cannot own shares in an S-corp.</li>
<li><strong>US persons only.</strong> Shareholders must be US citizens or resident aliens; nonresident aliens generally cannot hold shares.</li>
<li><strong>One class of stock.</strong> All outstanding shares must confer identical rights to distribution and liquidation proceeds. Differences in voting rights alone are permitted, but differences in economic rights are not.</li>
<li><strong>Not an ineligible corporation.</strong> Certain financial institutions, insurance companies, and domestic international sales corporations cannot elect S-corp status.</li>
</ul>

<h2>How and When to File Form 2553</h2>
<p>To take effect for the current tax year, Form 2553 generally must be filed no later than two months and fifteen days after the start of that tax year, or at any point during the preceding tax year. Every shareholder as of the election date must consent by signing the form — a single missing signature is enough to make the election invalid. A business that misses the deadline isn't necessarily out of luck: the IRS allows late-election relief for reasonable cause under Revenue Procedure 2013-30, which is used often enough in practice that a missed deadline is worth raising with a tax professional rather than assumed to be fatal.</p>

<h2>Pass-Through Taxation, One Layer</h2>
<p>Like a partnership or a default LLC, an S corporation itself generally pays no federal income tax. Profits and losses pass through to shareholders, who report their share on their personal returns via a Schedule K-1, and are taxed once at the individual level. This avoids the classic "double taxation" a standard C corporation faces, where the company pays corporate income tax on its profits and shareholders are taxed again on any dividends distributed from what's left.</p>

<h2>The Real Reason Most Small Businesses Elect It: Self-Employment Tax</h2>
<p>Pass-through taxation alone doesn't fully explain the S-corp's popularity — an LLC taxed as a partnership already gets that. The distinct advantage is how S-corp profits interact with self-employment tax. A shareholder who actively works in the business must be paid "reasonable compensation" as a W-2 employee, and that salary is subject to ordinary payroll taxes (Social Security and Medicare). But profit distributed beyond that reasonable salary is generally not subject to self-employment tax at all — a real and often substantial saving compared to a sole proprietorship or a default LLC, where all business profit is typically subject to self-employment tax regardless of how much of it reflects the owner's active labor.</p>
<p>This is also the single most audited feature of S-corp taxation. The IRS has long taken the position, reflected in guidance including Revenue Ruling 74-44 and reinforced in court decisions such as <em>Watson v. Commissioner</em>, that shareholder-employees cannot set an artificially low salary purely to shift income into the untaxed distribution category. "Reasonable compensation" is judged against what the role would command in the market, considering the shareholder's duties, time devoted to the business, comparable industry salaries, and the company's overall profitability — an underpaid-salary S-corp is one of the more common triggers for an IRS audit adjustment.</p>

<h2>Real Limitations</h2>
<ul>
<li><strong>Only one class of stock.</strong> This is the main reason most venture-backed startups organize as C corporations instead — investors typically require preferred stock with liquidation preferences and other rights that a single class of S-corp stock cannot provide.</li>
<li><strong>Loss limitations.</strong> A shareholder can only deduct pass-through losses up to their basis in the stock and any loans they've personally made to the company.</li>
<li><strong>Built-in gains tax risk.</strong> A business that converts from a C-corp to an S-corp can face a separate built-in gains tax on appreciated assets sold within a specified recognition period (currently five years) after the conversion.</li>
<li><strong>Ownership restrictions foreclose most outside investment.</strong> The shareholder eligibility rules generally rule out venture capital funds, most institutional investors, and foreign ownership structures.</li>
</ul>

<h2>S-Corp Election vs the Underlying Entity Choice</h2>
<p>It's worth separating two decisions that are easy to conflate. Choosing between an LLC and a corporation as your underlying legal structure is a separate question from whether to elect S-corp tax treatment once you've formed one — see our companion guide on that choice. In practice, both an eligible corporation and an eligible LLC can elect S-corp status; the decision to elect usually comes down to whether the self-employment tax savings outweigh the added payroll administration and the strict eligibility constraints, not which underlying entity type you started with.</p>

<h2>Frequently Asked Questions</h2>
<h3>Is an S corporation a different legal entity from a regular corporation?</h3>
<p>No. It's the same underlying corporation (or LLC) formed under state law — "S-corp" describes a federal tax election made with the IRS, not a different entity type or a different liability structure.</p>
<h3>Can a single-owner business elect S-corp status?</h3>
<p>Yes — a sole shareholder can elect S-corp treatment, and many single-owner LLCs do so specifically for the self-employment tax savings, provided the owner takes a reasonable salary for the work they actually do in the business.</p>
<h3>Why can't a venture-backed startup usually be an S-corp?</h3>
<p>Because S-corps are limited to one class of stock with identical distribution and liquidation rights. Venture investors typically require preferred stock with different economic rights than common stock, which the one-class-of-stock rule doesn't allow — this is the main reason most VC-backed companies use C corporations instead.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Internal Revenue Code, Subchapter S, §§ 1361–1379</li>
<li>IRS, Instructions for Form 2553, Election by a Small Business Corporation</li>
<li>IRS, Revenue Procedure 2013-30 (late S-election relief for reasonable cause)</li>
<li>IRS, Revenue Ruling 74-44, and <em>Watson v. Commissioner</em>, 668 F.3d 1008 (8th Cir. 2012) — reasonable compensation standard</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before electing S-corp status, confirm your business and its owners actually meet every eligibility requirement — shareholder count, shareholder type, residency, and the single-class-of-stock rule — since a disqualifying event can terminate the election unexpectedly. If you do elect, set a defensible, market-based salary for any shareholder-employee before taking additional distributions, and keep documentation supporting how that figure was chosen. A tax professional or CPA can model whether the self-employment tax savings actually outweigh the added payroll and compliance costs for your specific numbers before you file Form 2553. For the underlying choice between forming an LLC or a corporation in the first place, see <a href="/business/llc-vs-corporation">LLC vs Corporation: Which Business Structure Should You Choose?</a></p>

<p><em>This article is general legal information, not legal or tax advice. US federal tax law changes over time, and state-level treatment of S-corps varies separately — consult a CPA or tax attorney before electing S-corp status.</em></p>`,
  },
];
