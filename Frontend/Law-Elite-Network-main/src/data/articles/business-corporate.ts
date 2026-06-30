import type { LawArticle } from '../law-content';

export const businessCorporateArticles: LawArticle[] = [
  {
    id: 'bc-001',
    title: 'What Is a Shareholder Agreement?',
    slug: 'shareholder-agreements-explained',
    alphabet: 'S',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_shareholder',
    category: { id: 'cat_business_corporate', name: 'Business & Corporate', slug: 'business-corporate' },
    subcategory: { id: 'sub_bc_shareholder', name: 'Shareholder Agreements', slug: 'shareholder-agreements' },
    summary: 'A shareholder agreement is a private contract among a company\'s owners that governs how they share control, profits, and exit rights.',
    author: 'Elena Rossi',
    updatedAt: 'May 14, 2026',
    readingTime: 10,
    views: 8700,
    featured: true,
    imageSeed: 'lawelite-shareholder-pact',
    content: `<p>A shareholder agreement is a private contract signed by some or all of the owners of a company. While a company\'s constitution or articles set the public, default rules, a shareholder agreement adds a confidential layer that spells out how the owners will actually run the business, divide profits, resolve disputes, and leave. It is one of the most useful documents a privately held company can have, yet many founders skip it until a conflict makes the gap painfully obvious.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A shareholder agreement is a private contract that supplements, but does not replace, a company\'s constitution or articles of association.</li><li>It typically covers decision-making rights, share transfers, exit terms, dividends, and dispute resolution.</li><li>Transfer controls such as pre-emption rights, drag-along, and tag-along clauses protect both majority and minority owners.</li><li>The agreement binds only its signatories, so coverage gaps appear when new owners join without signing.</li><li>Enforceability and required formalities differ across jurisdictions, so local legal review is essential.</li></ul></div>

<h2>Why Companies Use Them</h2>
<p>Default company law and a standard constitution rarely address the practical questions that cause owners to fall out. A shareholder agreement lets the parties negotiate tailored terms in advance, while relationships are still cooperative. Because it is private, it can also keep sensitive commercial arrangements out of public filings, which in many countries are open to inspection.</p>
<p>The agreement is most valuable in companies with a small number of owners, joint ventures, and venture-backed startups, where the balance of power and the path to an eventual sale or buyout are central concerns.</p>

<h2>Core Provisions</h2>
<h3>Control and Decision-Making</h3>
<p>Agreements often list "reserved matters" that require a higher threshold of approval, such as issuing new shares, taking on major debt, or changing the business\'s direction. This protects minority owners from being overridden on decisions that affect the value of their stake.</p>

<h3>Share Transfers and Exit</h3>
<p>Restricting how and to whom shares can be sold keeps ownership stable. Common mechanisms include:</p>
<ul>
<li><strong>Pre-emption rights:</strong> existing owners get first refusal before shares are offered to outsiders.</li>
<li><strong>Tag-along:</strong> minority owners can join a sale on the same terms as a departing majority owner.</li>
<li><strong>Drag-along:</strong> a majority can compel minority owners to sell so a buyer can acquire the whole company.</li>
<li><strong>Good-leaver and bad-leaver terms:</strong> the price paid for a departing owner\'s shares depends on the circumstances of departure.</li>
</ul>

<h3>Money and Information</h3>
<p>Provisions on dividend policy, further funding obligations, and the right to receive accounts and reports clarify what each owner can expect financially and how transparent management must be.</p>

<h2>Protecting Minority Owners</h2>
<p>Without contractual protection, a minority stake can be worth little in practice because the majority controls dividends, salaries, and the timing of any sale. Reserved matters, information rights, and tag-along clauses are the usual tools for rebalancing this. Some jurisdictions also offer statutory remedies for "unfair prejudice" or oppression, but litigation is slow and costly, so a clear agreement is the better first line of defense.</p>

<h2>How Rules Vary Across Jurisdictions</h2>
<p>The concept exists worldwide, but the detail differs. In the United States, shareholder agreements are common in closely held corporations and LLC operating agreements, with rules varying by state. In the United Kingdom, the agreement sits alongside the articles, and a conflict between them is usually resolved by amending the articles by special resolution. Across the European Union, member states apply their own company-law codes, so formalities and enforceability are not uniform. In India, the agreement operates with the Companies Act, and courts have generally enforced transfer restrictions only when they are also reflected in the company\'s articles. The practical lesson is that a clause valid in one country may be unenforceable in another.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Letting the agreement contradict the constitution, creating uncertainty about which governs.</li>
<li>Failing to require new owners to sign on, leaving the agreement only partly binding.</li>
<li>Vague valuation methods that trigger disputes exactly when an owner is leaving.</li>
<li>Ignoring deadlock between equal owners, with no tie-breaker or buyout route.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Map out the realistic scenarios that could divide the owners — a death, a sale, a falling out, a need for more capital — and check that the draft answers each one. Make sure the agreement and the constitution are consistent, that valuation and exit mechanics are concrete, and that every current and future owner is bound. Then have it reviewed by a lawyer familiar with company law where the business is incorporated.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'bc-002',
    title: 'How to Form a Company: A Practical Overview',
    slug: 'company-formation-overview',
    alphabet: 'H',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_formation',
    category: { id: 'cat_business_corporate', name: 'Business & Corporate', slug: 'business-corporate' },
    subcategory: { id: 'sub_bc_formation', name: 'Company Formation', slug: 'company-formation' },
    summary: 'Company formation is the legal process of registering a business as a separate entity, choosing a structure that fits liability, tax, and growth needs.',
    author: 'Marcus Hale',
    updatedAt: 'April 22, 2026',
    readingTime: 9,
    views: 6100,
    featured: false,
    imageSeed: 'lawelite-company-incorporation',
    content: `<p>Forming a company means creating a legal entity that exists separately from the people who own it. Once registered, the company can sign contracts, hold property, sue, and be sued in its own name. This separation is the foundation of limited liability, which generally shields owners\' personal assets from business debts. The process is broadly similar around the world, though the names of forms, the registries, and the tax consequences differ from country to country.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Incorporation creates a separate legal entity, which is what enables limited liability for owners.</li><li>The choice of structure affects liability, tax, paperwork, and the ability to raise outside investment.</li><li>Most jurisdictions require a unique name, a registered address, named directors or officers, and a governing document.</li><li>Registration is only the start — ongoing filing, tax, and record-keeping duties follow.</li><li>Cross-border founders must weigh where to incorporate against where the business actually operates.</li></ul></div>

<h2>Choosing a Business Structure</h2>
<p>The structure you pick shapes everything that follows. The main options, under varying local names, include:</p>
<ul>
<li><strong>Sole proprietorship:</strong> simplest to start, but the owner is personally liable for all debts.</li>
<li><strong>Partnership:</strong> two or more owners share profits and, in a general partnership, personal liability.</li>
<li><strong>Limited liability company:</strong> a flexible entity (an LLC in the US, a private limited company elsewhere) that caps owner liability.</li>
<li><strong>Corporation:</strong> a more formal entity suited to raising capital and issuing shares to many investors.</li>
</ul>
<p>Owners weigh limited liability, tax treatment, administrative burden, and credibility with customers and investors when deciding.</p>

<h2>Common Steps to Register</h2>
<h3>Name and Address</h3>
<p>Most registries require a unique name that is not deceptively similar to an existing one and does not use restricted words. A registered office address is also needed to receive official correspondence.</p>

<h3>Governing Documents and People</h3>
<p>Incorporation usually requires a founding document — articles of incorporation, a constitution, or a memorandum and articles of association — plus the appointment of at least one director or officer and identification of the owners. Many countries now require disclosure of the ultimate beneficial owners as part of anti-money-laundering rules.</p>

<h3>Filing and Fees</h3>
<p>The application is submitted to a government registry, such as Companies House in the UK, a Secretary of State in the US, or the Ministry of Corporate Affairs portal in India. After review and payment of a fee, the registry issues a certificate confirming the company exists.</p>

<h2>After Registration</h2>
<p>Forming the company is not the finish line. Typical follow-on tasks include:</p>
<ul>
<li>Registering for tax and, where applicable, value-added or sales tax.</li>
<li>Opening a dedicated business bank account to keep finances separate.</li>
<li>Obtaining any licenses required for the specific trade or sector.</li>
<li>Setting up statutory registers and a system for annual filings.</li>
</ul>

<h2>How Jurisdictions Differ</h2>
<p>In the United States, companies are formed under state law, and Delaware is a popular choice for its developed corporate case law. The United Kingdom offers fast, low-cost online incorporation through a single national registry. Across the European Union, each member state has its own rules, though several directives have harmonized aspects of disclosure. In India, incorporation is largely digital but involves obtaining director identification and digital signatures first. Founders operating internationally should not assume the cheapest or fastest registry is best; tax residence, where customers are, and where staff sit often matter more.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Mixing personal and company money, which can undermine limited liability.</li>
<li>Choosing a structure for short-term simplicity that blocks future fundraising.</li>
<li>Missing annual filing deadlines, which can lead to penalties or being struck off.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Start by clarifying your goals: liability protection, tax efficiency, and whether you plan to bring in investors. Match those goals to a structure, confirm the registration requirements in the country where you will operate, and put a calendar in place for ongoing filings from day one. A short consultation with a local lawyer or accountant before filing can prevent costly restructuring later.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'bc-003',
    title: 'Startup Law Basics Every Founder Should Know',
    slug: 'startup-law-basics-for-founders',
    alphabet: 'S',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_startup',
    category: { id: 'cat_business_corporate', name: 'Business & Corporate', slug: 'business-corporate' },
    subcategory: { id: 'sub_bc_startup', name: 'Startup Law', slug: 'startup-law' },
    summary: 'Startup law covers the early legal decisions — equity, intellectual property, and fundraising — that quietly determine whether a young company can grow.',
    author: 'Priya Menon',
    updatedAt: 'June 3, 2026',
    readingTime: 9,
    views: 4300,
    featured: false,
    imageSeed: 'lawelite-startup-foundations',
    content: `<p>Startup law is not a single field but the cluster of legal decisions that founders face in a company\'s earliest months: how to split ownership, who owns the intellectual property, how to bring on a team, and how to take in outside money without losing control. These choices are made quickly and cheaply at the start, yet they shape the company\'s value for years. Getting the foundations right is far easier than untangling them later during a funding round or acquisition.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Founder equity should usually vest over time so that ownership reflects continued contribution.</li><li>Intellectual property must be assigned to the company, not left with individual founders or contractors.</li><li>Early fundraising instruments such as convertible notes and SAFEs delay setting a fixed valuation.</li><li>Compliant hiring, equity, and data practices reduce the risk of problems surfacing during due diligence.</li><li>Rules on securities, employment, and IP differ by country, so structures should be checked locally.</li></ul></div>

<h2>Founder Equity and Vesting</h2>
<p>Dividing ownership among founders is one of the first and most consequential decisions. A common safeguard is vesting: founders earn their shares over a period, often four years, with a one-year "cliff" before any shares vest. If a founder leaves early, unvested shares return to the company. This protects the remaining team and the company\'s ability to recruit replacements.</p>
<p>Documenting equity clearly — through share issuances and, where used, a shareholder agreement — prevents disputes about who owns what when the stakes rise.</p>

<h2>Owning the Intellectual Property</h2>
<p>Investors and acquirers expect the company itself to own its core technology, brand, and code. Two gaps commonly cause trouble:</p>
<ul>
<li><strong>Founder-created IP:</strong> work done before incorporation should be formally assigned to the company.</li>
<li><strong>Contractor and employee work:</strong> default rules on who owns created work vary, so written assignment and confidentiality terms are essential.</li>
</ul>
<p>Trademarks for the company name and product, plus sensible protection of trade secrets, round out the early IP position.</p>

<h2>Raising Early Money</h2>
<h3>Convertible Instruments</h3>
<p>Young companies often raise funds before they can credibly set a valuation. Convertible notes and SAFEs (simple agreements for future equity) let investors put in money now in exchange for shares later, typically at a discount when a priced round happens. They are faster and cheaper than negotiating a full equity round.</p>

<h3>Securities Rules</h3>
<p>Offering shares or convertible instruments is regulated almost everywhere. Founders generally must rely on exemptions for private placements and keep careful records of who invested and how they were approached. Ignoring these rules can create liability that surfaces years later.</p>

<h2>Building the Team Compliantly</h2>
<p>Early hiring decisions carry legal weight. Key areas include:</p>
<ul>
<li>Correctly classifying workers as employees or contractors under local law.</li>
<li>Setting up an employee equity or option pool with clear terms.</li>
<li>Meeting basic employment, tax-withholding, and benefits obligations.</li>
</ul>

<h2>How Jurisdictions Differ</h2>
<p>In the United States, the SAFE originated in the startup ecosystem and Delaware C-corporations are common for venture-backed companies. The United Kingdom offers tax-advantaged investment schemes such as SEIS and EIS that shape how early rounds are structured. Across the European Union, employment protections are generally stronger, affecting how teams are built and equity is granted. In India, foreign investment rules and securities regulations influence how startups raise and structure capital. A model that is standard in one market can be inefficient or non-compliant in another.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Splitting equity with no vesting, then losing a co-founder early.</li>
<li>Leaving IP in personal hands or with unpaid contractors.</li>
<li>Raising money informally without regard to securities exemptions.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before raising outside money, make sure the cap table is clean, equity vests, and all IP is assigned to the company. Keep organized records of investments, contracts, and equity grants so a future due-diligence process is straightforward. Engage a startup-focused lawyer in your jurisdiction early — the cost is modest compared with fixing foundational problems during a funding round.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
