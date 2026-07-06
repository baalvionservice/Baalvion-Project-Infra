import type { LawArticle } from '../law-content';

const TAX_FINANCE_CATEGORY = {
  id: 'cat_tax_finance',
  name: 'Tax & Finance',
  slug: 'tax-finance',
};

export const taxFinanceExtra2Articles: LawArticle[] = [
  {
    id: 'tf-201',
    title: 'What Are Tax Deductions and How Do They Work?',
    slug: 'what-are-tax-deductions',
    alphabet: 'W',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_income',
    category: TAX_FINANCE_CATEGORY,
    subcategory: { id: 'sub_tf_income', name: 'Income Tax', slug: 'income-tax' },
    summary:
      'A tax deduction reduces the income on which you are taxed, lowering your bill — but it works differently from a tax credit, and the rules depend heavily on where you live.',
    author: 'Priya Nair',
    updatedAt: 'June 21, 2026',
    readingTime: 8,
    views: 7480,
    featured: false,
    imageSeed: 'tax-deductions-explained',
    content: `<p>A tax deduction is an amount you are allowed to subtract from your income before your tax is calculated, which lowers the portion of your income that is actually taxed. If you earn a certain amount and qualify for deductions, you pay tax only on what is left after subtracting them. Deductions are one of the most common ways individuals and businesses legally reduce their tax bills — but they are often misunderstood, especially the difference between a deduction and a tax credit.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A deduction reduces your taxable income, not your tax bill directly.</li><li>A deduction's value depends on your tax rate; a credit reduces tax owed directly.</li><li>Common deductions cover business expenses, certain interest, donations, and retirement contributions.</li><li>Many systems offer a standard deduction as a simple alternative to itemising.</li><li>What is deductible — and by how much — varies sharply between countries.</li></ul></div>

<h2>Deductions vs Credits</h2>
<p>This is the distinction that trips people up most. A deduction lowers the income on which tax is calculated, so its real value depends on your tax rate: a deduction is worth more to someone in a higher bracket. A tax credit, by contrast, reduces the tax you owe directly, dollar for dollar (or the local equivalent). A credit of a given amount is generally worth more than a deduction of the same amount. Understanding which one a rule provides helps you judge its true benefit.</p>

<h2>Standard vs Itemised Deductions</h2>
<p>Many tax systems let individuals choose between two approaches:</p>
<ul>
<li><strong>Standard deduction:</strong> a fixed amount the law lets you subtract without listing specific expenses. It is simple and benefits those without large deductible costs.</li>
<li><strong>Itemised deductions:</strong> adding up specific allowable expenses — such as certain interest, donations, or medical costs — when their total exceeds the standard amount.</li>
</ul>
<p>You generally take whichever gives the bigger reduction, but you usually cannot take both for the same items.</p>

<h2>Common Types of Deductions</h2>
<h3>For Individuals</h3>
<p>Depending on the jurisdiction, individuals may deduct things like charitable donations, mortgage or student-loan interest, certain medical expenses, and contributions to approved retirement or savings schemes.</p>
<h3>For Businesses</h3>
<p>Businesses can usually deduct "ordinary and necessary" expenses incurred in earning income — rent, salaries, supplies, professional fees, and depreciation of equipment. The principle is that tax should fall on profit, not gross revenue, so legitimate costs of doing business are subtracted first.</p>

<h2>Why Records Matter</h2>
<p>Deductions are only as good as the evidence behind them. Tax authorities can ask you to prove an expense was genuine and qualifies. Keeping receipts, invoices, and clear records — and separating personal from business spending — is essential. Claiming deductions you cannot support, or that are not actually allowed, is a frequent cause of audits and penalties.</p>

<h2>How Deductions Work Around the World</h2>
<ul>
<li><strong>United States:</strong> Taxpayers choose between a standard deduction and itemising, with credits handled separately; business expenses follow detailed rules.</li>
<li><strong>United Kingdom:</strong> The system relies more on personal allowances and specific reliefs than broad itemised deductions, with separate rules for the self-employed.</li>
<li><strong>European Union:</strong> Each member state sets its own deductions and allowances, so what is claimable differs widely across the bloc.</li>
<li><strong>India:</strong> Deductions are available under specific provisions for investments, insurance, and donations, alongside a standard deduction for salaried taxpayers under certain regimes.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Confusing deductions with credits and overestimating the benefit.</li>
<li>Claiming expenses without keeping the records to support them.</li>
<li>Mixing personal and business costs, which can invalidate business deductions.</li>
<li>Assuming a deduction in one country exists or works the same way in another.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Begin by listing the deductions you may genuinely qualify for under your local rules, and compare itemising against any standard deduction. Keep organised records throughout the year rather than scrambling at filing time. For anything beyond a simple return — self-employment, investments, or cross-border income — a qualified accountant or tax adviser can ensure you claim everything you are entitled to without crossing the line into a risky position.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'tf-202',
    title: 'What Is a Tax Audit and What Should You Do?',
    slug: 'what-is-a-tax-audit',
    alphabet: 'W',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_corporate',
    category: TAX_FINANCE_CATEGORY,
    subcategory: { id: 'sub_tf_corporate', name: 'Corporate Tax', slug: 'corporate-tax' },
    summary:
      'A tax audit is an official review of your tax return and records to check the figures are accurate — usually routine, manageable, and far less alarming than people fear.',
    author: 'Rajesh Iyer',
    updatedAt: 'June 19, 2026',
    readingTime: 8,
    views: 5980,
    featured: false,
    imageSeed: 'tax-audit-review-process',
    content: `<p>A tax audit is an examination by a tax authority of your tax return and supporting records to verify that the income, deductions, and other figures you reported are correct. For most people and businesses, an audit is not an accusation of wrongdoing; it is a check. Returns are selected for many reasons — random sampling, computer flags, mismatched information, or simply being in a higher-risk category. Knowing what an audit involves, and how to respond calmly and properly, turns an intimidating event into a manageable process.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A tax audit is a review of your return and records to confirm the figures are accurate.</li><li>Being audited does not automatically mean you did anything wrong.</li><li>Audits range from simple correspondence checks to detailed field examinations.</li><li>Good records are your best protection — they prove what you reported.</li><li>Audit powers, time limits, and appeal rights differ by jurisdiction.</li></ul></div>

<h2>Why Returns Get Audited</h2>
<p>Tax authorities cannot examine every return, so they select a fraction. Common triggers include figures that differ sharply from the norm for your income or industry, mismatches between your return and information reported by employers or banks, unusually large deductions, repeated losses, or cash-heavy businesses. Some selections are simply random. Being audited is often a matter of statistics rather than suspicion.</p>

<h2>Types of Audit</h2>
<ul>
<li><strong>Correspondence audit:</strong> a letter asking you to clarify or document a specific item. This is the most common and least intrusive type.</li>
<li><strong>Office audit:</strong> you are asked to bring records to a tax office for review.</li>
<li><strong>Field audit:</strong> an examiner visits your home or business to inspect records more thoroughly. This is usually reserved for complex or higher-value cases.</li>
</ul>

<h2>What an Audit Examines</h2>
<p>An audit focuses on whether what you reported can be supported. For individuals, that often means proving income was fully declared and that deductions or reliefs claimed were genuine and allowable. For businesses, examiners may review sales records, expense receipts, payroll, and the consistency of accounts. The recurring theme is documentation: an audit is, in practice, a test of whether your paperwork backs up your figures.</p>

<h2>How to Respond</h2>
<h3>Stay Calm and Organised</h3>
<p>Respond by the deadlines, provide exactly what is requested, and keep copies of everything you send. Being cooperative and timely sets a constructive tone.</p>
<h3>Provide Records, Not Speculation</h3>
<p>Answer the specific questions asked, supported by documents, rather than volunteering unnecessary information. If you are unsure about something, it is reasonable to seek advice before responding.</p>
<h3>Know Your Rights</h3>
<p>Most systems give taxpayers rights during an audit — to be treated fairly, to understand why information is requested, and to appeal the outcome. You are also generally entitled to be represented by an accountant or tax lawyer.</p>

<h2>Possible Outcomes</h2>
<p>An audit can end in several ways. The authority may accept your return as filed, propose changes that increase or even decrease the tax owed, or, in cases of suspected deliberate evasion, escalate to penalties or investigation. If you disagree with the result, there is usually a defined process to object or appeal. Honest errors are typically treated very differently from deliberate fraud.</p>

<h2>How Audits Work Around the World</h2>
<ul>
<li><strong>United States:</strong> The IRS conducts correspondence, office, and field audits, with statutory time limits and a structured appeals process.</li>
<li><strong>United Kingdom:</strong> HMRC opens "compliance checks" into returns, with powers to request records and rights for taxpayers to appeal.</li>
<li><strong>European Union:</strong> Each member state runs its own tax administration and audit procedures, with their own deadlines and safeguards.</li>
<li><strong>India:</strong> Tax assessments and scrutiny are carried out by the income-tax department, with defined assessment and appeal mechanisms.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Ignoring or delaying responses to audit notices, which can worsen the situation.</li>
<li>Failing to keep records, so legitimate figures cannot be proven.</li>
<li>Volunteering excessive information beyond what was actually requested.</li>
<li>Treating an honest-error audit as a disaster, rather than a process to work through.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>The best defence against a difficult audit is preparation before one ever happens: keep clear, organised records and file accurate returns. If you receive a notice, read it carefully, note the deadlines, and gather the specific documents requested. For anything beyond a simple query — significant sums, business accounts, or suspected penalties — engage an accountant or tax lawyer early to represent you and protect your position.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
