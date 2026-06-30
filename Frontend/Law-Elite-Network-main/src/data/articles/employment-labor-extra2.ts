import type { LawArticle } from '../law-content';

const EMPLOYMENT_LABOR_CATEGORY = {
  id: 'cat_employment_labor',
  name: 'Employment & Labor',
  slug: 'employment-labor',
};

export const employmentLaborExtra2Articles: LawArticle[] = [
  {
    id: 'el-201',
    title: 'What Is At-Will Employment?',
    slug: 'what-is-at-will-employment',
    alphabet: 'W',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_rights',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_rights', name: 'Employee Rights', slug: 'employee-rights' },
    summary:
      'At-will employment lets either employer or employee end the job at any time, for almost any reason — but important legal exceptions stop it from meaning "for any reason at all".',
    author: 'Daniel Okoro',
    updatedAt: 'June 23, 2026',
    readingTime: 8,
    views: 7320,
    featured: false,
    imageSeed: 'at-will-employment-explained',
    content: `<p>At-will employment is an arrangement in which either the employer or the employee can end the working relationship at any time, with or without notice, and for almost any reason — or no reason at all. It is the default model in the United States and shapes how millions of jobs operate there. But "at any reason" is not the same as "for any reason whatsoever": a web of legal exceptions means employers still cannot fire someone for unlawful reasons such as discrimination or retaliation. Understanding both the freedom and its limits is essential for workers and employers alike.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>At-will employment lets either side end the job at any time, generally without cause.</li><li>It is the default in most US states but is not how most other countries work.</li><li>Important exceptions forbid firing for illegal reasons like discrimination or retaliation.</li><li>Contracts, policies, and implied promises can limit or override at-will status.</li><li>Outside the US, many systems require a valid reason and notice to dismiss.</li></ul></div>

<h2>What "At-Will" Really Means</h2>
<p>The core idea is mutual freedom to walk away. An employee can quit whenever they like, and an employer can dismiss them whenever they like, without having to show "just cause". This contrasts sharply with systems where dismissal requires a legitimate reason and a fair process. In an at-will relationship, the absence of a fixed term or a "for cause" requirement is the defining feature.</p>

<h2>The Critical Exceptions</h2>
<p>At-will employment is not a licence to fire for any motive. Several major categories of unlawful dismissal apply even to at-will workers:</p>
<ul>
<li><strong>Anti-discrimination law:</strong> an employee cannot be fired because of protected characteristics such as race, sex, religion, age, or disability.</li>
<li><strong>Retaliation:</strong> firing someone for whistleblowing, filing a complaint, or exercising a legal right is generally prohibited.</li>
<li><strong>Public policy:</strong> dismissing an employee for refusing to break the law, or for jury duty, is often unlawful.</li>
<li><strong>Contract and implied promises:</strong> a written contract, union agreement, or even an employee handbook can create job protections that override at-will status.</li>
</ul>

<h2>When At-Will Does Not Apply</h2>
<p>Many employees assume they are at-will when they are not. A fixed-term contract, a collective bargaining agreement, or specific promises about job security can all limit an employer's freedom to dismiss. Some courts also recognise an implied covenant of good faith, or rely on representations in company policies. Reading your contract and any handbook carefully is the only way to know where you actually stand.</p>

<h2>Practical Effects for Employees</h2>
<p>For workers, at-will status means job security depends heavily on the employer's goodwill and the legal exceptions. It does not mean you are powerless: if you are dismissed for a discriminatory or retaliatory reason, you may have a strong claim despite being at-will. Keeping records of your performance, communications, and any concerns you raised can be vital if a dismissal later looks unlawful.</p>

<h2>Practical Effects for Employers</h2>
<p>Employers benefit from flexibility but must be careful. Documenting legitimate, non-discriminatory reasons for dismissals, applying policies consistently, and avoiding statements that imply job security all reduce the risk of a wrongful-termination claim. Treating "at-will" as a shield against all liability is a common and costly mistake.</p>

<h2>How This Compares Around the World</h2>
<ul>
<li><strong>United States:</strong> At-will employment is the default in most states, subject to the exceptions above; a few jurisdictions narrow it further.</li>
<li><strong>United Kingdom:</strong> Employees with qualifying service gain protection from unfair dismissal, requiring a fair reason and process — there is no broad at-will rule.</li>
<li><strong>European Union:</strong> Member states generally require valid grounds and notice for dismissal, often with strong worker protections.</li>
<li><strong>India:</strong> Employment is governed by contract and labour legislation, with procedural requirements for terminating many categories of workers.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Assuming at-will means an employer can fire for literally any reason, ignoring legal exceptions.</li>
<li>Overlooking contract or handbook terms that limit at-will status.</li>
<li>Employers firing without documenting a lawful reason, inviting a claim.</li>
<li>Employees abroad assuming US-style at-will rules apply to them when they do not.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you are unsure of your status, read your employment contract and any company policies closely, and identify which jurisdiction's rules govern your job. Keep records of performance and any complaints you raise. If you are dismissed and suspect an unlawful reason — discrimination, retaliation, or breach of contract — consult an employment lawyer promptly, because time limits for claims can be short and early advice often shapes the outcome.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'el-202',
    title: 'What Is a Severance Agreement?',
    slug: 'what-is-a-severance-agreement',
    alphabet: 'W',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_contracts',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_contracts', name: 'Employment Contracts', slug: 'employment-contracts' },
    summary:
      'A severance agreement is a contract offering a departing employee pay or benefits, usually in exchange for promises like waiving the right to sue — so it should be read carefully.',
    author: 'Marcus Whitfield',
    updatedAt: 'June 20, 2026',
    readingTime: 8,
    views: 6210,
    featured: false,
    imageSeed: 'severance-agreement-explained',
    content: `<p>A severance agreement is a contract between an employer and a departing employee that sets out what the employee will receive on leaving — typically a payment or continued benefits — and what they must give in return. Most often, the central exchange is money in return for the employee agreeing not to sue the employer over the employment or its ending. Because these agreements ask employees to give up valuable legal rights, they deserve careful reading and, often, professional advice before signing.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A severance agreement offers pay or benefits to a departing employee in exchange for promises.</li><li>The most common term is a release waiving the right to sue the employer.</li><li>Severance is frequently negotiable, not a fixed take-it-or-leave-it offer.</li><li>Other clauses may cover confidentiality, references, and non-disparagement.</li><li>Whether severance is required, and how releases are enforced, varies by jurisdiction.</li></ul></div>

<h2>Why Employers Offer Severance</h2>
<p>Severance is not always legally required; in many places employers offer it voluntarily. The main reason is certainty. By paying a departing employee, the employer usually obtains a signed release in return — closing off the risk of a future lawsuit over discrimination, wrongful dismissal, or unpaid entitlements. Severance can also smooth a layoff, protect the company's reputation, and maintain goodwill among remaining staff.</p>

<h2>What You Give Up: The Release</h2>
<p>The heart of most severance agreements is the release of claims. By signing, the employee typically agrees not to bring legal action arising from their employment or its termination. This is precisely why the document matters so much: accepting the payment usually means surrendering the right to sue, even if a valid claim existed. Some rights cannot be waived — for example, the ability to report certain unlawful conduct — but many can.</p>

<h2>Common Clauses to Watch</h2>
<ul>
<li><strong>Confidentiality:</strong> a promise to keep the agreement, or company information, private.</li>
<li><strong>Non-disparagement:</strong> an agreement not to make negative public statements about the employer.</li>
<li><strong>Non-compete or non-solicitation:</strong> restrictions on working for rivals or poaching clients and staff, where enforceable.</li>
<li><strong>References:</strong> sometimes the employer agrees to provide a neutral or agreed reference.</li>
<li><strong>Return of property and benefits continuation:</strong> terms on equipment, final pay, and continued health or other benefits.</li>
</ul>

<h2>Severance Is Often Negotiable</h2>
<p>A frequent misconception is that a severance offer is fixed. In reality, the amount and terms are often open to negotiation, especially if the employee has potential legal claims or valuable knowledge. Points commonly negotiated include the size of the payment, the length of benefit continuation, the wording of references, and the scope of restrictive clauses. Treating the first offer as final can leave value on the table.</p>

<h2>Take Time Before Signing</h2>
<p>Severance agreements should never be signed under pressure. Many jurisdictions give employees a defined period to consider an agreement, and sometimes a window to revoke it after signing, particularly where age-discrimination rights are being waived. Using that time to read every clause, understand exactly what is being given up, and seek advice is one of the most important protections an employee has.</p>

<h2>How Severance Works Around the World</h2>
<ul>
<li><strong>United States:</strong> Severance is usually voluntary and contractual, with releases widely enforced subject to specific rules for waiving certain claims.</li>
<li><strong>United Kingdom:</strong> "Settlement agreements" require the employee to receive independent legal advice to validly waive employment claims.</li>
<li><strong>European Union:</strong> Many member states mandate statutory severance or redundancy pay, on top of any negotiated agreement.</li>
<li><strong>India:</strong> Retrenchment and severance entitlements are set by labour law for certain workers, alongside any contractual terms.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Signing quickly without realising you are waiving the right to sue.</li>
<li>Assuming the offer is non-negotiable when it often is.</li>
<li>Overlooking restrictive clauses like non-competes that affect future work.</li>
<li>Failing to check whether statutory severance is owed on top of the offer.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you are offered a severance agreement, do not rush. Read every clause, identify exactly what rights you are being asked to release, and confirm whether any statutory entitlements apply regardless. Where the sums are significant or you suspect a legal claim, have an employment lawyer review the document — in some jurisdictions this advice is even a legal requirement for the waiver to be valid.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
