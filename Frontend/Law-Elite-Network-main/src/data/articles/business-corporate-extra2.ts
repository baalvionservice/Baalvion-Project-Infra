import type { LawArticle } from '../law-content';

const BUSINESS_CORPORATE_CATEGORY = {
  id: 'cat_business_corporate',
  name: 'Business & Corporate',
  slug: 'business-corporate',
};

export const businessCorporateExtra2Articles: LawArticle[] = [
  {
    id: 'bc-201',
    title: 'How to Form an LLC: A Step-by-Step Guide',
    slug: 'how-to-form-an-llc-step-by-step',
    alphabet: 'H',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_formation',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_formation', name: 'Company Formation', slug: 'company-formation' },
    summary:
      'Forming an LLC means choosing a name, filing formation documents with the state, appointing a registered agent, and writing an operating agreement that governs the business.',
    author: 'Marcus Hale',
    updatedAt: 'June 22, 2026',
    readingTime: 10,
    views: 8620,
    featured: true,
    imageSeed: 'form-an-llc-step-by-step',
    content: `<p>Forming a limited liability company (LLC) is the process of legally creating a business entity that separates your personal assets from the company's debts. At its core it involves a handful of repeatable steps: pick a compliant name, file a formation document with the relevant government office, appoint someone to receive legal mail, write the rules that will govern the business, and register for the tax and licence numbers you need to operate. Done carefully, this turns a private venture into a recognised legal person that can sign contracts, open accounts, and shield its owners.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>An LLC is formed by filing a formation document (often called articles of organisation) with a government registry.</li><li>You must choose a unique, compliant name and appoint a registered agent for legal correspondence.</li><li>An operating agreement sets out ownership, management, and profit-sharing — and is strongly advised even when not legally required.</li><li>After formation you usually need a tax identification number and any local licences or permits.</li><li>The "LLC" label exists mainly in the US; other countries use equivalent vehicles with their own steps.</li></ul></div>

<h2>Step 1: Choose and Clear a Name</h2>
<p>Your company name must be distinguishable from existing registered entities and usually has to include a designator such as "LLC" or "Limited Liability Company". Before committing, search the official business registry to confirm the name is available, and check that a matching domain and trademark are not already taken by someone else. Many jurisdictions let you reserve a name for a short period while you complete the rest of the paperwork.</p>

<h2>Step 2: Appoint a Registered Agent</h2>
<p>A registered agent is a person or company with a physical address in the jurisdiction who agrees to receive legal documents and official notices on the LLC's behalf. This ensures the business can always be reached for lawsuits or government correspondence. You can often act as your own agent, but many owners use a professional service to keep their home address private and to avoid missing time-sensitive notices.</p>

<h2>Step 3: File the Formation Document</h2>
<p>This is the step that actually creates the LLC. You file a short document — commonly called the articles of organisation or certificate of formation — with the relevant government office and pay a filing fee. The document typically states the company name, its address, the registered agent, and sometimes the names of the owners (called members) or managers. Once accepted, the LLC legally exists.</p>

<h2>Step 4: Write an Operating Agreement</h2>
<h3>Why It Matters</h3>
<p>An operating agreement is the internal rulebook of the LLC. It records who owns what percentage, how profits and losses are split, how decisions are made, and what happens if a member wants to leave or the company is dissolved. Even single-member LLCs benefit from one, because it reinforces the separation between owner and business that limited liability depends on.</p>
<h3>What to Include</h3>
<ul>
<li>Each member's ownership share and capital contribution.</li>
<li>How the company is managed — by members directly or by appointed managers.</li>
<li>Voting rights and how disputes are resolved.</li>
<li>Procedures for adding members, transferring interests, or winding up.</li>
</ul>

<h2>Step 5: Get Tax IDs and Open a Bank Account</h2>
<p>Most LLCs need a tax identification number to hire employees, open a business bank account, and file returns. Keeping company money in a dedicated account — never mixed with personal funds — is one of the most important habits for preserving limited liability. Commingling finances is a common reason courts "pierce the veil" and hold owners personally responsible.</p>

<h2>Step 6: Handle Licences, Permits, and Ongoing Filings</h2>
<p>Forming the entity is not the end. Depending on your industry and location you may need local business licences, professional permits, or sales-tax registration. Most jurisdictions also require ongoing compliance, such as an annual report and fee, to keep the LLC in good standing. Missing these can lead to penalties or even administrative dissolution.</p>

<h2>How This Works Across Jurisdictions</h2>
<p>In the United States, LLCs are formed under state law, and founders sometimes choose a business-friendly state such as Delaware, though most register where they actually operate. The United Kingdom has no LLC; the closest routes are the private limited company (Ltd), formed through the companies registry, or the LLP for professional firms. Across the European Union, each country offers its own limited-liability vehicle — such as the GmbH or SARL — each with distinct capital and filing rules. In India, founders typically form a private limited company or an LLP through the corporate affairs registry, with their own incorporation steps and digital signature requirements. The concept of limited liability is universal; the exact filings are not.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Skipping the operating agreement, leaving ownership and exit terms unclear.</li>
<li>Mixing personal and business money, undermining the liability shield.</li>
<li>Forgetting annual reports or fees, causing the LLC to fall out of good standing.</li>
<li>Assuming a US-style "LLC" exists, or is taxed the same way, in another country.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Begin by confirming which entity actually delivers limited liability where you intend to operate, then work through the filing steps in order and keep copies of every document. Set calendar reminders for ongoing filings so the company stays compliant. For anything beyond a simple single-owner business — multiple members, outside investment, or cross-border operations — a short consultation with a local lawyer or accountant before you file is well worth the cost.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'bc-202',
    title: 'Breach of Contract: Remedies and What You Can Recover',
    slug: 'breach-of-contract-remedies',
    alphabet: 'B',
    categoryId: 'cat_business_corporate',
    subcategoryId: 'sub_bc_contracts',
    category: BUSINESS_CORPORATE_CATEGORY,
    subcategory: { id: 'sub_bc_contracts', name: 'Contracts', slug: 'contracts' },
    summary:
      'When a contract is broken, the law offers remedies such as damages, specific performance, or cancellation — aimed at putting the wronged party where the contract promised they would be.',
    author: 'Elena Rossi',
    updatedAt: 'June 20, 2026',
    readingTime: 9,
    views: 6480,
    featured: false,
    imageSeed: 'breach-of-contract-remedies',
    content: `<p>A breach of contract happens when one party fails to do what they legally promised — by not performing at all, performing late, or performing badly. When that occurs, the law gives the injured party a set of remedies designed not to punish the wrongdoer but to make the wronged party whole: to put them, as far as money can, in the position they would have enjoyed had the contract been honoured. Knowing which remedies exist, and which fit your situation, is the difference between absorbing a loss and recovering it.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A breach is a failure to perform a contractual obligation without lawful excuse.</li><li>The most common remedy is damages — money to compensate for the loss caused by the breach.</li><li>Courts can order specific performance (actually doing the promised act) where money is inadequate.</li><li>The injured party usually has a duty to mitigate, meaning they must take reasonable steps to limit their losses.</li><li>Remedies and their limits vary by jurisdiction, and many contracts specify their own remedy clauses.</li></ul></div>

<h2>What Counts as a Breach</h2>
<p>Not every shortfall is a breach that justifies major remedies. Lawyers often distinguish a material breach — a serious failure that defeats the purpose of the contract — from a minor breach, where performance is mostly delivered but falls short in some respect. A material breach may allow the innocent party to stop performing and sue; a minor breach usually only entitles them to compensation for the specific shortfall. There is also "anticipatory breach", where one party makes clear in advance that they will not perform, allowing the other to act immediately.</p>

<h2>Damages: The Default Remedy</h2>
<h3>Compensatory Damages</h3>
<p>The standard remedy is money damages that compensate for the actual loss. These are usually measured by the "expectation" principle — the value the injured party expected to receive — plus any direct costs caused by the breach. The goal is restoration, not enrichment.</p>
<h3>Other Categories of Damages</h3>
<ul>
<li><strong>Consequential damages:</strong> further losses that flow from the breach, recoverable if they were reasonably foreseeable.</li>
<li><strong>Liquidated damages:</strong> a sum the parties agreed in advance, enforceable if it is a genuine estimate rather than a penalty.</li>
<li><strong>Nominal damages:</strong> a small symbolic sum where a breach occurred but caused no measurable loss.</li>
</ul>

<h2>When Money Is Not Enough: Equitable Remedies</h2>
<p>Sometimes damages cannot truly compensate the injured party — for example, when the subject of the contract is unique, such as a specific property or a rare item. In those cases courts may grant equitable remedies:</p>
<ul>
<li><strong>Specific performance:</strong> an order compelling the breaching party to actually carry out their promise.</li>
<li><strong>Injunction:</strong> an order stopping a party from doing something that would breach the contract.</li>
<li><strong>Rescission:</strong> cancelling the contract and returning both parties to their pre-contract position.</li>
</ul>
<p>Equitable remedies are discretionary, so a court will weigh fairness, delay, and the conduct of both sides before granting them.</p>

<h2>The Duty to Mitigate</h2>
<p>A frequently overlooked point is that the injured party generally cannot sit back and let losses pile up. The law expects them to take reasonable steps to reduce the harm — for instance, finding a replacement supplier or re-letting a property. Losses that could have been reasonably avoided are usually not recoverable, so prompt, sensible action after a breach protects your claim.</p>

<h2>How Remedies Differ Across Jurisdictions</h2>
<p>The core ideas are widely shared, but the details vary. In the United States, contract remedies are governed largely by state common law and, for goods, the Uniform Commercial Code, with specific performance treated as exceptional. In the United Kingdom, damages are the primary remedy and specific performance is granted sparingly, mainly where damages would be inadequate. Across the European Union, civil-law systems often treat the right to demand actual performance more readily than common-law systems do. In India, the Indian Contract Act and the Specific Relief Act set out damages and, after recent reform, a broader role for specific performance. Because these frameworks differ, the realistic remedy for the same breach can vary by country.</p>

<h2>Common Pitfalls</h2>
<ul>
<li>Assuming you can always force the other side to perform — courts usually prefer damages.</li>
<li>Failing to mitigate, which can shrink or eliminate recovery.</li>
<li>Treating a minor breach as grounds to walk away, then being sued yourself.</li>
<li>Ignoring remedy or limitation clauses already written into the contract.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If a contract has been broken, start by reading the agreement itself: many contain clauses on remedies, notice, and dispute resolution that control what you can do next. Document the breach and your losses, and take reasonable steps to limit further harm. Then seek advice from a contracts lawyer in the relevant jurisdiction before sending threats or terminating — the strongest remedy is often not the most obvious one, and a wrong move can weaken your position.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
