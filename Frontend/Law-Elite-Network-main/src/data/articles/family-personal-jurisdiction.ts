import type { LawArticle } from '../law-content';

const FAMILY_PERSONAL_CATEGORY = {
  id: 'cat_family_personal',
  name: 'Family & Personal',
  slug: 'family-law',
};

/**
 * Jurisdiction-specific companions to the comparative `fp-001` "How Divorce
 * Works" pillar, which deliberately stays worldwide-general and does not go
 * into a single country's property-division statutes or case law. Each piece
 * here exists because that general guide can't respons­ibly cover
 * jurisdiction-specific mechanics like exact statutory factors, case law, or
 * filing deadlines -- see the Phase 2/Phase R jurisdiction clusters in the
 * other category files for the established pattern this follows.
 */
export const familyPersonalJurisdictionArticles: LawArticle[] = [
  {
    id: 'fp-301',
    title: 'Community Property vs Equitable Distribution in the US',
    slug: 'community-property-vs-equitable-distribution-us',
    alphabet: 'C',
    categoryId: 'cat_family_personal',
    subcategoryId: 'sub_fp_divorce',
    category: FAMILY_PERSONAL_CATEGORY,
    subcategory: { id: 'sub_fp_divorce', name: 'Divorce', slug: 'divorce' },
    summary:
      'Nine US states use community property; the rest use equitable distribution — and neither works quite as most people assume.',
    author: 'Sofia Almeida',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'community-property-vs-equitable-distribution-us',
    country: 'United States',
    content: `<p>Ask a divorcing couple in Texas and a divorcing couple in New York how their property will be divided, and you'll get two different legal frameworks entirely. Nine U.S. states divide marital property as "community property," treating most of what a couple acquired during the marriage as jointly owned from the moment it was earned. The remaining states — and the District of Columbia — use "equitable distribution," dividing marital property based on what a court considers fair, which is not automatically the same as equal. Neither system is simply "50/50" or simply "whatever the judge feels like" — both are more specific, and more different from each other, than that.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Nine states follow community property: Arizona, California, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington, and Wisconsin. Alaska allows couples to opt into a community property regime by agreement, without requiring it by default.</li><li>Both systems protect a category of separate property — generally what each spouse owned before the marriage, plus gifts and inheritances received individually during it — and divide only what was acquired during the marriage.</li><li>Community property states differ sharply among themselves on how strictly they require an equal 50/50 division: California, Louisiana, New Mexico, and Idaho require close to a mathematically equal split, while Texas, Arizona, Washington, and Nevada give courts discretion to divide the community estate unequally if fairness calls for it.</li><li>Equitable distribution states divide marital property based on statutory fairness factors — length of marriage, each spouse's income and contributions, age and health, and more — without a presumption that the result must be equal.</li><li>This is general education on how the two systems work, not a prediction of how any specific divorce will be decided — the actual outcome depends on the facts of the case and the exact law of the state involved.</li></ul></div>

<h2>The Nine Community Property States</h2>
<p>Community property is the marital-property system in Arizona, California, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington, and Wisconsin. In each of these states, most property and debt acquired by either spouse during the marriage is treated as owned equally by both spouses, regardless of whose name is on the title, whose paycheck bought it, or which spouse's decision it was. Property either spouse owned before the marriage, along with gifts and inheritances either spouse received individually during the marriage, remains that spouse's separate property in every one of these states — community property describes what happens to the marital acquisitions, not everything either spouse has ever owned.</p>
<p><strong>Alaska</strong> takes a different approach: it is not a mandatory community property state, but it lets couples opt into a community property regime voluntarily, either through a written community property agreement or by funding a community property trust. Absent that opt-in, Alaska otherwise functions as an equitable distribution state. This is a meaningfully different system from the nine mandatory community property states, and it's worth not conflating the two when researching Alaska specifically.</p>

<h2>Not All Community Property States Divide Equally</h2>
<p>Here is where a lot of general explanations oversimplify. All nine community property states agree on <em>characterization</em> — what counts as community property versus separate property. They do not all agree on how strictly that community property must be <em>divided</em> once a couple divorces.</p>
<ul>
<li><strong>California, Louisiana, New Mexico, and Idaho</strong> require division close to a strict, mathematically equal split of the community estate, absent an agreement between the spouses saying otherwise. California's Family Code, for example, generally directs the court to divide the community estate equally.</li>
<li><strong>Texas, Arizona, Washington, and Nevada</strong>, despite also being community property states, give their courts real discretion to divide the community estate <em>unequally</em> where fairness calls for it. Texas law directs courts to divide the marital estate in a manner the court deems "just and right," which is not the same promise as an even split — Texas courts commonly order splits that favor one spouse, often in a 55/45 or 60/40 range, based on factors like fault, earning capacity, or who will have primary custody of the children. Arizona's statute was amended decades ago to replace "equal" with "equitable" language for the same reason. Nevada generally aims for equal division but allows a court to divide community property unequally for a "compelling reason," such as one spouse having wasted or hidden marital assets.</li>
</ul>
<p>The practical takeaway: knowing a state is a "community property state" tells you how property gets <em>characterized</em>, not automatically how it will be <em>split</em>. Whether your state falls into the strict-equal group or the discretionary group is a separate, important question.</p>

<h2>How Equitable Distribution Works in the Other States</h2>
<p>Every other state, plus the District of Columbia, uses equitable distribution. Courts divide marital property — again, generally what was acquired during the marriage, with separate property for pre-marital assets and individual gifts/inheritances carved out the same way — based on what's fair under the circumstances, not a presumption of an equal split. New York's Domestic Relations Law, for example, directs courts to weigh a long list of factors: each spouse's income and property at the time of the marriage and at the time the divorce action began; the length of the marriage and each spouse's age and health; a custodial parent's need to remain in the marital home; loss of inheritance, pension, or health insurance benefits caused by the divorce; each spouse's direct and indirect contributions to acquiring marital property (including non-financial contributions like raising children or supporting the other spouse's career); and the tax consequences of dividing specific assets. Most other equitable distribution states apply a broadly similar list of factors, even though the exact wording and count varies by state.</p>
<p>"Equitable" does not mean the court starts from a 50/50 baseline and adjusts from there — it means the court weighs the statutory factors and arrives at whatever division those factors support, which may or may not land close to equal in a given case.</p>

<h2>Separate Property and the Risk of Commingling</h2>
<p>Both systems protect a category of separate, non-marital property: what each spouse brought into the marriage, plus gifts and inheritances either spouse received individually while married. This is a point worth stating clearly because it's commonly misunderstood — community property and equitable distribution differ on how the marital estate gets divided, not on whether separate property exists at all. Both systems recognize it.</p>
<p>That protection isn't automatic or permanent, though. When separate funds are mixed with marital or community funds to the point they can no longer be traced back to their separate source — depositing an inheritance into a joint checking account and spending from it for years, for instance, or retitling a separately owned house into both spouses' names — courts in most states can find the separate property has been "commingled" or "transmuted" into marital or community property. Keeping separate property demonstrably separate, through separate accounts and clear records, is what actually preserves its protected status through a divorce.</p>

<h2>A Related Tax Point for Community Property States</h2>
<p>One genuine, if narrow, advantage of community property states arises not in divorce but in estate planning: under federal tax law (26 U.S.C. §1014(b)(6)), when one spouse in a community property state dies, the surviving spouse's half of the community property also receives a step-up in basis to fair market value, not just the deceased spouse's half — a more favorable outcome than the general common-law rule, where jointly held property typically steps up only on the half actually included in the deceased spouse's estate. This is a tax planning point, not a divorce-division rule, but it's frequently raised alongside community property discussions and is worth knowing is a genuine, distinct legal consequence of the same classification.</p>

<h2>Frequently Asked Questions</h2>
<h3>If I live in a community property state, will my divorce automatically split everything 50/50?</h3>
<p>Not necessarily. Whether your state requires a strict equal split of community property, or gives courts discretion to divide it unequally, depends on which community property state you're in — California, Louisiana, New Mexico, and Idaho lean toward strict equality, while Texas, Arizona, Washington, and Nevada allow unequal divisions based on fairness factors.</p>
<h3>Is property I owned before I got married protected in a divorce?</h3>
<p>Generally yes, in both community property and equitable distribution states, as long as it stayed clearly separate — kept in your name alone, and not mixed with marital funds or retitled jointly. Once separate property is commingled with marital property to the point it can't be traced, courts in most states can treat it as part of the marital or community estate instead.</p>
<h3>Does "equitable distribution" mean the same thing as "equal division"?</h3>
<p>No — this is one of the most common points of confusion. Equitable means fair under the specific statutory factors a court must weigh, which can produce an equal split, but doesn't require one. A court in an equitable distribution state might reasonably divide property 60/40 or 70/30 if the facts support it.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Cal. Fam. Code §2550; Tex. Fam. Code §7.001; Ariz. Rev. Stat. §25-318; Wash. Rev. Code §26.09.080; Nev. Rev. Stat. §125.150; N.M. Stat. §40-3-8; Idaho Code §32-712 (community property division standards by state)</li>
<li>New York Domestic Relations Law §236(B)(5)(d) (equitable distribution factors, as one representative state example)</li>
<li>Alaska Community Property Act, Alaska Stat. Title 34, ch. 77 (opt-in community property)</li>
<li>26 U.S.C. §1014(b)(6) (community property basis step-up on death)</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Start by confirming which system your state actually uses, and if it's a community property state, whether it's one of the strict-equal states or one that gives courts discretion to divide unequally — that distinction changes what outcome is realistic far more than the "community property" label alone suggests. Gather clear records distinguishing your separate property from marital or community property before any dispute arises, since tracing gets harder the longer assets have been mixed together. Because the exact factors, presumptions, and procedural rules vary meaningfully even among states that share the same general system, a consultation with a family lawyer licensed in your specific state is the most reliable way to understand how these rules would actually apply to your situation. For the general, worldwide picture of how divorce works, see <a href="/family-law/how-divorce-works-guide">How Divorce Works: A Plain-Language Guide to Ending a Marriage</a>.</p>

<p><em>This article is general legal information, not legal advice, and is not a substitute for individualized guidance. Property division law varies by state and changes over time — consult a family lawyer licensed in your state before acting.</em></p>`,
  },
  {
    id: 'fp-302',
    title: 'Financial Settlements on Divorce in England and Wales',
    slug: 'financial-settlements-divorce-england-wales',
    alphabet: 'F',
    categoryId: 'cat_family_personal',
    subcategoryId: 'sub_fp_divorce',
    category: FAMILY_PERSONAL_CATEGORY,
    subcategory: { id: 'sub_fp_divorce', name: 'Divorce', slug: 'divorce' },
    summary:
      'No-fault divorce changed how a marriage ends in England and Wales, not how money is divided — that still runs on the Matrimonial Causes Act 1973.',
    author: 'Sofia Almeida',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'financial-settlements-divorce-england-wales',
    country: 'United Kingdom',
    content: `<p>Getting divorced in England and Wales and sorting out the money are two separate legal processes, decided under two separate pieces of law. The 2022 shift to no-fault divorce changed how a marriage legally ends; it did nothing to change how the resulting finances get divided, which still runs on a framework written in 1973 and shaped since by a handful of landmark House of Lords and Supreme Court decisions. That framework gives judges wide discretion rather than a fixed formula — and, as of this year, it's the subject of a live government consultation that could eventually change it.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Financial settlement on divorce in England and Wales is governed by the Matrimonial Causes Act 1973, section 25 — a list of factors a court must weigh, not a formula that produces an automatic result.</li><li>Divorce itself and financial settlement are legally separate: the Divorce, Dissolution and Separation Act 2020 changed how a marriage ends, but the 1973 Act still governs how the money and property are divided.</li><li>Without a court-approved consent order, an informal agreement between spouses is not legally binding — either party can bring a financial claim later, sometimes many years after the divorce, as the Supreme Court confirmed in Wyatt v Vince.</li><li>Courts apply the "yardstick of equality" from White v White and the needs/compensation/sharing framework from Miller v Miller; McFarlane v McFarlane — there is no starting presumption of an equal split, but any departure from equality needs a good reason.</li><li>A government consultation, "A fairer end to relationships," opened in June 2026 and proposes putting much of this discretionary case law onto a statutory footing — it remains open for a matter of days from today, and no legislation has yet been introduced.</li></ul></div>

<h2>Divorce and Money Are Two Different Legal Questions</h2>
<p>Since April 2022, the Divorce, Dissolution and Separation Act 2020 has let either spouse end a marriage in England and Wales without proving fault — a "no-fault" system. That reform changed the process of ending the marriage itself. It left the financial side entirely alone. Sorting out property, savings, pensions, and ongoing support is a separate legal process, still governed by the Matrimonial Causes Act 1973 as it has been amended and interpreted over the decades since. A couple can be fully divorced with no financial settlement in place at all — which, as explained below, is a genuinely risky position to be in.</p>

<h2>The Section 25 Factors</h2>
<p>The core of the current law is section 25 of the Matrimonial Causes Act 1973. It directs the court to have regard to all the circumstances of the case, giving first consideration to the welfare of any child of the family who is still a minor, and then to a specific list of factors: each spouse's income, earning capacity, property, and financial resources, both now and in the foreseeable future; their financial needs, obligations, and responsibilities; the standard of living the family enjoyed before the marriage broke down; the age of each spouse and the duration of the marriage; any physical or mental disability; each spouse's contributions to the family, explicitly including looking after the home or caring for the family; conduct, but only where it would be "inequitable to disregard it" — a high bar met only in exceptional cases, not ordinary marital fault; and the value of any benefit, such as a pension, that either spouse will lose the chance of acquiring because of the divorce.</p>
<p>This is a list of things the court must weigh, not a formula that outputs a percentage. Two marriages with similar length and similar assets can end in different settlements because the section 25 factors point differently on the specific facts.</p>

<h2>The Types of Financial Orders</h2>
<p>A court resolving a financial claim can make several kinds of orders, and settlements often combine more than one: <strong>lump sum orders</strong>, requiring one spouse to pay the other a specific sum; <strong>property adjustment orders</strong>, which can transfer, sell, or otherwise deal with property, including the family home; <strong>pension sharing orders</strong> (and, less commonly today, pension attachment orders), which split a pension's value between the spouses rather than leaving it entirely with whoever built it up; and <strong>periodical payments orders</strong> — ongoing spousal maintenance, paid on a regular basis rather than as a single sum (see <a href="/family-law/alimony-and-spousal-support-explained">Alimony and Spousal Support Explained</a> for how this kind of ongoing support is approached more generally).</p>
<p>Alongside these, the law encourages a "clean break" where appropriate: section 25A of the 1973 Act places a duty on the court to <em>consider</em> whether the parties' financial obligations to each other can be ended as soon as is just and reasonable after the divorce, rather than continuing indefinitely. This is a duty to consider a clean break, not a guarantee of one — some marriages, particularly longer ones with a significant income disparity, will still result in ongoing periodical payments rather than a single final settlement.</p>

<h2>Why a Consent Order Matters More Than People Expect</h2>
<p>One of the most consequential and least understood parts of this process is that an informal agreement between spouses about money — even one written down and signed — is not, on its own, legally binding. To actually close off future financial claims, the agreement needs to be turned into a <strong>consent order</strong> and approved by the court. Without one, either spouse can bring a financial claim against the other later, sometimes long after the divorce itself is finalized.</p>
<p>The Supreme Court confirmed exactly how far this can go in <em>Wyatt v Vince</em> [2015] UKSC 14. The couple divorced in 1992 with no consent order in place; nearly two decades later, one spouse applied for a lump sum payment. The Supreme Court unanimously allowed the claim to proceed, holding that there is no fixed statutory time limit on bringing a financial claim after divorce when no consent order was ever made — although a very long delay is a factor the court can weigh heavily when it eventually decides the claim on its merits. The practical lesson is straightforward: finishing the divorce itself does not end financial risk. Only a sealed consent order does that.</p>

<h2>The Case Law That Shapes How Judges Decide</h2>
<p>Two House of Lords decisions still define how section 25's discretion gets applied in practice. <em>White v White</em> [2000] UKHL 54 established the "yardstick of equality" — the principle that a judge should not discriminate between the spouse who earned the money and the spouse who ran the home and raised the children, and should cross-check any proposed settlement against the standard of an equal division, departing from equality only where there's a good reason to. <em>Miller v Miller; McFarlane v McFarlane</em> [2006] UKHL 24 built on this with three organizing principles courts still use: <strong>needs</strong> (what each spouse actually requires going forward), <strong>compensation</strong> (for economic disadvantage one spouse took on for the marriage, such as leaving a career to raise children), and <strong>sharing</strong> (the idea that a marriage is an equal partnership, so its fruits are normally shared, though this can be adjusted for shorter marriages or for assets that were never really part of the marital partnership to begin with). Neither case creates a presumption of a 50/50 split — but both make clear that departing from equality needs to be justified by the actual facts, not assumed away.</p>

<h2>Prenuptial and Postnuptial Agreements</h2>
<p>Nuptial agreements are not automatically binding under the current law, but they carry real weight. Following <em>Radmacher v Granatino</em> [2010] UKSC 42, a court should give a nuptial agreement decisive weight if it was freely entered into by both spouses with a full understanding of what it meant, unless holding them to it would be unfair given the circumstances at the time of the divorce. That's a meaningfully different standard from simple contractual enforceability — a nuptial agreement is a strong starting point for a court, not an automatic override of the section 25 fairness analysis.</p>

<h2>How a Contested Case Actually Proceeds</h2>
<p>A financial claim begins with a Form A application, followed by a First Appointment, at which the court sets directions and identifies the real issues in dispute. Many cases then go to a Financial Dispute Resolution (FDR) hearing — a without-prejudice hearing where a judge gives an indication of likely outcomes to help the parties settle — and only proceed to a contested Final Hearing if that doesn't resolve things. Family Procedure Rules changes that took effect in April 2024 pushed this process further toward settling outside court altogether: courts can now adjourn proceedings to encourage non-court dispute resolution (mediation, arbitration, or a privately arranged FDR) even without both parties agreeing to the adjournment, and a party who unreasonably refuses to engage with non-court options, without good reason, risks a costs penalty that departs from the usual rule that each side bears its own costs in financial remedy cases.</p>

<h2>A Reform That Hasn't Happened Yet</h2>
<p>The current framework has faced sustained criticism for giving judges very wide discretion without much statutory precision, and reform is genuinely underway — though nothing has changed yet. The Law Commission published a scoping report in December 2024 setting out four possible models for reform, ranging from simply codifying the existing case law to a far more prescriptive statutory formula, without recommending a single option. The government has since indicated it favors a "codification-plus" approach — putting the needs and sharing principles on a statutory footing, alongside targeted changes such as making certain "qualifying" nuptial agreements automatically binding rather than merely persuasive. A public consultation, <strong>"A fairer end to relationships,"</strong> opened in June 2026 and remains open only a matter of days from the date of this article. No bill has been introduced and no date for one has been set. <strong>Anyone relying on this area of law today is still governed by the Matrimonial Causes Act 1973 framework described above — the reform discussion is real, but it is not yet law, and won't be for some time even in the best case.</strong></p>

<h2>Frequently Asked Questions</h2>
<h3>Do I need a consent order if my ex-spouse and I have already agreed how to split everything?</h3>
<p>Yes, if you want that agreement to actually be legally final. Without a court-approved consent order, your agreement is not binding, and either of you could bring a financial claim later — potentially years afterward, as the Supreme Court confirmed in Wyatt v Vince.</p>
<h3>Does a shorter marriage mean I'll get a smaller share of the assets?</h3>
<p>Not automatically, but marriage length is one of several section 25 factors a court weighs, and courts do sometimes treat shorter marriages differently, particularly regarding assets one spouse brought into the relationship rather than assets built up jointly during it. There's no fixed rule tying settlement size directly to marriage length.</p>
<h3>Is the law about to change?</h3>
<p>Not yet. A government consultation on reforming this area closes only days after this article's publication date, and the government has indicated a preferred direction, but no bill has been introduced. The Matrimonial Causes Act 1973 framework, as shaped by White v White and Miller/McFarlane, remains the current law.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Matrimonial Causes Act 1973, ss. 23–25A (as amended)</li>
<li><em>White v White</em> [2000] UKHL 54; <em>Miller v Miller; McFarlane v McFarlane</em> [2006] UKHL 24; <em>Radmacher v Granatino</em> [2010] UKSC 42; <em>Wyatt v Vince</em> [2015] UKSC 14</li>
<li>Law Commission, <em>Financial Remedies on Divorce and Dissolution</em>, scoping report (18 December 2024)</li>
<li>UK Government consultation, "A fairer end to relationships" (opened June 2026)</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you're separating, treat the financial settlement as a genuinely separate task from the divorce itself, not a formality that follows automatically — and if you and your former spouse reach an agreement between yourselves, get it turned into a court-approved consent order rather than relying on the agreement alone, however clear it feels at the time. Because section 25 gives courts wide discretion rather than a fixed formula, and because reform of this exact area of law is actively under public consultation as this is written, a solicitor who specializes in financial remedies can tell you both how the current law is likely to apply to your circumstances and whether the proposed reforms are close enough to matter for your timeline. For the general, worldwide picture of how divorce works, see <a href="/family-law/how-divorce-works-guide">How Divorce Works: A Plain-Language Guide to Ending a Marriage</a>, and for how nuptial agreements factor into a settlement, see <a href="/family-law/prenuptial-agreements-what-they-can-and-cannot-do">Prenuptial Agreements: What They Can and Cannot Do</a>.</p>

<p><em>This article is general legal information about the law of England and Wales, not legal advice, and reflects the law as understood at the time of writing during an active government consultation on reform. Scotland and Northern Ireland have separate family law systems. Consult a solicitor before acting.</em></p>`,
  },
  {
    id: 'fp-303',
    title: 'Property Settlement After Separation in Australia',
    slug: 'property-settlement-after-separation-australia',
    alphabet: 'P',
    categoryId: 'cat_family_personal',
    subcategoryId: 'sub_fp_divorce',
    category: FAMILY_PERSONAL_CATEGORY,
    subcategory: { id: 'sub_fp_divorce', name: 'Divorce', slug: 'divorce' },
    summary:
      "Australia has no 50/50 property-split presumption. The Family Law Amendment Act 2024 codified the courts' four-step approach and added a family violence factor.",
    author: 'Sofia Almeida',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'property-settlement-after-separation-australia',
    country: 'Australia',
    content: `<p>Australia doesn't split property on separation the way a community property system does — there's no legal presumption that everything gets divided 50/50. Instead, courts work through a structured analysis of what each person contributed to the relationship and what each of them will need afterward, then ask whether the resulting division is genuinely "just and equitable." That analysis used to live mostly in case law. Since mid-2025, it's now written directly into the Family Law Act itself, alongside new provisions on family violence and, for the first time, what happens to the family pet.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>The Family Law Act 1975 governs property settlement for both married and de facto couples nationwide — except in Western Australia, which retains its own state-based Family Court for de facto property matters.</li><li>The Family Law Amendment Act 2024 codified the courts' long-standing four-step approach directly into the statute, with most of the new provisions commencing 10 June 2025, including an explicit requirement to consider the effect of family violence and a new framework for deciding who keeps a companion animal.</li><li>Time limits are strict and different for married and de facto couples: 12 months from a divorce order taking effect for married couples, and 2 years from separation for de facto couples — late applications need the court's permission, which isn't automatic.</li><li>Superannuation counts as property and can be split as part of a settlement, including now for Western Australian de facto couples following a 2022 reform.</li><li>There is no presumption of an equal split — the outcome depends on each party's contributions and future needs, assessed case by case.</li></ul></div>

<h2>Who This Applies To</h2>
<p>The Family Law Act 1975 governs property settlement for married couples divorcing and, since 2009, for de facto couples separating as well — a reform that saw most states refer their power over de facto financial matters to the Commonwealth. Western Australia is the notable exception: it never referred that power, so de facto couples separating in WA generally have their property (though not always their superannuation, addressed separately below) dealt with by the state-based Family Court of Western Australia under its own Family Court Act 1997, rather than the federal framework that applies everywhere else in the country.</p>

<h2>The Four-Step Approach — Now Written Into the Statute</h2>
<p>For years, Australian courts assessed property settlement through a four-step process developed by case law rather than legislation — most notably shaped by the Full Court's decision in <em>Hickey v Hickey</em> (2003) and then significantly reframed by the High Court in <em>Stanford v Stanford</em> [2012] HCA 52, which held that a court must first ask whether making any property order is just and equitable at all, not treat that question as a final rubber stamp. The Family Law Amendment Act 2024, which received Royal Assent on 10 December 2024, codified this approach directly into the Act for the first time, with the bulk of its property-related provisions commencing on 10 June 2025. The now-statutory framework asks a court to:</p>
<ol>
<li>Identify the parties' existing legal and equitable interests and liabilities — the property pool, including superannuation;</li>
<li>Assess each party's contributions to the relationship — financial, non-financial, and as a homemaker or parent;</li>
<li>Assess each party's current and future circumstances — a renamed version of what were previously called the "future needs" factors, covering things like age, health, income and earning capacity, and care of children; and</li>
<li>Determine whether the resulting division is just and equitable.</li>
</ol>
<p>This didn't create a new test — it took the existing, judge-made approach and gave it statutory footing, which the government has said is intended to make the law more accessible and predictable without changing its underlying substance.</p>

<h2>Family Violence Is Now an Explicit Factor</h2>
<p>The 2024 reforms did add something genuinely new: an explicit statutory requirement that courts consider the effect of family violence on a party's contributions to the relationship. Previously, family violence's relevance to a property settlement was recognized mainly through case law (most notably the principle from <em>Kennon v Kennon</em>) rather than named directly in the Act. The amendments also broadened the Act's definition of family violence to explicitly capture economic and financial abuse — conduct like unreasonably denying a partner access to shared finances, deliberately undermining their ability to work or earn income, or coercing them into taking on debt. This is a substantive addition to how the contributions and future-needs analysis works, not just a restatement of the existing four-step process.</p>

<h2>A New Framework for Companion Animals</h2>
<p>In a genuinely novel addition to Australian property law, the 2024 reforms created a dedicated framework for "companion animals" — pets kept primarily for companionship, as distinct from assistance animals or animals kept for business, agricultural, or research purposes. Courts deciding what happens to a companion animal can order that one party gets sole ownership, that ownership transfers by consent, or that the animal be sold, and — consistent with the new family violence provisions — evidence of family violence, including threats or harm directed at an animal as a form of coercive control, is a relevant consideration in that decision.</p>

<h2>Strict, and Different, Time Limits</h2>
<p>The deadline to apply for a property settlement depends on what kind of relationship you were in, and the two are easy to confuse. <strong>Married couples</strong> generally have 12 months from the date their divorce order takes effect to apply. <strong>De facto couples</strong> generally have 2 years from the date they separated. In both cases, a court can grant leave to file after the deadline has passed, but only where it's satisfied that hardship would result from refusing leave, or where both parties consent — it is not a formality, and missing the deadline creates real risk of losing the ability to bring a claim at all.</p>

<h2>Binding Financial Agreements</h2>
<p>Australia's version of a prenuptial or postnuptial agreement is called a Financial Agreement, governed by Part VIIIA of the Act for married couples and the equivalent provisions for de facto couples. These can be made before, during, or after the relationship — including after separation — and each party must receive independent legal advice for the agreement to be valid, with a signed certificate confirming that advice was given. Courts retain the power to set a Financial Agreement aside in limited circumstances, including fraud (which can include one party failing to properly disclose their financial position), unconscionable conduct, or duress — it is not simply a private contract immune from court oversight.</p>

<h2>The Court System</h2>
<p>Most property settlement applications nationwide go through the Federal Circuit and Family Court of Australia (FCFCOA), formed by the 2021 merger of the former Family Court of Australia and the Federal Circuit Court, and organized into two divisions — Division 1 for more complex matters and appeals, Division 2 as the entry point for most new filings. Western Australia remains the exception, continuing to operate its own state-based Family Court of Western Australia for matters arising there.</p>

<h2>Superannuation Counts as Property</h2>
<p>Unlike some other jurisdictions where retirement savings sit outside the ordinary marital estate, Australian law treats superannuation as property that can be split as part of a settlement, a framework in place since 2002. This applies to married couples and to de facto couples in every state and territory that referred power to the Commonwealth — and, following a 2020 reform that took effect in 2022, it now applies to Western Australian de facto couples too, even though their general (non-superannuation) property still falls under WA's own state law.</p>

<h2>No Presumption of a 50/50 Split</h2>
<p>It bears repeating because it's the single most common misconception about Australian property settlement: there is no legal presumption of an equal division, and Australia does not operate a community property system. Whatever split a court eventually orders comes out of the contributions and future-needs analysis described above, applied to the specific facts of the relationship — which is exactly why two separations with similar asset pools can end in noticeably different outcomes.</p>

<h2>Frequently Asked Questions</h2>
<h3>Do I automatically get half of everything after separating from my partner in Australia?</h3>
<p>No. Australian law has no presumption of an equal split — a court works through each party's contributions and future needs to decide what's just and equitable on the specific facts, which can result in an equal division but doesn't require one.</p>
<h3>What happens if I miss the deadline to apply for a property settlement?</h3>
<p>You generally need the court's leave to proceed out of time, which is granted only if the court is satisfied that hardship would result from refusing it, or if both parties consent — it's a real hurdle, not a formality, which is why tracking your specific deadline (12 months post-divorce for married couples, 2 years post-separation for de facto couples) matters.</p>
<h3>Is Western Australia treated the same as the rest of Australia for property settlement?</h3>
<p>Not entirely. WA never referred its power over de facto property matters to the Commonwealth, so de facto couples separating there generally go through the state-based Family Court of Western Australia rather than the federal court system, though superannuation splitting for WA de facto couples was extended to match the rest of the country in 2022.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Family Law Act 1975 (Cth), Part VIII (married couples) and Part VIIIAB (de facto couples), as amended by the Family Law Amendment Act 2024</li>
<li><em>Stanford v Stanford</em> [2012] HCA 52; <em>Hickey v Hickey and the Attorney-General for the Commonwealth (Intervenor)</em> (2003) FLC 93-143</li>
<li>Family Law Amendment (Western Australia De Facto Superannuation Splitting and Bankruptcy) Act 2020</li>
<li>Federal Circuit and Family Court of Australia — property settlement and family violence guidance</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Work out early which time limit applies to your situation — married or de facto — and calendar the deadline, since leave to apply late is not guaranteed. Start gathering a clear picture of the property pool, including superannuation, as early as possible, since the first statutory step is identifying and valuing what's actually there. If family violence was part of your relationship, know that it is now an explicit factor courts must weigh, not just a background circumstance, so it's worth raising clearly with your lawyer. Because the four-step framework, the family violence provisions, and the companion animal framework are all genuinely new law as of June 2025, a family lawyer who is current on the 2024 amendments is a better resource than general information written before that date. For the general, worldwide picture of how divorce works, see <a href="/family-law/how-divorce-works-guide">How Divorce Works: A Plain-Language Guide to Ending a Marriage</a>, and for how Binding Financial Agreements compare to other jurisdictions' nuptial agreements, see <a href="/family-law/prenuptial-agreements-what-they-can-and-cannot-do">Prenuptial Agreements: What They Can and Cannot Do</a>.</p>

<p><em>This article is general legal information, not legal advice. Family law in Australia varies in application by state and territory and changes over time — consult a family lawyer licensed in the relevant jurisdiction before acting.</em></p>`,
  },
];
