import type { LawArticle } from '../law-content';

const PROPERTY_REAL_ESTATE_CATEGORY = {
  id: 'cat_property_real_estate',
  name: 'Property & Real Estate',
  slug: 'real-estate-law',
};

/**
 * Jurisdiction-specific companion to the comparative `pr-002` "Understanding
 * Your Rights as a Tenant" pillar, which sketches deposit protection only in
 * a single general sentence. This piece covers the actual statutory
 * mechanism -- the three approved England & Wales schemes, the 30-day/penalty
 * regime under the Housing Act 2004, and how the Renters' Rights Act 2025
 * (in force since 1 May 2026) changed the tenancy landscape it now applies to.
 */
export const propertyRealEstateJurisdictionArticles: LawArticle[] = [
  {
    id: 'pr-301',
    title: 'Tenancy Deposit Protection in England and Wales: The Rules Every Landlord Must Follow',
    slug: 'tenancy-deposit-protection-uk',
    alphabet: 'T',
    categoryId: 'cat_property_real_estate',
    subcategoryId: 'sub_pr_rental',
    category: PROPERTY_REAL_ESTATE_CATEGORY,
    subcategory: { id: 'sub_pr_rental', name: 'Rental Agreements', slug: 'rental-agreements' },
    summary:
      'A landlord in England and Wales who takes a deposit must protect it in an approved scheme within 30 days or face a court penalty of up to three times its value — a rule now applying to a wider pool of tenancies since the Renters\' Rights Act 2025 took effect.',
    author: 'Daniel Okafor',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'tenancy-deposit-protection-scheme-uk',
    country: 'United Kingdom',
    content: `<p>In England and Wales, a landlord who takes a deposit for an assured shorthold tenancy — or, since 1 May 2026, the assured periodic tenancy that has effectively replaced it — must place that money in one of three government-approved schemes within 30 days, or face a court-ordered penalty worth up to three times the deposit. This isn't a technicality landlords can afford to overlook: it's a strict statutory duty under the Housing Act 2004, with real financial consequences and no discretion to simply "get around to it."</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Deposits must be protected in one of three approved schemes — the Deposit Protection Service, MyDeposits, or the Tenancy Deposit Scheme — within 30 days of receipt.</li><li>Landlords must also give tenants "prescribed information" about the scheme and their rights, separately, within the same 30-day window.</li><li>A court can order a penalty of between one and three times the deposit amount, payable to the tenant, if a landlord fails to comply.</li><li>Deposits are capped at 5 weeks' rent (6 weeks' if the total annual rent exceeds £50,000) under the Tenant Fees Act 2019.</li><li>The Renters' Rights Act 2025, in force since 1 May 2026, converted existing fixed-term tenancies into periodic assured tenancies without requiring deposits to be re-registered.</li></ul></div>

<h2>The Three Approved Schemes</h2>
<p>Under sections 212 to 215 of the Housing Act 2004, every deposit taken for an assured shorthold tenancy (and, following the Renters' Rights Act 2025, the periodic assured tenancies that have largely replaced them) must go into one of three government-authorised schemes: the Deposit Protection Service (DPS), MyDeposits, or the Tenancy Deposit Scheme (TDS). Each operates in two possible ways — a <strong>custodial</strong> model, where the landlord pays the actual deposit money to the scheme to hold until the tenancy ends, and an <strong>insured</strong> model, where the landlord or agent keeps the deposit but pays the scheme a premium to insure it, so the money is still protected if a dispute arises.</p>

<h2>The 30-Day Deadline and Prescribed Information</h2>
<p>Section 213(3) of the Housing Act 2004 requires the deposit to be protected in an authorised scheme within 30 days of the landlord receiving it. Separately, section 213(5)–(6) requires the landlord to give the tenant "prescribed information" — the scheme's name and contact details, how to apply for the deposit's release, and an explanation of the tenant's rights — in the form set out in secondary legislation, also within the same 30-day window. These are two distinct obligations: protecting the deposit on time but serving the prescribed information late (or vice versa) is still a breach of the regime.</p>

<h2>The Deposit Cap</h2>
<p>The Tenant Fees Act 2019 caps how much deposit a landlord can even ask for: five weeks' rent for tenancies where the total annual rent is under £50,000, rising to six weeks' rent above that threshold. A separate, much smaller cap of one week's rent applies to a holding deposit taken before a tenancy is signed.</p>

<h2>What Happens If a Landlord Doesn't Comply</h2>
<p>Under section 214 of the Housing Act 2004, a tenant can apply to the county court where a deposit hasn't been protected, or the prescribed information hasn't been given, within the required timeframes. If the court is satisfied there's been a breach, it must order the landlord either to protect the deposit or return it to the tenant, and — separately — it must also order a penalty of between one and three times the deposit amount, payable to the tenant, with the exact multiplier left to the court's discretion based on how serious and deliberate the non-compliance was. This penalty exists independently of the tenant getting their deposit back; it is a real financial consequence, not just an administrative correction.</p>

<h2>What Changed With the Renters' Rights Act 2025</h2>
<p>The Renters' Rights Act 2025 received royal assent on 27 October 2025, and its first major phase — including the abolition of Section 21 "no-fault" evictions — took effect from 1 May 2026. From that date, existing assured shorthold tenancies converted automatically into assured periodic tenancies, continuing as month-to-month arrangements rather than needing renewal at the end of a fixed term. Deposit protection carried over as part of that transition: landlords were not required to re-register deposits or re-serve prescribed information purely because of the conversion, since the tenancy is treated in law as continuing rather than ending and restarting. One practical consequence of the wider reform is worth flagging directly: before 1 May 2026, an unprotected deposit could block a landlord from serving a valid Section 21 notice, which gave tenants an indirect enforcement lever. With Section 21 abolished entirely, that specific lever no longer applies in the same form — the section 214 court claim for the 1-to-3x penalty remains the primary route for a tenant whose deposit wasn't properly protected, and it is unaffected by the wider reform.</p>

<h2>Frequently Asked Questions</h2>
<h3>What counts as "protecting" a deposit — is paying it into my own bank account enough?</h3>
<p>No. The deposit must be placed with one of the three government-approved schemes (DPS, MyDeposits, or TDS), either by paying the money into a custodial scheme or by insuring it through an insured scheme — simply holding it in a landlord's own account, protected or not, doesn't satisfy the Housing Act 2004 requirement.</p>
<h3>Can a landlord be penalised even if they eventually protect the deposit late?</h3>
<p>Yes. Protecting a deposit after the 30-day deadline is still a breach that a court can penalise, even though the deposit is now protected — the penalty is tied to the failure to meet the deadline, not just to whether the deposit is currently protected.</p>
<h3>Do I need to re-protect my tenant's deposit now that Section 21 is gone and my fixed-term tenancy has converted to periodic?</h3>
<p>No. The Renters' Rights Act 2025 conversion is treated as a continuation of the same tenancy, not a new one, so a deposit already properly protected before 1 May 2026 does not need to be re-registered or have its prescribed information re-served purely because of the conversion.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Housing Act 2004, sections 212–215 (tenancy deposit schemes)</li>
<li>Tenant Fees Act 2019 (deposit and holding deposit caps)</li>
<li>Renters' Rights Act 2025 and accompanying GOV.UK transitional guidance</li>
<li>GOV.UK, guidance for landlords on tenancy deposit protection</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you're a landlord taking a new deposit, protect it with an approved scheme and send the prescribed information within 30 days of receiving the money — set a calendar reminder rather than relying on memory, since both obligations run on the same short clock and missing either one exposes you to a court penalty. If you're a tenant and you're not sure whether your deposit was ever protected, each of the three schemes offers a free online search tool to check. For the broader, worldwide picture of tenant rights around deposits, repairs, and eviction, see <a href="/real-estate-law/understanding-your-rights-as-a-tenant">Understanding Your Rights as a Tenant</a></p>

<p><em>This article is general legal information, not legal advice, and covers England and Wales specifically — Scotland and Northern Ireland run separate tenancy deposit schemes under their own legislation. Consult a solicitor or a housing advice service before acting.</em></p>`,
  },
];
