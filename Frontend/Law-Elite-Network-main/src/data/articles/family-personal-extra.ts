import type { LawArticle } from '../law-content';

const FAMILY_PERSONAL_CATEGORY = {
  id: 'cat_family_personal',
  name: 'Family & Personal',
  slug: 'family-personal',
};

export const familyPersonalExtraArticles: LawArticle[] = [
  {
    id: 'fp-101',
    title: 'Prenuptial Agreements: What They Can and Cannot Do',
    slug: 'prenuptial-agreements-what-they-can-and-cannot-do',
    alphabet: 'P',
    categoryId: 'cat_family_personal',
    subcategoryId: 'sub_fp_marriage',
    category: FAMILY_PERSONAL_CATEGORY,
    subcategory: { id: 'sub_fp_marriage', name: 'Marriage Registration', slug: 'marriage-registration' },
    summary:
      'A prenuptial agreement lets a couple decide in advance how property and finances are handled if they divorce, but courts will not enforce terms that are unfair or harm children.',
    author: 'Sofia Almeida',
    updatedAt: 'June 14, 2026',
    readingTime: 9,
    views: 5980,
    featured: false,
    imageSeed: 'prenuptial-agreement-guide',
    content: `<p>A prenuptial agreement, often called a "prenup", is a contract that two people sign before marriage to set out how their property, finances, and support obligations will be handled if the marriage ends. It allows couples to plan ahead while relations are good, replacing uncertainty with agreed rules. But a prenup is not all-powerful: courts in most countries will set aside terms that are unfair, signed under pressure, or that try to bargain away the rights of children.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A prenup decides in advance how assets and debts are divided if a marriage ends.</li><li>It is most useful for protecting pre-marriage property, businesses, or inheritances.</li><li>Courts will not enforce terms that are unconscionable, signed under duress, or based on hidden assets.</li><li>A prenup generally cannot dictate child custody or waive child support.</li><li>Enforceability varies widely; some countries treat prenups as binding, others as merely persuasive.</li></ul></div>

<h2>What a Prenup Is For</h2>
<p>People marry with different financial histories — a family business, savings, property, debts, or children from a previous relationship. A prenuptial agreement lets a couple decide how those assets will be treated rather than leaving everything to default divorce law, which may divide property in ways neither expected. Used well, it is a planning tool, not a sign of distrust, and it can reduce conflict and cost if the marriage later breaks down.</p>

<h2>What a Prenup Can Usually Do</h2>
<p>Within limits, a well-drafted agreement can address many financial questions.</p>
<ul>
<li><strong>Protect separate property:</strong> keep assets owned before the marriage, or expected by inheritance, with their original owner.</li>
<li><strong>Define marital property:</strong> set out which assets are shared and how they would be split.</li>
<li><strong>Allocate debts:</strong> clarify who is responsible for liabilities brought into or built up during the marriage.</li>
<li><strong>Address spousal support:</strong> in many places, set or limit maintenance, subject to fairness checks.</li>
<li><strong>Protect a business:</strong> shield a company or professional practice from being divided or disrupted.</li>
</ul>

<h2>What a Prenup Cannot Do</h2>
<p>There are firm limits almost everywhere. A prenup generally cannot decide child custody or parenting arrangements in advance, because courts must judge a child's best interests at the actual time of separation. It also usually cannot waive child support, which belongs to the child rather than the parents. Courts will refuse to enforce terms that are grossly unfair, that were signed under pressure, or that rest on concealed assets. Any clause encouraging divorce or covering non-financial personal conduct is also typically unenforceable.</p>

<h2>What Makes a Prenup Enforceable</h2>
<h3>Fair Process</h3>
<p>How the agreement was made matters as much as its content. Common requirements include full and honest disclosure of each person's assets and debts, enough time before the wedding so no one feels rushed, and the absence of pressure or coercion.</p>
<h3>Independent Advice</h3>
<p>Many jurisdictions expect — and some require — that each partner receive independent legal advice. This helps show that both understood what they were agreeing to and signed freely, which is central to whether a court will uphold the agreement later.</p>

<h2>How Jurisdictions Treat Prenups</h2>
<p>Recognition ranges from binding to merely influential.</p>
<ul>
<li><strong>United States:</strong> Prenups are widely enforced when properly made, though standards differ by state and unconscionable terms are rejected.</li>
<li><strong>United Kingdom:</strong> Prenups are not automatically binding but are given significant weight if freely entered with disclosure and advice, and if fair.</li>
<li><strong>European Union:</strong> Many civil-law countries use formal marital property regimes, and agreements before a notary can be strongly binding.</li>
<li><strong>India:</strong> Prenups are not traditionally recognised as binding contracts and are generally treated as persuasive rather than enforceable.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Signing too close to the wedding, which can suggest pressure.</li>
<li>Hiding assets, which can void the entire agreement.</li>
<li>Skipping independent legal advice for one or both partners.</li>
<li>Trying to control custody or waive child support, which courts ignore.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you are considering a prenup, start the conversation early and approach it as joint planning rather than a one-sided demand. Make full financial disclosure, allow plenty of time before the wedding, and ensure each partner has their own lawyer. Because enforceability varies so much by country, have the agreement drafted and reviewed by a family-law specialist where you intend to live, and revisit it after major life changes such as children or a significant change in wealth.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'fp-102',
    title: 'How Is Child Support Calculated?',
    slug: 'how-is-child-support-calculated',
    alphabet: 'H',
    categoryId: 'cat_family_personal',
    subcategoryId: 'sub_fp_alimony',
    category: FAMILY_PERSONAL_CATEGORY,
    subcategory: { id: 'sub_fp_alimony', name: 'Alimony & Maintenance', slug: 'alimony-maintenance' },
    summary:
      'Child support is usually calculated using a formula based on each parent\'s income, the number of children, and how much time the child spends with each parent.',
    author: 'Rajesh Iyer',
    updatedAt: 'June 7, 2026',
    readingTime: 9,
    views: 6510,
    featured: true,
    imageSeed: 'child-support-calculation',
    content: `<p>Child support is money one parent pays to help cover the cost of raising their child after the parents separate. In most countries it is calculated using a formula or set of guidelines built around a few key facts: how much each parent earns, how many children need support, and how much time the child spends in each parent's care. The goal is consistent and fair: a child should benefit from both parents' resources, whether or not the parents live together.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Child support is the child's right, intended to cover their living and care costs.</li><li>Most systems use a formula based on parental income, the number of children, and care time.</li><li>It is calculated separately from spousal support and from how property is divided.</li><li>Support can be reviewed and changed when incomes or living arrangements shift.</li><li>The exact formula and enforcement tools vary significantly between countries.</li></ul></div>

<h2>What Child Support Is — and Is Not</h2>
<p>Child support exists for the benefit of the child, not the receiving parent, and it is treated separately from other money issues in a separation. It is distinct from <strong>spousal support</strong> (maintenance paid to a former partner) and from the <strong>division of property</strong>. Confusing these is a common mistake; they are calculated differently and serve different purposes. Child support is intended to keep a child's standard of living as stable as possible across both households.</p>

<h2>The Main Factors in the Calculation</h2>
<p>Although formulas differ, most systems weigh a similar set of inputs.</p>
<ul>
<li><strong>Each parent's income:</strong> usually the single biggest factor, sometimes combined, sometimes compared.</li>
<li><strong>Number of children:</strong> more children generally means higher total support.</li>
<li><strong>Care arrangements:</strong> how many nights or what share of time the child spends with each parent.</li>
<li><strong>Special costs:</strong> childcare, healthcare, education, or a child's particular needs.</li>
</ul>

<h2>Common Models for Setting Support</h2>
<h3>Income Shares</h3>
<p>Many systems estimate what the parents would have spent on the child if still together, then divide that figure between them in proportion to their incomes. The parent the child lives with less often typically pays their share to the other.</p>
<h3>Percentage of Income</h3>
<p>Other systems apply a set percentage of the paying parent's income, rising with the number of children. This is simpler but less tailored to each family's circumstances.</p>
<h3>Adjustments for Shared Care</h3>
<p>Where care is genuinely shared, formulas usually reduce the amount payable to reflect the costs each parent already meets directly while the child is with them.</p>

<h2>How Systems Differ Around the World</h2>
<p>The principle is shared, but the machinery varies.</p>
<ul>
<li><strong>United States:</strong> Each state has its own guidelines, often based on income shares or a percentage model, with courts able to adjust.</li>
<li><strong>United Kingdom:</strong> A statutory service calculates support using a percentage of the paying parent's income adjusted for care nights and other children.</li>
<li><strong>European Union:</strong> Member states set their own formulas, and cross-border rules help enforce support when parents live in different countries.</li>
<li><strong>India:</strong> Maintenance for children is determined by courts under family and personal laws, weighing needs and the paying parent's means rather than a fixed formula.</li>
</ul>

<h2>Changing and Enforcing Support</h2>
<p>Child support is rarely fixed forever. Either parent can usually apply to review it when circumstances change significantly — a job loss, a pay rise, or a change in where the child lives. Enforcement tools are also widely available: authorities and courts can deduct support from wages, intercept tax refunds, or impose penalties on parents who refuse to pay. Withholding contact because support is unpaid, or stopping support because contact is refused, is generally not permitted; the two issues are treated separately.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Confusing child support with spousal support, leading to wrong expectations.</li>
<li>Relying on an informal, undocumented arrangement that is hard to enforce later.</li>
<li>Failing to disclose income honestly, which can lead to recalculation and penalties.</li>
<li>Assuming support automatically ends at a set age without checking local rules.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Gather accurate records of both parents' income and the child's actual costs and care schedule, since these drive any calculation. Use your country's official guidelines or calculator where one exists to get a realistic figure, and put any agreement in a form that can be enforced. Where incomes are complex or parents live in different countries, consult a family-law specialist, and remember that support can be revisited as the child's needs and the parents' circumstances change.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
