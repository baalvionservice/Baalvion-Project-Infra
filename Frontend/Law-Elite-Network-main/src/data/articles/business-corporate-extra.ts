import type { LawArticle } from '../law-content';

const BUSINESS_CORPORATE_CATEGORY = {
  id: 'cat_business_corporate',
  name: 'Business & Corporate',
  slug: 'business-corporate',
};

export const businessCorporateExtraArticles: LawArticle[] = [
  {
    id: 'bc-101',
    title: 'LLC vs Corporation: Which Business Structure Should You Choose?',
    slug: 'llc-vs-corporation',
    alphabet: 'L',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_formation',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_formation', name: 'Company Formation', slug: 'company-formation' },
    summary:
      'An LLC offers flexible, pass-through ownership with limited liability, while a corporation suits raising outside capital — the right choice depends on tax, control, and growth plans.',
    author: 'Marcus Hale',
    updatedAt: 'June 18, 2026',
    readingTime: 10,
    views: 8240,
    featured: true,
    imageSeed: 'llc-vs-corporation-structure',
    content: `<p>An LLC (limited liability company) is a flexible business entity that shields its owners from personal liability while usually passing profits straight through to their personal tax returns. A corporation is a more formal entity, owned through shares, that is taxed in its own right and is built to raise capital from many investors. Both give you limited liability; the real decision turns on how you want to be taxed, how you plan to fund growth, and how much administrative formality you are willing to carry.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Both LLCs and corporations protect owners' personal assets from most business debts.</li><li>LLCs are flexible and typically taxed once, on the owners; corporations are taxed as separate entities and may face double taxation.</li><li>Corporations issue shares and are the natural choice for raising venture capital or going public.</li><li>LLCs carry lighter paperwork; corporations require boards, officers, minutes, and stricter formalities.</li><li>The exact rules — and even whether an "LLC" exists — vary by country, so structure choice should be checked locally.</li></ul></div>

<h2>What Each Structure Actually Is</h2>
<p>A corporation is a long-established legal form recognised almost everywhere. It exists separately from its owners, who hold shares, and it is run by directors and officers under a defined governance framework. The LLC is a newer, more flexible hybrid that originated in the United States: it offers the liability protection of a corporation but the operational simplicity and tax treatment closer to a partnership. Outside the US, the nearest equivalents are entities such as the UK private limited company, the German GmbH, or the Indian private limited company and LLP, each with its own rules.</p>

<h2>Liability Protection: The Common Ground</h2>
<p>The headline reason founders incorporate at all is limited liability. With both an LLC and a corporation, the business is a separate legal person, so creditors generally cannot pursue the owners' personal homes or savings for company debts. This protection is not absolute. Courts in many jurisdictions can "pierce the veil" where owners mix personal and business finances, commit fraud, or fail to respect the entity's separateness. Personal guarantees on loans also sit outside this shield.</p>

<h2>How They Are Taxed</h2>
<h3>Pass-Through vs Entity-Level Tax</h3>
<p>This is often the deciding factor. An LLC is usually treated as a pass-through: the company itself pays no income tax, and profits and losses flow to the owners, who report them personally. A traditional corporation is taxed on its own profits, and shareholders are then taxed again on dividends — the so-called double taxation. Many small corporations elect special regimes to avoid this where local law allows.</p>
<h3>Flexibility in the US</h3>
<p>In the United States an LLC can choose how it is taxed — as a sole proprietorship, partnership, or even a corporation — which makes it unusually adaptable. Elsewhere, tax treatment is more fixed by entity type, so the same labels do not carry the same flexibility.</p>

<h2>Raising Money and Ownership</h2>
<p>If your plan is to attract professional investors, a corporation is usually the better fit. Shares are a clean, well-understood instrument; investors expect preferred stock, option pools, and a board, all of which corporations support naturally. Venture capital funds frequently require a corporation before they will invest. LLCs can admit new members, but their membership interests are less standardised and can complicate large fundraising rounds.</p>
<ul>
<li><strong>Choose a corporation</strong> when you expect outside equity investment or an eventual public listing.</li>
<li><strong>Choose an LLC</strong> when ownership is small, stable, and you value flexible profit-sharing.</li>
</ul>

<h2>Formalities and Ongoing Admin</h2>
<p>Corporations carry more housekeeping: appointing directors and officers, holding board and shareholder meetings, keeping minutes, and following formal decision-making procedures. LLCs are lighter, governed mainly by an operating agreement that the members write themselves. That freedom is a benefit, but it also means a poorly drafted agreement can leave gaps that surface during a dispute or exit.</p>

<h2>How Jurisdictions Differ</h2>
<p>In the United States, both forms are created under state law, and founders often weigh a Delaware corporation against a home-state LLC. In the United Kingdom there is no LLC; the private limited company (Ltd) is the default, with the LLP used mainly by professional firms. Across the European Union, each member state offers its own limited-liability vehicles, such as the GmbH or SARL, with distinct capital and governance rules. In India, founders choose between a private limited company, favoured by investors, and an LLP, favoured for its lighter compliance. Because the terminology and tax consequences shift across borders, a structure that is ideal in one country can be inefficient in another.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Picking an LLC for simplicity, then needing to convert to a corporation to take venture funding.</li>
<li>Mixing personal and company money, which can undermine limited liability for either form.</li>
<li>Skipping a proper operating agreement or shareholder agreement, leaving control and exit terms unclear.</li>
<li>Assuming one country's "LLC" exists or is taxed the same way elsewhere.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Start from your goals: do you want maximum tax flexibility and light admin, or are you building toward outside investment and scale? Map those goals to the entities actually available where you will operate, and confirm the tax treatment with a local accountant before filing. A short consultation with a lawyer or tax adviser at the outset is far cheaper than restructuring during a funding round.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'bc-102',
    title: 'What Is a Non-Disclosure Agreement (NDA)?',
    slug: 'what-is-a-non-disclosure-agreement-nda',
    alphabet: 'N',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_contracts',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_contracts', name: 'Contracts', slug: 'contracts' },
    summary:
      'A non-disclosure agreement is a contract that legally binds one or both parties to keep shared information confidential and not use it for unauthorised purposes.',
    author: 'Elena Rossi',
    updatedAt: 'June 11, 2026',
    readingTime: 8,
    views: 6730,
    featured: false,
    imageSeed: 'nda-confidentiality-contract',
    content: `<p>A non-disclosure agreement, or NDA, is a contract in which one or more parties promise to keep certain information secret and to use it only for an agreed purpose. Also called a confidentiality agreement, it is one of the most common documents in business — signed before sharing a product idea, financial data, customer lists, or any other sensitive material. Its job is simple but valuable: it turns a moral expectation of discretion into a legally enforceable obligation.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>An NDA legally binds a party to keep specified information confidential and not misuse it.</li><li>NDAs can be one-way (one side discloses) or mutual (both sides share secrets).</li><li>Key terms include what counts as confidential, the permitted purpose, the duration, and the exceptions.</li><li>Common carve-outs exclude information that is already public or independently developed.</li><li>Enforceability and reasonableness standards vary by jurisdiction, so scope must be carefully drafted.</li></ul></div>

<h2>Why Businesses Use NDAs</h2>
<p>Information often has to be shared before trust is fully established — with a potential investor, a contractor, a job candidate, or a possible acquirer. Once a secret is disclosed, it cannot be un-disclosed, so the law lets parties agree in advance that the recipient will keep it confidential. An NDA gives the disclosing party a remedy if the information leaks: the ability to sue for breach and, often, to seek an injunction stopping further misuse.</p>

<h2>One-Way vs Mutual NDAs</h2>
<p>There are two basic shapes, and choosing the right one matters.</p>
<ul>
<li><strong>Unilateral (one-way):</strong> only one party discloses confidential information, and only the recipient is bound. Common when a company shares plans with a freelancer or candidate.</li>
<li><strong>Mutual (bilateral):</strong> both parties exchange secrets and both are bound. Typical when two businesses explore a partnership or merger.</li>
</ul>
<p>A mutual NDA is usually fairer and easier to negotiate when each side has something to protect.</p>

<h2>Core Terms to Understand</h2>
<h3>Defining Confidential Information</h3>
<p>The agreement should state clearly what is covered. Too narrow a definition leaves gaps; too broad a one can be unenforceable. Many NDAs cover information marked "confidential" or that a reasonable person would treat as sensitive, whether shared in writing, verbally, or visually.</p>
<h3>Purpose and Permitted Use</h3>
<p>A well-drafted NDA limits the recipient to using the information only for the stated purpose — for example, "evaluating a possible investment" — and forbids using it to compete or for personal gain.</p>
<h3>Duration</h3>
<p>Obligations usually last for a set number of years, though genuine trade secrets may be protected for as long as they remain secret. An indefinite term can be harder to enforce in some jurisdictions.</p>

<h2>Standard Exceptions</h2>
<p>NDAs almost always carve out categories that cannot fairly be treated as secret. Typical exclusions are information that:</p>
<ul>
<li>Was already public, or later becomes public through no fault of the recipient.</li>
<li>The recipient already knew before disclosure.</li>
<li>The recipient develops independently without using the disclosed material.</li>
<li>Must be disclosed by law or a court order — usually with a duty to notify the other party first.</li>
</ul>

<h2>How Enforcement Differs Across Jurisdictions</h2>
<p>The basic concept is recognised worldwide, but courts apply different reasonableness tests. In the United States, NDAs are widely enforced, though they cannot lawfully silence reports of illegal conduct, and several states limit clauses that conceal harassment. In the United Kingdom, confidentiality agreements are enforceable but cannot prevent whistleblowing or disclosures protected by law. Across the European Union, trade-secret protection is harmonised by directive, supporting NDAs while leaving room for public-interest disclosures. In India, NDAs are enforceable as contracts, though overly broad restraints — especially those resembling restrictions on trade — may be cut down by the courts. The practical lesson is that an NDA cannot override a person's legal right to report wrongdoing.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Defining confidential information so broadly that a court refuses to enforce it.</li>
<li>Omitting standard exceptions, making the agreement look unreasonable.</li>
<li>Setting no time limit, or one so long it becomes unenforceable.</li>
<li>Trying to use an NDA to hide illegal conduct, which is void in many jurisdictions.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before signing or sending an NDA, check that the definition of confidential information fits the actual situation, that the permitted purpose is clear, and that the duration and exceptions are reasonable. Avoid one-sided drafts when both parties will share secrets, and never rely on an NDA to suppress lawful disclosures. For high-value information or cross-border deals, have a contracts lawyer in the relevant jurisdiction review the wording before anything sensitive is shared.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
