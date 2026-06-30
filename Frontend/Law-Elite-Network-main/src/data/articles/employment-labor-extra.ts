import type { LawArticle } from '../law-content';

const EMPLOYMENT_LABOR_CATEGORY = {
  id: 'cat_employment_labor',
  name: 'Employment & Labor',
  slug: 'employment-labor',
};

export const employmentLaborExtraArticles: LawArticle[] = [
  {
    id: 'el-101',
    title: 'What Is a Non-Compete Agreement?',
    slug: 'what-is-a-non-compete-agreement',
    alphabet: 'N',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_contracts',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_contracts', name: 'Employment Contracts', slug: 'employment-contracts' },
    summary:
      'A non-compete agreement restricts an employee from working for competitors or starting a rival business for a set time after leaving — but courts only enforce reasonable limits.',
    author: 'Priya Nair',
    updatedAt: 'June 15, 2026',
    readingTime: 9,
    views: 6890,
    featured: true,
    imageSeed: 'non-compete-agreement-explained',
    content: `<p>A non-compete agreement is a clause or contract in which an employee agrees not to work for a competitor, or to start a competing business, for a set period after leaving their job. Its purpose is to protect an employer's legitimate interests — trade secrets, client relationships, and investment in training — once a worker moves on. But because these clauses limit a person's ability to earn a living, courts in most countries only enforce them when the restrictions are reasonable in scope, duration, and geography.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A non-compete restricts where and for whom an employee can work after leaving.</li><li>It must protect a genuine business interest, not simply block ordinary competition.</li><li>Courts generally enforce only reasonable limits on time, geography, and activity.</li><li>Some places restrict or ban non-competes, especially for lower-paid workers.</li><li>Related clauses — non-solicitation and confidentiality — are often more readily enforced.</li></ul></div>

<h2>Why Employers Use Them</h2>
<p>Employers invest in their people — sharing confidential strategies, customer contacts, and specialised know-how. A non-compete is meant to stop a departing employee from immediately handing those advantages to a rival or using them to compete directly. The legitimate aim is to protect trade secrets and goodwill, not to punish workers or simply prevent them from finding another job. That distinction is exactly what courts scrutinise.</p>

<h2>What Makes a Non-Compete Reasonable</h2>
<p>For a non-compete to be enforceable, it usually has to be carefully limited. Courts commonly weigh three dimensions.</p>
<ul>
<li><strong>Duration:</strong> the restriction should last only as long as needed to protect the interest — often months rather than years.</li>
<li><strong>Geography:</strong> the area covered should match where the employer actually competes, not the whole country without reason.</li>
<li><strong>Scope of activity:</strong> the ban should target genuinely competitive work, not bar the person from their entire profession.</li>
</ul>
<p>A clause that is too broad in any of these is frequently struck down or narrowed, and in some jurisdictions an over-reaching clause fails entirely.</p>

<h2>Related Restrictions</h2>
<h3>Non-Solicitation</h3>
<p>A non-solicitation clause stops a former employee from poaching clients or colleagues, without preventing them from working in the field at all. Because it is narrower, it is often easier to enforce than a full non-compete.</p>
<h3>Confidentiality</h3>
<p>Confidentiality and trade-secret clauses protect specific sensitive information indefinitely while leaving the worker free to take another job. Courts tend to view these as the least restrictive and most readily enforceable way to protect an employer.</p>

<h2>How Jurisdictions Differ</h2>
<p>Attitudes to non-competes vary dramatically, and this is one area where location is decisive.</p>
<ul>
<li><strong>United States:</strong> Enforcement is largely state-based; some states uphold reasonable non-competes, while others sharply limit or ban them, particularly for lower-wage workers.</li>
<li><strong>United Kingdom:</strong> "Restrictive covenants" are enforceable only if they protect a legitimate interest and go no further than necessary; reform proposals have considered capping their length.</li>
<li><strong>European Union:</strong> Many member states permit non-competes but require limits and, in several countries, financial compensation to the employee during the restricted period.</li>
<li><strong>India:</strong> Post-employment non-competes are generally treated as restraints of trade and are largely unenforceable, though confidentiality obligations are upheld.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Drafting an over-broad clause that a court refuses to enforce at all.</li>
<li>Assuming a non-compete signed in one country will hold up in another.</li>
<li>Relying on a non-compete when a narrower non-solicitation or confidentiality clause would do.</li>
<li>For employees, signing without realising how the clause could limit future work.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you are an employee asked to sign a non-compete, read it closely, note its duration, area, and the activities it restricts, and ask whether it is realistic given how you intend to earn a living. If you are an employer, tailor any restriction narrowly to a genuine interest, as a tight, defensible clause beats a broad one that collapses in court. Because enforceability swings so much by jurisdiction, have any significant non-compete reviewed by an employment lawyer where the work is based before signing or relying on it.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'el-102',
    title: 'Employee vs Independent Contractor: The Legal Difference',
    slug: 'employee-vs-independent-contractor',
    alphabet: 'E',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_rights',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_rights', name: 'Employee Rights', slug: 'employee-rights' },
    summary:
      'The difference between an employee and an independent contractor turns on control and independence, and it determines rights, tax, and protections for the worker.',
    author: 'Daniel Okoro',
    updatedAt: 'June 6, 2026',
    readingTime: 9,
    views: 6230,
    featured: false,
    imageSeed: 'employee-vs-contractor-legal',
    content: `<p>The legal difference between an employee and an independent contractor comes down to control and independence: an employee works under the direction of an employer, while a contractor runs their own business and is hired to deliver a result. This classification is not just a label — it decides who gets paid holiday and sick leave, who pays which taxes, who carries liability, and what protections the worker enjoys. Getting it wrong can be costly for both sides.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Employees work under an employer's control; contractors operate their own independent business.</li><li>The label in a contract does not decide status — what matters is the real working relationship.</li><li>Employees usually get protections like minimum wage, paid leave, and unfair-dismissal rights.</li><li>Contractors typically handle their own taxes, tools, and risk, with fewer statutory protections.</li><li>Misclassification can lead to back pay, unpaid taxes, and penalties for the engaging business.</li></ul></div>

<h2>Why Classification Matters</h2>
<p>Status determines a long list of rights and obligations. Employees generally receive statutory protections — minimum wage, paid holiday, sick pay, pension contributions, and protection from unfair dismissal — and have income tax and social contributions handled through payroll. Independent contractors usually receive none of these as of right; instead they invoice for their work, manage their own tax, and bear their own business risk. Because so much rides on the distinction, authorities and courts look past the paperwork to the substance of the relationship.</p>

<h2>The Tests Courts Apply</h2>
<p>While the exact tests vary, several common factors recur across jurisdictions.</p>
<ul>
<li><strong>Control:</strong> does the business dictate how, when, and where the work is done, or only what result is required?</li>
<li><strong>Integration:</strong> is the worker embedded in the organisation, or do they serve multiple clients independently?</li>
<li><strong>Substitution:</strong> can the worker send someone else to do the job, as a true contractor often can?</li>
<li><strong>Financial risk:</strong> does the worker provide their own equipment, profit from efficiency, or risk loss?</li>
<li><strong>Mutuality of obligation:</strong> is there an ongoing duty to offer and accept work, typical of employment?</li>
</ul>
<p>No single factor is decisive; the overall picture of the relationship governs.</p>

<h2>Label vs Reality</h2>
<p>A contract calling someone a "contractor" does not make them one. If a person works set hours under close supervision, uses the company's equipment, and cannot realistically work for others, courts and tax authorities may find they are an employee in substance, regardless of the wording. This is the heart of <strong>misclassification</strong>: treating a worker as a contractor to avoid employment costs, when the reality is employment.</p>

<h2>The Risks of Getting It Wrong</h2>
<p>Misclassification carries real consequences for businesses. Authorities can demand back payment of taxes and social contributions, and a misclassified worker may claim unpaid holiday, minimum wage shortfalls, or unfair-dismissal compensation. Penalties and interest can be added. For workers, misclassification can mean missing out on protections they were legally entitled to, which is why many disputes are brought by individuals seeking recognition as employees.</p>

<h2>How Jurisdictions Differ</h2>
<p>The frameworks share a core idea but differ in detail.</p>
<ul>
<li><strong>United States:</strong> Various tests, including economic-reality and control-based tests, are used by different agencies, and some states apply stricter standards such as the "ABC" test.</li>
<li><strong>United Kingdom:</strong> Recognises a middle category of "worker" between employee and self-employed, with some protections, alongside genuine self-employment.</li>
<li><strong>European Union:</strong> Member states apply their own tests, and recent initiatives target platform and gig work to curb false self-employment.</li>
<li><strong>India:</strong> Distinguishes employees from independent contractors largely through control and the nature of the engagement, with implications under labour and tax law.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Assuming a written "contractor" label settles the question.</li>
<li>Treating long-term, full-time contractors exactly like staff while denying them employee rights.</li>
<li>Overlooking intermediate categories such as the UK "worker" status.</li>
<li>Ignoring that tax authorities and employment tribunals may reach different conclusions.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you engage or work as a contractor, examine the real relationship against the usual factors — control, integration, substitution, and financial risk — rather than relying on the contract's wording. Businesses should structure genuine contractor arrangements consistently and keep records that support the classification. Where the relationship is long-term, full-time, or ambiguous, take advice from an employment or tax specialist in your jurisdiction, because the cost of getting classification wrong almost always exceeds the cost of getting it checked.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
