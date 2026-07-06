import type { LawArticle } from '../law-content';

const propertyRealEstateCategory = {
  id: 'cat_property_real_estate',
  name: 'Property & Real Estate',
  slug: 'property-real-estate',
} as const;

export const propertyRealEstateArticles: LawArticle[] = [
  {
    id: 'pr-001',
    title: 'What to Check Before Buying Property',
    slug: 'what-to-check-before-buying-property',
    alphabet: 'W',
    categoryId: 'cat_property_real_estate',
    subcategoryId: 'sub_pr_trans',
    category: propertyRealEstateCategory,
    subcategory: {
      id: 'sub_pr_trans',
      name: 'Real Estate Transactions',
      slug: 'real-estate-transactions',
    },
    summary:
      'A practical guide to the legal checks every buyer should complete before signing a contract or paying for a property, anywhere in the world.',
    author: 'Priya Nair',
    updatedAt: 'March 14, 2026',
    readingTime: 9,
    views: 7420,
    featured: true,
    imageSeed: 'buying-property-checklist',
    content: `<p>Buying property is, for most people, the largest single transaction they will ever make. Yet many buyers focus on the price and the view while overlooking the legal questions that decide whether they will actually own what they think they are buying. A property transaction transfers <strong>title</strong> — the legal right to own and use land — and the buyer's job before completion is to confirm that the seller can pass good title free of unwelcome surprises. This process of verification is known as <strong>due diligence</strong>, and skipping it is the single most common cause of expensive property disputes.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Confirm the seller genuinely owns the property and has the legal right to sell it.</li><li>Search for encumbrances — mortgages, liens, easements, and charges that travel with the land.</li><li>Verify boundaries, permitted use, and that buildings have proper approvals.</li><li>Read the contract carefully and understand exactly when ownership and risk pass to you.</li><li>Budget for taxes, registration fees, and other transaction costs beyond the headline price.</li></ul></div>

<h2>Confirm Who Really Owns the Property</h2>
<p>The first question is deceptively simple: does the seller own the property, and may they sell it? Ownership is evidenced by a <strong>deed</strong> (the document transferring title) and, in most modern systems, by an entry in a public land register. In jurisdictions with registered title — such as England and Wales, much of the EU, and Australia's Torrens system — the register is generally conclusive proof of ownership. In the United States, ownership is more often traced through a chain of recorded deeds, which is why buyers there typically obtain <strong>title insurance</strong>. In parts of India and other countries with mixed systems, you may need to examine decades of historical documents.</p>
<h3>Documents to request</h3>
<ul><li>The current title deed or an official extract from the land register.</li><li>Proof of the seller's identity matching the registered owner.</li><li>Prior sale deeds or a title history establishing an unbroken chain of ownership.</li><li>Where the seller is a company, evidence that it is authorised to sell.</li></ul>

<h2>Search for Encumbrances</h2>
<p>An <strong>encumbrance</strong> is any right or claim that burdens the property and may pass to you on purchase. Common examples include a mortgage securing the seller's loan, a <strong>lien</strong> for unpaid taxes or debts, an <strong>easement</strong> granting a neighbour a right of way, and restrictive covenants limiting what you may build. Because many encumbrances run with the land rather than with the owner, you can inherit them even though you never agreed to them. A thorough search of the land register and relevant public records reveals most of these before you are bound.</p>

<h2>Verify Boundaries, Use, and Approvals</h2>
<p>Owning the land is not the same as being free to use it as you wish. Zoning and planning rules dictate whether a plot may be used for residential, commercial, or agricultural purposes, and unauthorised construction can lead to demolition orders or fines that fall on the new owner.</p>
<h3>Practical checks</h3>
<ul><li>Compare the physical boundaries on the ground with the registered plan or survey.</li><li>Confirm that any structures have building permits and occupancy or completion certificates.</li><li>Check zoning or planning designations for the use you intend.</li><li>Ask about pending notices, road-widening schemes, or compulsory purchase plans.</li></ul>

<h2>Understand the Contract and the Moment of Transfer</h2>
<p>The sale contract sets out price, deposit, conditions, and — critically — when ownership and risk pass from seller to buyer. In some systems risk transfers on exchange of contracts; in others, only on registration. Read clauses on what happens if either party defaults, how disputes are resolved, and whether the deposit is refundable. Never rely on verbal assurances: if a promise matters, it belongs in writing.</p>

<h2>Budget for the True Cost</h2>
<p>The purchase price is rarely the final figure. Buyers commonly face stamp duty or transfer tax, registration fees, legal charges, and sometimes capital-gains clearances from the seller's side. In the UK this includes Stamp Duty Land Tax; in India, stamp duty and registration charges that vary by state; across the EU, transfer taxes differing by member state. Factoring these in early prevents a nasty shortfall at completion.</p>

<h2>Practical Next Steps</h2>
<p>Before committing, obtain the title documents and a current register extract, run encumbrance and planning searches, and have a qualified conveyancer or property lawyer review the contract. Insist on written answers to your questions, keep copies of every document, and do not release funds until your adviser confirms the title is clean and the transfer is properly registered. A few weeks of careful checking is cheap insurance against years of litigation.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'pr-002',
    title: 'Understanding Your Rights as a Tenant',
    slug: 'understanding-your-rights-as-a-tenant',
    alphabet: 'U',
    categoryId: 'cat_property_real_estate',
    subcategoryId: 'sub_pr_rental',
    category: propertyRealEstateCategory,
    subcategory: {
      id: 'sub_pr_rental',
      name: 'Rental Agreements',
      slug: 'rental-agreements',
    },
    summary:
      'An overview of the core legal protections tenants enjoy under a rental agreement, from deposits and repairs to privacy and eviction.',
    author: 'Daniel Okafor',
    updatedAt: 'February 2, 2026',
    readingTime: 8,
    views: 5380,
    featured: false,
    imageSeed: 'tenant-rights-rental-agreement',
    content: `<p>A rental agreement, often called a <strong>lease</strong> or <strong>tenancy agreement</strong>, is a contract that gives you the right to occupy someone else's property in exchange for rent. While the landlord retains ownership, the law in most countries grants tenants a substantial bundle of rights designed to protect their home, their money, and their privacy. Knowing these rights turns a one-sided power relationship into a fairer one — and it helps you spot when a clause in your agreement is unenforceable because it conflicts with the law.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A written tenancy agreement governs the relationship, but local law overrides unfair terms.</li><li>Security deposits are usually protected and must be returned, minus legitimate deductions.</li><li>Landlords are generally responsible for keeping the property safe and habitable.</li><li>Tenants have a right to quiet enjoyment, meaning reasonable privacy and notice before entry.</li><li>Eviction must follow a lawful process; self-help lockouts are typically illegal.</li></ul></div>

<h2>The Agreement and What Overrides It</h2>
<p>Your starting point is the written agreement, which should record the rent, the term, the deposit, and each party's obligations. But the contract does not operate in a vacuum. Statutory protections — such as the Housing Act framework in England, state and municipal landlord-tenant codes in the United States, rent laws across EU member states, and the Rent Control and Model Tenancy provisions in India — sit above the contract. A clause that tries to waive a protection the law guarantees is generally void, even if you signed it.</p>
<h3>Terms to read closely</h3>
<ul><li>The length of the tenancy and how it can be renewed or ended.</li><li>How and when rent may be increased.</li><li>Who pays for utilities, maintenance, and minor repairs.</li><li>Rules on subletting, pets, and alterations.</li></ul>

<h2>Your Security Deposit</h2>
<p>A deposit is money you pay upfront to cover unpaid rent or damage beyond ordinary wear and tear. Many jurisdictions now regulate deposits tightly: capping the amount, requiring it to be held in a protected scheme, and setting deadlines for its return. Landlords may usually deduct for genuine damage or arrears, but not for normal ageing of carpets and paint. Document the property's condition with dated photographs at move-in and move-out to support any later dispute.</p>

<h2>Repairs and a Habitable Home</h2>
<p>In most legal systems the landlord must keep the structure, plumbing, heating, and essential installations in working order, and ensure the home is fit to live in. This duty is sometimes called the <strong>implied warranty of habitability</strong>. Tenants typically must report problems promptly and use the property responsibly.</p>
<h3>When repairs are ignored</h3>
<ul><li>Notify the landlord in writing and keep a copy.</li><li>Allow a reasonable time for the work to be done.</li><li>Check whether local law lets you involve a housing authority or, in some places, withhold rent or arrange repairs and deduct the cost.</li><li>Avoid stopping rent payments unless the law clearly permits it, as this can expose you to eviction.</li></ul>

<h2>Privacy and Quiet Enjoyment</h2>
<p>You have a right to <strong>quiet enjoyment</strong> — to live in the property without unjustified interference. Landlords generally cannot enter whenever they please; most jurisdictions require advance notice (often around 24 to 48 hours) except in genuine emergencies such as a burst pipe or fire. Harassment, removing the front door, or cutting off utilities to force you out is unlawful in many countries and may give rise to compensation.</p>

<h2>Eviction Must Follow the Law</h2>
<p>Even where a landlord has valid grounds, ending a tenancy is a legal process, not a private act. Typically the landlord must give written notice for the correct period and, if you do not leave, obtain a court or tribunal order before any removal by an authorised officer. So-called <strong>self-help evictions</strong> — changing locks, removing belongings, or intimidation — are prohibited in most systems. Tenants facing notice should seek advice quickly, as strict deadlines often apply to challenging it.</p>

<h2>Practical Next Steps</h2>
<p>Read your agreement in full, keep a written record of every payment and request, and photograph the property at the start and end of the tenancy. Learn the basic landlord-tenant rules for your specific city or country, since they vary widely, and contact a local tenants' advice service or housing lawyer the moment a serious dispute or eviction notice arises. Acting early and in writing is your strongest protection.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
