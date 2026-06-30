import type { LawArticle } from '../law-content';

const propertyRealEstateCategory = {
  id: 'cat_property_real_estate',
  name: 'Property & Real Estate',
  slug: 'property-real-estate',
} as const;

export const propertyRealEstateExtraArticles: LawArticle[] = [
  {
    id: 'pr-101',
    title: 'What Is an Easement in Property Law?',
    slug: 'what-is-an-easement-in-property-law',
    alphabet: 'W',
    categoryId: 'cat_property_real_estate',
    subcategoryId: 'sub_pr_ownership',
    category: propertyRealEstateCategory,
    subcategory: { id: 'sub_pr_ownership', name: 'Ownership Rights', slug: 'ownership-rights' },
    summary:
      'An easement is a legal right to use part of someone else\'s land for a specific purpose, such as a right of way, without owning the land itself.',
    author: 'Priya Nair',
    updatedAt: 'June 13, 2026',
    readingTime: 8,
    views: 5240,
    featured: false,
    imageSeed: 'easement-right-of-way',
    content: `<p>An easement is a legal right to use a portion of someone else's land for a particular purpose, without owning that land. The most familiar example is a right of way — a path or driveway that lets one property owner cross a neighbour's land to reach a road. Easements are a quiet but important feature of property law, because they can add value to one property while permanently limiting what the owner of another can do.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>An easement is the right to use another person's land for a defined purpose, not to own it.</li><li>It usually benefits one property (the dominant land) and burdens another (the servient land).</li><li>Common types include rights of way, drainage, light, and utility access.</li><li>Easements often "run with the land", binding future owners, not just the original parties.</li><li>They can be created by agreement, long use, or necessity, with rules differing by jurisdiction.</li></ul></div>

<h2>How an Easement Works</h2>
<p>Most easements involve two pieces of land. The land that enjoys the benefit is often called the <strong>dominant</strong> property, and the land that carries the burden is the <strong>servient</strong> property. For example, a back plot with no direct road access may have an easement to cross the front plot. The owner of the servient land keeps ownership but must allow the agreed use and generally cannot block it. Because the right attaches to the land rather than the individual, it usually continues even after either property is sold.</p>

<h2>Common Types of Easement</h2>
<p>Easements come in several recognisable forms.</p>
<ul>
<li><strong>Right of way:</strong> the right to pass over another's land on foot or by vehicle.</li>
<li><strong>Drainage and water:</strong> the right to run pipes, drains, or water across a neighbour's land.</li>
<li><strong>Utility easements:</strong> rights allowing electricity, gas, or telecom lines to cross a property.</li>
<li><strong>Right to light or support:</strong> in some jurisdictions, the right to receive light through a window or to have a building supported by adjoining land.</li>
</ul>

<h2>How Easements Are Created</h2>
<h3>By Express Agreement</h3>
<p>The clearest easements are written into a deed or contract and registered, leaving little doubt about their scope. This is the safest way to create one and the easiest to prove later.</p>
<h3>By Long Use (Prescription)</h3>
<p>In many systems, a person who uses a way openly, continuously, and without permission for a long statutory period can acquire an easement by "prescription". The exact period and conditions vary, and disputes over prescriptive easements are common.</p>
<h3>By Necessity or Implication</h3>
<p>An easement may also arise where it is essential — for instance, when a plot would otherwise be landlocked — or be implied from the circumstances when land is divided and sold.</p>

<h2>Rights and Limits</h2>
<p>An easement allows a specific use, not unlimited use. The holder must keep within the agreed purpose and cannot, for example, turn a footpath right into a commercial vehicle route without further agreement. The servient owner, in turn, cannot obstruct the easement but otherwise remains free to use their land. Disagreements often centre on the scope of the right and on maintenance — who must repair a shared driveway, for example — so clarity at the outset prevents conflict.</p>

<h2>How Jurisdictions Differ</h2>
<p>The concept is recognised across legal traditions, though the terminology and detail differ.</p>
<ul>
<li><strong>United States:</strong> Easements are well developed, including express, prescriptive, and easements by necessity, recorded against title.</li>
<li><strong>United Kingdom:</strong> Easements such as rights of way and rights to light are recognised, with prescriptive rights acquired over long use and registered against title.</li>
<li><strong>European Union:</strong> Civil-law countries use "servitudes", often formalised before a notary and entered in the land register.</li>
<li><strong>India:</strong> Easements are governed by dedicated legislation, recognising rights acquired by grant, necessity, or long enjoyment.</li>
</ul>

<h2>Why Easements Matter to Buyers</h2>
<p>Before buying property, it is essential to know what easements benefit or burden it. An easement crossing the land you are buying may limit where you can build or fence, while an easement benefiting the property may be vital for access. Because these rights often bind future owners, they should appear in your due-diligence searches of the title and land register.</p>

<h2>Practical Next Steps</h2>
<p>If you are buying or developing land, obtain the title documents and search for any registered easements, and walk the boundaries to spot informal paths or pipes that might hint at unregistered rights. Where an easement is unclear or disputed, get it documented in writing rather than relying on past practice. For anything contentious — a blocked right of way, a prescriptive claim, or a development that an easement constrains — consult a property lawyer in the relevant jurisdiction before you commit.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
  {
    id: 'pr-102',
    title: 'Landlord vs Tenant: Who Pays for Repairs?',
    slug: 'landlord-vs-tenant-who-pays-for-repairs',
    alphabet: 'L',
    categoryId: 'cat_property_real_estate',
    subcategoryId: 'sub_pr_rental',
    category: propertyRealEstateCategory,
    subcategory: { id: 'sub_pr_rental', name: 'Rental Agreements', slug: 'rental-agreements' },
    summary:
      'Landlords are usually responsible for major and structural repairs, while tenants handle minor upkeep and damage they cause — but the exact split depends on the lease and local law.',
    author: 'Daniel Okafor',
    updatedAt: 'June 5, 2026',
    readingTime: 9,
    views: 6080,
    featured: true,
    imageSeed: 'landlord-tenant-repairs',
    content: `<p>When something breaks in a rented home, the first question is usually: who pays to fix it? As a general rule, the landlord is responsible for major and structural repairs and for keeping the property safe and habitable, while the tenant handles minor day-to-day upkeep and any damage they cause beyond normal wear and tear. The precise dividing line is set by the tenancy agreement and, importantly, by housing laws that often override unfair clauses.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Landlords generally must keep the structure, services, and safety of a property in good order.</li><li>Tenants usually handle minor upkeep and pay for damage they cause beyond ordinary wear and tear.</li><li>The lease sets out the split, but local law can override clauses that are unfair or unlawful.</li><li>Reporting problems in writing and promptly is key to getting repairs done and protecting your position.</li><li>Responsibilities and remedies vary by country and even by city, so local rules matter.</li></ul></div>

<h2>The General Division of Responsibility</h2>
<p>Across most legal systems, repair duties split along a recognisable line. The landlord owns the building and is typically responsible for keeping it sound and fit to live in, while the tenant is responsible for living in it responsibly and for small, routine maintenance. The principle is that the landlord protects the asset and the tenant protects the day-to-day condition.</p>

<h2>What Landlords Usually Cover</h2>
<p>Landlords are generally responsible for the things that make a home safe and usable.</p>
<ul>
<li>The structure and exterior — roof, walls, foundations, and windows.</li>
<li>Essential installations such as heating, plumbing, electrics, and water supply.</li>
<li>Safety systems, including in many places gas safety and smoke or carbon-monoxide alarms.</li>
<li>Anything covered by the implied duty to keep the property habitable.</li>
</ul>
<p>This duty often cannot be signed away: a clause forcing a tenant to repair the structure may be unenforceable under housing law.</p>

<h2>What Tenants Usually Cover</h2>
<p>Tenants are typically responsible for minor upkeep and for treating the property with care.</p>
<ul>
<li>Small tasks such as replacing light bulbs and keeping the home reasonably clean.</li>
<li>Minor garden maintenance, where the agreement requires it.</li>
<li>Repairing damage they, their family, or their guests cause.</li>
<li>Reporting problems promptly so small issues do not become major ones.</li>
</ul>

<h2>Wear and Tear vs Damage</h2>
<p>The most common dispute is the difference between <strong>fair wear and tear</strong> and <strong>damage</strong>. Wear and tear is the natural ageing of a property through ordinary use — faded paint, worn carpet, or loosening fittings — and the landlord usually bears this. Damage is harm beyond normal use, such as a broken door, stains, or holes, and the tenant generally pays for that. Because the line can be subjective, dated photographs at move-in and move-out are invaluable evidence.</p>

<h2>What to Do When a Repair Is Needed</h2>
<h3>Report It Properly</h3>
<p>Tenants should notify the landlord in writing and keep a copy, describing the problem clearly and, where possible, including photos. Written reports create a record and start any legal time limits running.</p>
<h3>Allow Reasonable Time, Then Escalate</h3>
<p>Landlords usually have a reasonable period to act, longer for minor issues and short for emergencies like a burst pipe or no heating in winter. If repairs are ignored, tenants may, depending on local law, involve a housing authority or, in some places, arrange the repair and deduct the cost — but only where the law clearly allows it. Simply withholding rent is risky and can lead to eviction.</p>

<h2>How Jurisdictions Differ</h2>
<ul>
<li><strong>United States:</strong> Most states recognise an implied warranty of habitability, with "repair and deduct" remedies available under defined conditions.</li>
<li><strong>United Kingdom:</strong> Landlords must keep the structure, exterior, and key installations in repair, and homes must be fit for human habitation.</li>
<li><strong>European Union:</strong> Member states set their own tenancy codes, generally placing structural and essential repairs on the landlord.</li>
<li><strong>India:</strong> Rent-control and model tenancy provisions typically require landlords to handle major repairs while tenants manage minor upkeep.</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Read your tenancy agreement to see how repair duties are allocated, but remember that local housing law can override unfair terms. Document the property's condition with dated photos at the start and end of the tenancy, report problems in writing as soon as they arise, and learn the basic landlord-tenant rules for your city or country. If a serious repair is ignored or a dispute escalates, seek advice from a local tenants' service or housing lawyer before taking action such as withholding rent.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
  },
];
