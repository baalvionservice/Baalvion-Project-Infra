import type { LawArticle } from '../law-content';

const PROPERTY_REAL_ESTATE_CATEGORY = {
  id: 'cat_property_real_estate',
  name: 'Property & Real Estate',
  slug: 'property-real-estate',
};

export const propertyRealEstateExtra2Articles: LawArticle[] = [
  {
    id: 'pr-201',
    title: 'The Eviction Process Explained',
    slug: 'the-eviction-process-explained',
    alphabet: 'T',
    categoryId: 'cat_property_real_estate',
    subcategoryId: 'sub_pr_rental',
    category: PROPERTY_REAL_ESTATE_CATEGORY,
    subcategory: { id: 'sub_pr_rental', name: 'Rental Agreements', slug: 'rental-agreements' },
    summary:
      'Eviction is the legal process a landlord must follow to remove a tenant — usually requiring proper notice, a court order, and lawful enforcement, never self-help removal.',
    author: 'Sofia Almeida',
    updatedAt: 'June 22, 2026',
    readingTime: 9,
    views: 8120,
    featured: false,
    imageSeed: 'eviction-process-landlord-tenant',
    content: `<p>Eviction is the legal process by which a landlord removes a tenant from a rental property. The defining feature, in almost every fair system, is that eviction must go through proper legal channels — typically a written notice, then a court or tribunal order, and finally lawful enforcement by authorised officers. Landlords generally cannot simply change the locks, remove belongings, or cut off services to force a tenant out; doing so is usually itself unlawful. Understanding the steps protects tenants from abuse and helps landlords act without exposing themselves to liability.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Eviction must follow a legal process; "self-help" removals like lock-changing are usually illegal.</li><li>The process generally starts with a written notice stating the reason and a deadline.</li><li>If the tenant does not leave or fix the issue, the landlord must obtain a court or tribunal order.</li><li>Only authorised officials may carry out the physical removal, not the landlord directly.</li><li>Notice periods, valid grounds, and tenant protections vary significantly by jurisdiction.</li></ul></div>

<h2>Lawful Grounds for Eviction</h2>
<p>A landlord usually cannot evict on a whim; there must be a recognised reason. Common grounds include non-payment of rent, breach of the tenancy agreement (such as causing damage or unauthorised subletting), or the landlord wanting the property back at the end of a fixed term where the law allows. Many jurisdictions also prohibit "retaliatory" eviction — removing a tenant for complaining about repairs — and "discriminatory" eviction based on protected characteristics.</p>

<h2>Step 1: The Notice</h2>
<p>The process almost always begins with a formal written notice. This document tells the tenant why the landlord wants possession and how long they have to either fix the problem (for example, pay overdue rent) or leave. The required notice period and wording are strictly regulated; a defective notice can invalidate the whole process and force the landlord to start again. Tenants should read any notice carefully and note the deadline and the stated reason.</p>

<h2>Step 2: The Court or Tribunal Order</h2>
<p>If the tenant neither resolves the issue nor leaves by the deadline, the landlord cannot take matters into their own hands. The next step is to apply to a court or housing tribunal for a possession order. At this stage the tenant usually has the right to be heard and to raise defences — for instance, that the notice was invalid, the rent was actually paid, or the landlord failed to maintain the property. The decision-maker then decides whether and when possession should be granted.</p>

<h2>Step 3: Enforcement</h2>
<p>Even with an order, the landlord generally cannot physically remove the tenant personally. Enforcement is carried out by authorised officials — such as bailiffs, sheriffs, or marshals depending on the country — who give notice and then carry out the removal lawfully. This final safeguard exists to keep evictions orderly and to prevent confrontation or abuse.</p>

<h2>What Landlords Must Not Do</h2>
<p>Across most systems, certain "self-help" tactics are unlawful and can expose a landlord to penalties or damages:</p>
<ul>
<li>Changing the locks to shut a tenant out.</li>
<li>Removing or withholding the tenant's possessions.</li>
<li>Cutting off water, electricity, or heating to force a departure.</li>
<li>Using threats, harassment, or intimidation.</li>
</ul>
<p>These protections often apply even if the tenant is genuinely in breach; the remedy is the legal process, not direct action.</p>

<h2>How Eviction Works Around the World</h2>
<ul>
<li><strong>United States:</strong> Eviction (often called "unlawful detainer") is governed by state and local law, with required notices and a court process; tenant protections vary widely by city and state.</li>
<li><strong>United Kingdom:</strong> Landlords must use prescribed notices and, if needed, obtain a possession order from the court before bailiffs can act; self-eviction is a criminal offence.</li>
<li><strong>European Union:</strong> Member states have their own tenancy laws, many offering strong tenant protections and mandatory court involvement.</li>
<li><strong>India:</strong> Rent-control and tenancy laws vary by state, often requiring landlords to prove specific grounds before a rent authority or court.</li>
</ul>

<h2>Tenant Protections and Defences</h2>
<p>Tenants are rarely without recourse. Depending on the jurisdiction, they may challenge a defective notice, prove the rent was paid, show the landlord breached repair obligations, or argue the eviction is retaliatory or discriminatory. Many areas also offer hardship considerations or time to find new housing. Engaging early — responding to notices and attending hearings — is usually far more effective than ignoring the process.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Landlords using self-help removal and incurring liability or criminal penalties.</li>
<li>Serving a defective notice that resets the whole process.</li>
<li>Tenants ignoring notices or hearings and losing the chance to defend.</li>
<li>Assuming the same rules apply everywhere when protections vary sharply by region.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Whether you are a landlord or a tenant, start by identifying the exact notice and grounds rules where the property is located, since these control everything that follows. Keep written records of rent, communications, and repairs. Landlords should follow each step precisely; tenants should respond promptly and attend hearings. Given the variation in local law and the stakes involved, advice from a housing lawyer or tenant-support service early in the process is well worth seeking.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'pr-202',
    title: 'Power of Attorney Explained: Types and How It Works',
    slug: 'power-of-attorney-explained',
    alphabet: 'P',
    categoryId: 'cat_property_real_estate',
    subcategoryId: 'sub_pr_ownership',
    category: PROPERTY_REAL_ESTATE_CATEGORY,
    subcategory: { id: 'sub_pr_ownership', name: 'Ownership Rights', slug: 'ownership-rights' },
    summary:
      'A power of attorney is a legal document that lets you authorise someone to act for you on financial, property, or personal matters — within limits you define.',
    author: 'Rajesh Iyer',
    updatedAt: 'June 20, 2026',
    readingTime: 8,
    views: 6740,
    featured: false,
    imageSeed: 'power-of-attorney-authority',
    content: `<p>A power of attorney (POA) is a legal document in which one person, the principal, authorises another person, the agent or attorney-in-fact, to act on their behalf. It is one of the most useful and widely used legal tools, allowing someone to manage your property, finances, or personal affairs when you cannot — whether because you are travelling, busy, or no longer able to act for yourself. The authority can be broad or narrow, temporary or lasting, depending entirely on how the document is written.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A power of attorney lets you appoint someone to act for you within defined limits.</li><li>It can be general (broad authority) or specific (a single transaction or purpose).</li><li>A "durable" or "lasting" POA continues to operate if you lose mental capacity.</li><li>The agent owes you a fiduciary duty to act honestly and in your best interests.</li><li>Formalities, types, and registration requirements vary by jurisdiction.</li></ul></div>

<h2>What a Power of Attorney Does</h2>
<p>At its core, a POA transfers authority — not ownership — to your chosen agent. The agent can do the things the document permits, such as signing contracts, managing bank accounts, selling or buying property, or handling tax and benefits. Importantly, the principal still owns their assets; the agent is simply empowered to act for them. The scope is exactly what the document says it is, so careful drafting matters.</p>

<h2>The Main Types</h2>
<h3>General Power of Attorney</h3>
<p>This grants broad authority to handle a wide range of financial and legal matters. It is convenient but powerful, so it should only be given to someone deeply trusted. A general POA often ends if the principal loses mental capacity, unless it is made durable.</p>
<h3>Specific (or Limited) Power of Attorney</h3>
<p>This grants authority for a defined task or period — for example, to sell one particular property or operate an account while the principal is abroad. Once the task is complete or the period ends, the authority lapses.</p>
<h3>Durable or Lasting Power of Attorney</h3>
<p>This is designed to survive the principal's loss of mental capacity, making it a cornerstone of incapacity planning. Some systems offer separate documents for financial decisions and for health and personal welfare.</p>

<h2>Property and Financial Matters</h2>
<p>One of the most common uses of a POA is to manage property and money. With the right authority, an agent can pay bills, manage investments, handle rent, and even buy or sell real estate. Because property transactions are high value, many jurisdictions require POAs used for them to meet stricter formalities, such as registration or specific witnessing, before a registry or buyer will accept them.</p>

<h2>The Agent's Duties</h2>
<p>An agent is not free to do as they please. They generally owe a fiduciary duty — a legal obligation to act honestly, in the principal's best interests, to keep the principal's money separate, and to keep records. Misusing a POA for personal gain can amount to fraud or breach of duty. This is why choosing a trustworthy agent, and sometimes building in oversight or requiring two agents to act together, is so important.</p>

<h2>How and When It Ends</h2>
<p>A power of attorney can end in several ways:</p>
<ul>
<li>The principal revokes it while still mentally capable.</li>
<li>The specific task or time period it covered is completed.</li>
<li>The principal dies — after which an executor, not the agent, takes over.</li>
<li>For non-durable POAs, the principal loses mental capacity.</li>
</ul>

<h2>How It Works Across Jurisdictions</h2>
<ul>
<li><strong>United States:</strong> POAs are governed by state law, with durable powers widely used; many states have statutory forms.</li>
<li><strong>United Kingdom:</strong> Lasting Powers of Attorney for finances and for health and welfare must be registered with the relevant authority to be valid.</li>
<li><strong>European Union:</strong> Member states have their own mandate and representation laws, and cross-border recognition can require additional formalities.</li>
<li><strong>India:</strong> POAs are common for property and financial matters and may need to be registered or notarised, especially for real estate.</li>
</ul>

<h2>Common Pitfalls</h2>
<ul>
<li>Granting overly broad authority to someone who is not fully trusted.</li>
<li>Assuming a general POA survives incapacity when it may not.</li>
<li>Failing to meet formalities, so a bank or registry refuses to accept the document.</li>
<li>Not keeping records, leaving the agent open to suspicion of misuse.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Decide first what you actually need: help with a single transaction, broad ongoing management, or protection if you lose capacity. Choose your agent with great care, define their powers clearly, and check the formalities required where you live — especially for property. Because a POA hands real power to another person, having it prepared or reviewed by a lawyer is a sensible safeguard.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
