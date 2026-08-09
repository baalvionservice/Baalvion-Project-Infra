import type { LawArticle } from '../law-content';

const TAX_FINANCE_CATEGORY = {
  id: 'cat_tax_finance',
  name: 'Tax & Finance',
  slug: 'tax-finance',
};

/**
 * Jurisdiction-specific companions to the comparative `tf-101` "What Is
 * Capital Gains Tax and How Does It Work?" pillar. tf-101 deliberately stays
 * at the level of shared global mechanics (realized vs unrealized gains,
 * short- vs long-term) and only sketches the main-home exemption in one
 * comparative bullet per country -- these four pieces cover the actual
 * statutory mechanism each country uses to tax (or not tax) a primary-home
 * sale, which is where the real divergence is: an uncapped exemption
 * (Canada), a capped dollar exclusion (US), a relief with letting/garden
 * conditions (UK), and an exemption that stacks with a separate discount
 * currently being restructured by statute (Australia).
 */
export const taxFinanceJurisdictionArticles: LawArticle[] = [
  {
    id: 'tf-301',
    title: 'Capital Gains Tax When You Sell Your Home in the U.S.: The Section 121 Exclusion Explained',
    slug: 'capital-gains-tax-selling-a-home-us',
    alphabet: 'C',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_income',
    category: TAX_FINANCE_CATEGORY,
    subcategory: { id: 'sub_tf_income', name: 'Income Tax', slug: 'income-tax' },
    summary:
      'Most US home sellers pay $0 federal capital gains tax under IRC Section 121 — but the exclusion is capped, has real ownership-and-use tests, and Congress is currently debating whether to raise it.',
    author: 'Priya Nair',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'section-121-home-sale-exclusion-us',
    country: 'United States',
    content: `<p>Selling a home for a large profit sounds like a taxable event, and technically it is — but for most American homeowners, federal law makes the actual tax bill zero. Under Internal Revenue Code Section 121, an eligible seller can exclude up to $250,000 of gain ($500,000 for a married couple filing jointly) from federal capital gains tax entirely, not merely defer it. The exclusion is generous, but it is not automatic or unlimited, and Congress is currently weighing whether to expand it for the first time since the caps were set in 1997.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Up to $250,000 of gain ($500,000 married filing jointly) on the sale of a primary residence can be permanently excluded from federal capital gains tax under IRC Section 121.</li><li>You generally must have owned <em>and</em> used the home as your main residence for at least 2 of the 5 years before the sale.</li><li>You can't have used the exclusion on a different home sale within the two years before this one.</li><li>A reduced, prorated exclusion is available even if you don't meet the full 2-year test, for job changes, health reasons, or other qualifying unforeseen circumstances.</li><li>The $250,000/$500,000 caps are not inflation-indexed and haven't changed since 1997; bills to raise or eliminate them are pending in Congress but have not passed as of this writing.</li></ul></div>

<h2>The Exclusion: $250,000 or $500,000, Permanently</h2>
<p>Section 121 lets a qualifying seller exclude up to $250,000 of capital gain from the sale of a principal residence — $500,000 for spouses filing a joint return, provided at least one spouse meets the ownership test and both meet the use test. This is a genuine exclusion, not a deferral: the gain within the cap is never taxed, full stop, unlike a like-kind exchange under Section 1031 (which applies to investment property, not a primary residence, and defers rather than eliminates tax). Any gain above the applicable cap is taxed as a long-term capital gain at the seller's applicable federal rate, assuming the 2-of-5-year ownership test is met.</p>

<h2>The Ownership-and-Use Test</h2>
<p>To claim the full exclusion, you generally must have owned the home <strong>and</strong> used it as your main residence for at least 2 of the 5 years immediately before the sale. The two years don't need to be continuous — short absences (vacations, temporary work assignments) still count as periods of use, and the ownership and use periods don't have to overlap perfectly, though most sellers satisfy both simultaneously in practice. The test is applied per taxpayer, which matters for divorced couples and unmarried co-owners working out who can claim what.</p>

<h2>Once Every Two Years</h2>
<p>You generally cannot use the Section 121 exclusion if you excluded gain from the sale of another home within the two years before the current sale. This "once every two years" limit is meant to prevent using the exclusion on rapid, repeated flips rather than genuine primary-residence sales.</p>

<h2>Partial Exclusion for Unforeseen Circumstances</h2>
<p>Sellers who don't meet the full 2-year test aren't automatically shut out. Treasury regulations allow a reduced, prorated exclusion where the sale is primarily due to a change in place of employment, health reasons, or other specified "unforeseen circumstances" — safe harbors include a work-related move of 50 or more miles, certain health conditions requiring a change of residence, and defined life events such as divorce, multiple births from a single pregnancy, death, an eligible disaster, or an involuntary conversion of the home. The prorated exclusion is calculated based on the fraction of the required 2-year period actually satisfied.</p>

<h2>What Doesn't Qualify</h2>
<p>Section 121 applies to a principal residence only — it does not cover second homes, vacation homes, or investment/rental property (those may separately qualify for Section 1031 exchange treatment, a distinct set of rules for investment property, not covered here). If part of the home was used for a home office or was rented out, the portion of gain attributable to depreciation claimed on that business or rental use generally cannot be excluded and must be recaptured and taxed separately, even on an otherwise fully exempt sale.</p>

<h2>A Proposal in Congress, Not Current Law</h2>
<p>The $250,000/$500,000 caps have not changed since they were set in 1997 and are not adjusted for inflation, which has pushed a growing number of long-term homeowners in high-appreciation markets over the cap. Multiple bills addressing this are currently before Congress — including the No Tax on Home Sales Act (H.R. 4327), introduced in July 2025, which would eliminate the dollar caps for a primary residence entirely, and the separate More Homes on the Market Act, which would double the caps and index them to inflation going forward. As of this writing, neither bill has passed, and the exclusion amounts remain unchanged at $250,000/$500,000. Treat any reporting of a higher cap as a proposal, not current law, until it is actually enacted.</p>

<h2>Reporting the Sale</h2>
<p>If the gain is fully covered by the exclusion and you did not receive Form 1099-S reporting the sale, you generally don't need to report the sale on your return at all. If you received a 1099-S, or if any part of the gain exceeds the exclusion, the sale must be reported, typically on Schedule D and Form 8949, even where much or all of the gain is ultimately excluded.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do I have to buy another home to avoid capital gains tax on my home sale?</h3>
<p>No — unlike the old "rollover" rule that existed before 1997, Section 121 does not require reinvesting the proceeds in a new home. The exclusion applies based on ownership, use, and the frequency limit, regardless of what you do with the money afterward.</p>
<h3>Can I use the exclusion if I only lived in the home for one year?</h3>
<p>You may still qualify for a reduced, prorated exclusion if the sale was primarily due to a job change, health issue, or another qualifying unforeseen circumstance under the safe-harbor rules — otherwise, falling short of the 2-year use test generally limits you to no exclusion for that sale.</p>
<h3>Is the $250,000/$500,000 cap about to increase?</h3>
<p>Not yet. Bills to raise or eliminate the cap are pending in Congress as of this writing, but none has been enacted — the current $250,000/$500,000 limits remain the law until Congress actually passes a change.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Internal Revenue Code § 121 (Exclusion of gain from sale of principal residence)</li>
<li>IRS Publication 523, Selling Your Home</li>
<li>Treasury Regulation § 1.121-3 (reduced maximum exclusion for unforeseen circumstances)</li>
<li>Congress.gov, H.R. 4327, No Tax on Home Sales Act, 119th Congress</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before selling, work out how long you've owned and lived in the home, check whether you've used the exclusion on another sale in the last two years, and gather records of any business or rental use that could trigger depreciation recapture. If your situation doesn't cleanly meet the 2-year test, look into whether your reason for selling fits one of the unforeseen-circumstances safe harbors before assuming you get no exclusion at all. For large gains, mixed-use property, or anything unusual, a tax professional can confirm the numbers before you sign a contract. For the general, worldwide mechanics of how capital gains tax works, see <a href="/tax-finance/what-is-capital-gains-tax">What Is Capital Gains Tax and How Does It Work?</a></p>

<p><em>This article is general legal information, not legal or tax advice. Federal tax law changes over time, and state-level tax treatment of home sales varies separately — consult a tax professional before acting.</em></p>`,
  },
  {
    id: 'tf-302',
    title: 'Capital Gains Tax When You Sell Property in the UK: Private Residence Relief Explained',
    slug: 'capital-gains-tax-uk-property-private-residence-relief',
    alphabet: 'C',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_income',
    category: TAX_FINANCE_CATEGORY,
    subcategory: { id: 'sub_tf_income', name: 'Income Tax', slug: 'income-tax' },
    summary:
      "Selling your only or main home in the UK is usually completely free of Capital Gains Tax through Private Residence Relief — but letting part of the property, a second home, or a taxable gain can trigger a strict 60-day HMRC reporting deadline most sellers have never heard of.",
    author: 'Priya Nair',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'private-residence-relief-cgt-uk-property',
    country: 'United Kingdom',
    content: `<p>In the UK, selling the home you've lived in is usually entirely free of Capital Gains Tax, thanks to Private Residence Relief (PRR). "Usually" is doing real work in that sentence, though — letting out part of the property, owning more than one home, or a large garden can all reduce the relief, and if there is any taxable gain on UK residential property, sellers face a strict 60-day reporting-and-payment deadline that catches a surprising number of people off guard.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Private Residence Relief (PRR) can exempt the entire gain on your only or main home from Capital Gains Tax, under the Taxation of Chargeable Gains Act 1992.</li><li>Full relief requires the property to have been your only or main residence throughout ownership; letting, business use, or a garden over the "permitted area" can reduce it to partial relief.</li><li>UK residential property disposals with tax to pay must generally be reported and paid within 60 days of completion — non-residents must report every disposal within 60 days regardless of gain or relief.</li><li>CGT on residential property is charged at 18% or 24% for 2026/27, depending on your remaining basic-rate Income Tax band.</li><li>The annual tax-free Capital Gains Tax allowance has shrunk sharply in recent years, to £3,000 for 2026/27 — always confirm the current-year figure.</li></ul></div>

<h2>Private Residence Relief: Full vs Partial</h2>
<p>Under sections 222 to 226 of the Taxation of Chargeable Gains Act 1992, a gain on the disposal of a dwelling that has been your only or main residence throughout your period of ownership is fully exempt from Capital Gains Tax. If it was your main residence for only part of the time you owned it, relief is apportioned: the exempt fraction is based on the time it genuinely was your main home, plus an automatic final-period exemption (currently the last nine months of ownership count as exempt regardless of whether you were still living there, to cover the practical gap between moving out and completing a sale).</p>

<h2>What Reduces or Breaks Full Relief</h2>
<ul>
<li><strong>Letting the property.</strong> Letting Relief was sharply cut back from April 2020 and is now only available where the owner was in shared occupancy with the tenant for the letting period, capped at the lesser of £40,000 or the amount of PRR otherwise due — a much narrower relief than the old rules, which applied to any letting.</li>
<li><strong>Business use.</strong> Using part of the home exclusively for business (not merely working from a spare room occasionally) can make that portion of any gain taxable.</li>
<li><strong>Garden or grounds over the "permitted area."</strong> Land beyond roughly 0.5 hectares (about 1.24 acres) can fall outside the relief unless you can show the larger area was genuinely required for the reasonable enjoyment of the house given its size and character.</li>
<li><strong>Owning more than one residence without a valid nomination.</strong> If you have more than one home, only one can be your "main residence" for PRR at a time; you can nominate which one within two years of the combination changing (for example, acquiring a second home), and failing to do so leaves HMRC to decide the question on the facts.</li>
</ul>

<h2>The 60-Day Reporting Deadline</h2>
<p>Since 27 October 2021 (previously 30 days), anyone with Capital Gains Tax to pay on a UK residential property disposal must report the gain and pay the tax within 60 days of completion, using HMRC's online UK Property Account, separately from the normal Self Assessment timetable. UK residents whose gain is fully covered by PRR generally do not need to file a 60-day return at all. Non-UK residents face a stricter rule: <strong>every</strong> disposal of UK residential property must be reported within 60 days, regardless of whether there is a gain, a loss, or full relief — a rule that trips up UK expats who assume no gain means no obligation.</p>

<h2>Current Rates for 2026/27</h2>
<p>Capital Gains Tax on UK residential property is charged at 18% on gains that fall within your remaining basic-rate Income Tax band for the year, and 24% on any gain above that threshold. These rates apply to the portion of a gain that isn't covered by PRR — most sellers of a single main home with full relief never encounter them at all, but they matter for partial relief, second homes, and buy-to-let disposals. The annual tax-free Capital Gains Tax allowance for 2026/27 is £3,000 per person, a fraction of the £12,300 allowance available as recently as 2022/23 — it has been cut in successive tax years, so always check the figure for the specific tax year of the disposal rather than relying on an older number.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do I need to tell HMRC about selling my home if the gain is fully exempt?</h3>
<p>If you're a UK resident and Private Residence Relief covers the entire gain, you generally don't need to file a 60-day Capital Gains Tax property return. Non-UK residents must report every UK residential property disposal within 60 days regardless of relief.</p>
<h3>What if I rented out my home for a few years before selling it?</h3>
<p>You'll likely qualify for partial PRR, apportioned to the time it was genuinely your main residence, plus the final-period exemption. Letting Relief on the rental period itself is now much narrower than it used to be — since April 2020 it only applies if you lived in the property alongside your tenant.</p>
<h3>Does owning a second home mean I automatically lose relief on my main home?</h3>
<p>No, but you can only nominate one property as your main residence for PRR purposes at any given time. Whichever isn't nominated is treated as a second property for CGT purposes on any gain during that period, so the choice — and the two-year window to make it — matters.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Taxation of Chargeable Gains Act 1992, sections 222–226E</li>
<li>HMRC, HS283 Private Residence Relief helpsheet</li>
<li>GOV.UK, Capital Gains Tax rates guidance</li>
<li>GOV.UK, guidance on reporting and paying Capital Gains Tax on UK property within 60 days</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before selling, work out whether the property was your only or main residence for the whole period of ownership, and if not, whether letting, business use, or a second home affects the relief available. If there is any taxable gain, mark the 60-day clock from completion — not from when you file your annual return — since the property-specific deadline runs independently and penalties apply for missing it. For anything beyond a straightforward single-home sale, an accountant or tax adviser can confirm the numbers before you exchange contracts. For the general, worldwide mechanics of how capital gains tax works, see <a href="/tax-finance/what-is-capital-gains-tax">What Is Capital Gains Tax and How Does It Work?</a></p>

<p><em>This article is general legal information, not legal or tax advice, and covers the position in the UK generally understood to apply where the property is in England — Scotland and Wales share the same UK-wide Capital Gains Tax rules but have their own separate property transaction taxes. Consult a tax adviser before acting.</em></p>`,
  },
  {
    id: 'tf-303',
    title: 'The Principal Residence Exemption: How Canada Taxes (or Doesn\'t Tax) Your Home Sale',
    slug: 'principal-residence-exemption-canada',
    alphabet: 'T',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_income',
    category: TAX_FINANCE_CATEGORY,
    subcategory: { id: 'sub_tf_income', name: 'Income Tax', slug: 'income-tax' },
    summary:
      "Canada's Principal Residence Exemption can eliminate 100% of the gain on your home with no dollar cap — but since 2016, you must report every sale to the CRA, even fully exempt ones, or risk losing the exemption and facing real penalties.",
    author: 'Priya Nair',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'principal-residence-exemption-canada-cra',
    country: 'Canada',
    content: `<p>Compared to the US's $250,000/$500,000 cap or the UK's relief-with-conditions model, Canada's Principal Residence Exemption (PRE) is unusually generous: there is no dollar limit at all. A home that qualifies as your principal residence for every year you owned it can be sold entirely free of capital gains tax, no matter how large the gain. The trade-off is a reporting requirement that didn't exist before 2016 — every sale of a principal residence must now be reported to the Canada Revenue Agency, even when the exemption wipes out the entire gain, and getting this wrong carries a real penalty.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>The Principal Residence Exemption can eliminate 100% of the capital gain on a qualifying home, with no dollar cap, under sections 40(2)(b) and 54 of the Income Tax Act.</li><li>The exemption is calculated using a formula tied to how many years the property was designated as your principal residence relative to how many years you owned it, with a "plus one" that covers the year you switch homes.</li><li>Only one property per family unit can be designated as the principal residence for a given year.</li><li>Since the 2016 tax year, every sale must be reported on Schedule 3, with Form T2091(IND) required if the property wasn't your principal residence for every year of ownership — even a fully exempt sale must be reported.</li><li>Missing the designation can be fixed later, but late-filing penalties apply, up to the lesser of $8,000 or $100 per month.</li></ul></div>

<h2>How the Exemption Formula Works</h2>
<p>The exemption isn't a flat percentage — it's calculated using a formula set out in the Income Tax Act: the gain is multiplied by (1 + the number of years the property is designated as your principal residence) divided by the total number of years you owned it. The "plus one" exists specifically to smooth the transition between homes: it lets you count one year of overlap when you sell one principal residence and buy another in the same calendar year, so you're never technically without a designated principal residence for a full tax year. If a property was your principal residence for every year you owned it, this formula produces a fraction of exactly 1, meaning the entire gain is exempt.</p>

<h2>What Counts as a "Principal Residence"</h2>
<p>A property qualifies if it's a housing unit that you, your spouse or common-law partner, or your child ordinarily inhabited during the year — it doesn't have to be where you live most of the time, only a place the family genuinely uses as a residence in a given year, which is why a cottage or vacation property can sometimes qualify. The exemption also covers the land the home sits on, up to 1.24 acres (roughly half a hectare), unless you can demonstrate that a larger area was necessary for the use and enjoyment of the housing unit as a residence. Since 1982, only one property can be designated as the principal residence per family unit for any given tax year — a meaningful constraint for families who own both a primary home and a cottage, since only one of the two can shelter that year's gain.</p>

<h2>Mandatory Reporting Since 2016</h2>
<p>Before the 2016 tax year, a fully exempt principal residence sale generally didn't need to be reported to the CRA at all. That changed: every disposition must now be reported on Schedule 3 of the personal tax return for the year of sale. If the property was your principal residence for every year you owned it, reporting the basic sale details on Schedule 3 and claiming the exemption there is enough. If it was <em>not</em> your principal residence for every year of ownership — for example, it was a rental for some years — you must also complete Form T2091(IND), Designation of a Property as a Principal Residence, providing the address, acquisition date, and proceeds of disposition, and a separate T2091(IND) is required for each property if more than one was sold in the same year. Missing the designation isn't necessarily fatal — the CRA can accept a late designation on request — but the penalty is the lesser of $8,000 or $100 for every complete month from the original filing deadline to when the CRA receives a satisfactory request, which adds up quickly.</p>

<h2>Changing the Use of the Property</h2>
<p>Converting a principal residence into a rental property, or a rental into a principal residence, is generally treated as a deemed disposition and reacquisition at fair market value at the time of the change — potentially triggering a taxable capital gain at that moment even without an actual sale. Elections under sections 45(2) and 45(3) of the Income Tax Act can defer this deemed disposition in many cases (up to four years for a change to rental use, and for the entire period for a change from rental to principal residence, each subject to specific conditions), but the 45(2) election generally requires that you not claim capital cost allowance (depreciation) on the property during the period covered, which is a real trade-off worth understanding before making the election.</p>

<h2>What This Doesn't Cover</h2>
<p>Non-residents of Canada, and gains realized while non-resident, face additional restrictions and are generally not eligible for the same PRE treatment for those years. Properties held in most trusts also face narrower eligibility than a simple personal ownership structure. Because the "one property per family unit per year" rule creates real trade-offs for families with both a home and a cottage, the optimal designation often isn't obvious and depends on which property has appreciated more relative to how long each was owned.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do I have to pay tax if I sell my only home in Canada?</h3>
<p>If it was your principal residence for every year you owned it, generally no — the exemption formula produces a fraction of 1, exempting the entire gain. You must still report the sale on Schedule 3, even though no tax is owed.</p>
<h3>Can my family have two principal residences at once — a house and a cottage?</h3>
<p>Not for tax purposes in the same year. Since 1982, only one property per family unit can be designated as the principal residence for any given tax year, even if both are genuinely used as residences by different family members.</p>
<h3>What happens if I forget to report a fully exempt home sale?</h3>
<p>The CRA can generally accept a late principal residence designation, but a penalty applies — the lesser of $8,000 or $100 for each complete month the request is late — so it's worth reporting correctly the first time rather than relying on the ability to fix it later.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Income Tax Act (Canada), sections 40(2)(b), 45(2), 45(3), and 54 — "principal residence" definition and exemption formula</li>
<li>Canada Revenue Agency, Income Tax Folio S1-F3-C2, Principal Residence</li>
<li>Canada Revenue Agency, Form T2091(IND), Designation of a Property as a Principal Residence by an Individual</li>
<li>Canada Revenue Agency, Schedule 3 guidance, reporting the sale of a principal residence</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before selling, confirm how many years the property was ordinarily inhabited by you or your family and whether it was ever used as a rental, since that determines whether you need only Schedule 3 or also Form T2091(IND). If your family owns more than one property that could qualify, work out which designation minimizes tax across both before you sell either one — this decision can't easily be undone after the fact. For anything beyond a straightforward single-home sale, a Canadian tax professional can confirm the calculation before you list the property. For the general, worldwide mechanics of how capital gains tax works, see <a href="/tax-finance/what-is-capital-gains-tax">What Is Capital Gains Tax and How Does It Work?</a></p>

<p><em>This article is general legal information, not legal or tax advice. Canadian tax law changes over time and provincial rules can add further considerations — consult a tax professional licensed in Canada before acting.</em></p>`,
  },
  {
    id: 'tf-304',
    title: 'Capital Gains Tax on Your Home in Australia: The Main Residence Exemption and the 50% Discount',
    slug: 'capital-gains-tax-main-residence-exemption-australia',
    alphabet: 'C',
    categoryId: 'cat_tax_finance',
    subcategoryId: 'sub_tf_income',
    category: TAX_FINANCE_CATEGORY,
    subcategory: { id: 'sub_tf_income', name: 'Income Tax', slug: 'income-tax' },
    summary:
      "Australia combines two separate mechanisms: a full main residence exemption that can wipe out CGT on your home entirely, and a general 50% discount for other assets — which a 2026 Budget reform is set to replace with cost-base indexation from July 2027.",
    author: 'Priya Nair',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'main-residence-exemption-cgt-discount-australia',
    country: 'Australia',
    content: `<p>Australia's capital gains tax treatment of a home sale rests on two genuinely separate mechanisms that are easy to conflate: a <strong>main residence exemption</strong> that can eliminate CGT on your home entirely, and a general <strong>50% CGT discount</strong> that applies more broadly to assets held over 12 months. Most people who sell a straightforward family home never need to think about the discount at all, because the exemption already covers the whole gain — but the distinction matters for anyone whose home wasn't fully exempt, and a major reform now legislated to take effect from 1 July 2027 is about to change how the discount half of that equation works.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A dwelling can be fully exempt from CGT under the main residence exemption if it was your home for your whole ownership period, wasn't used to produce income, and sits on 2 hectares of land or less.</li><li>Foreign residents at the time of sale generally cannot claim the main residence exemption at all, a rule in force since 2020 that catches many Australians who move overseas before selling.</li><li>The "6-year rule" lets you keep treating a former home as your main residence for up to 6 years after moving out, if you rent it out in the meantime (indefinitely if you don't).</li><li>The separate 50% CGT discount applies to the taxable, non-exempt portion of a gain on assets (including property) held 12 months or more — it is a different mechanism from the main residence exemption and can apply alongside it.</li><li>From 1 July 2027, legislation passed following the 2026-27 Federal Budget replaces the 50% discount for individuals and trusts with cost-base indexation plus a 30% minimum tax on new capital gains; gains realised before that date keep the current discount.</li></ul></div>

<h2>The Main Residence Exemption</h2>
<p>Under Subdivision 118-B of the Income Tax Assessment Act 1997, a dwelling is generally fully exempt from CGT if it was your home for the whole period you owned it, you didn't use it to produce assessable income (such as rent), and the land it sits on is 2 hectares or less. A significant, often-missed limitation applies to Australians living abroad: since 7:30pm AEST on 9 May 2017, foreign residents at the time of the sale generally cannot claim the main residence exemption at all, even if the home was genuinely their main residence for the entire period they owned it while living in Australia. A narrow transitional "life events" test applied only to properties already held before that 2017 change and sold by 30 June 2020 — for a sale happening now, a foreign resident at the time of sale is very unlikely to have any main residence exemption available, which is a real trap for Australians who relocate overseas before listing their former home.</p>

<h2>The Six-Year Rule</h2>
<p>If you move out of your home and rent it out, you can continue treating it as your main residence for CGT purposes for up to six years from when you stopped living there, provided no other property is nominated as your main residence during that period. If you don't rent it out — leaving it vacant instead — the same treatment can continue indefinitely rather than being capped at six years. Moving back in before selling resets the clock for any future absence.</p>

<h2>Moving Between Homes</h2>
<p>Buying a new home before you've sold the old one is common, and the rules allow both properties to be treated as your main residence for an overlap of up to six months, provided the old home was genuinely your main residence for a continuous period of at least three months within the twelve months before you sold it, wasn't used to produce income during that twelve months if it wasn't otherwise your main residence, and the new property has become your main residence.</p>

<h2>The Separate 50% CGT Discount</h2>
<p>Distinct from the main residence exemption, section 115-25 of the ITAA 1997 allows individuals and trusts to discount a capital gain by 50% before it's added to assessable income, where the asset was held for at least 12 months. This matters for a home sale specifically when the main residence exemption doesn't cover the whole gain — for example, a property that was rented out for part of the ownership period beyond what the six-year rule protects, or a home partly used for a business. The taxable, non-exempt slice of the gain can still get the 50% discount if the 12-month holding period is met; the two mechanisms are not mutually exclusive. Foreign and temporary residents generally cannot claim the full 50% discount for CGT events happening after 8 May 2012, though an apportioned discount may be available for a period of genuine Australian residency before residency changed.</p>

<h2>The 2027 Reform: Indexation Replaces the Discount</h2>
<p>Following the 2026-27 Federal Budget, the government introduced the Treasury Laws Amendment (Tax Reform No. 1) Bill 2026 into Parliament on 28 May 2026. Once fully in effect, it replaces the 50% CGT discount for individuals and trusts with a system of cost-base indexation (adjusting the original purchase cost for inflation before calculating the taxable gain) combined with a 30% minimum tax rate on net capital gains — but only for gains arising from 1 July 2027 onward. Gains realised before that date keep the current 50% discount under the existing rules, and individuals and trusts disposing of new residential dwellings or affordable housing on or after 1 July 2027 will be able to choose between the old discount and the new indexation-based regime. It's worth being precise about what this reform does and doesn't touch: it changes how the <em>discount</em> is calculated for the taxable portion of a gain — it does not remove or narrow the main residence exemption itself, which remains a separate mechanism. As of this writing, further consultation is still underway on how the new regime interacts with small business concessions, and additional amendments are expected before 1 July 2027.</p>

<h2>Frequently Asked Questions</h2>
<h3>If I've lived overseas for years, will I owe Australian CGT when I sell my old family home?</h3>
<p>Very possibly yes, and this surprises many people. Since 2020, foreign residents at the time of sale generally cannot claim the main residence exemption at all, even for years the property genuinely was their home while they lived in Australia — get specific advice before assuming your old home sale will be exempt.</p>
<h3>Does the 2027 reform reduce the tax-free amount on my home sale?</h3>
<p>Not directly. The reform replaces the separate 50% discount mechanism for the taxable, non-exempt portion of a gain (relevant mainly for investment property or a partly rented home), from 1 July 2027 onward. The main residence exemption itself is unaffected by this specific reform.</p>
<h3>Can I rent out my home and still avoid CGT when I sell it?</h3>
<p>Often yes, using the six-year rule — you can treat a rented-out former home as your main residence for CGT purposes for up to six years after moving out, provided you don't nominate a different property as your main residence in the meantime.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Income Tax Assessment Act 1997 (Cth), Subdivision 118-B (main residence exemption) and section 115-25 (CGT discount)</li>
<li>Australian Taxation Office, "Eligibility for main residence exemption" and "Main residence exemption for foreign residents"</li>
<li>Treasury Laws Amendment (Tax Reform No. 1) Bill 2026, introduced 28 May 2026 following the 2026-27 Federal Budget</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before selling, confirm your residency status at the likely time of sale, since that single fact can eliminate the main residence exemption entirely regardless of how long the property was genuinely your home. If part of the gain will be taxable — because of rental use beyond the six-year rule, business use, or non-residency — check whether the 12-month holding period is met for the 50% discount, and keep an eye on the 1 July 2027 transition if settlement might land close to that date. For anything beyond a straightforward, fully exempt sale, a registered tax agent can confirm the numbers before you sign a contract. For the general, worldwide mechanics of how capital gains tax works, see <a href="/tax-finance/what-is-capital-gains-tax">What Is Capital Gains Tax and How Does It Work?</a></p>

<p><em>This article is general legal information, not legal or tax advice. Australian tax law is subject to ongoing reform, including changes not yet fully drafted as of this writing — consult a registered tax agent before acting.</em></p>`,
  },
];
