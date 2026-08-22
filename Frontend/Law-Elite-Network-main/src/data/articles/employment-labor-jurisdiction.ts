import type { LawArticle } from '../law-content';

const EMPLOYMENT_LABOR_CATEGORY = {
  id: 'cat_employment_labor',
  name: 'Employment & Labor',
  slug: 'employment-law',
};

/**
 * Jurisdiction-specific companions to the comparative `el-002` "When Is a
 * Dismissal Considered Wrongful Termination?" pillar. Each piece exists
 * because el-002 deliberately stays comparative and does not go into a single
 * country's statutes, case law, or numbers -- see Phase 2 SEO research report
 * for the cannibalization check against el-002 and el-201 before these were
 * written.
 */
export const employmentLaborJurisdictionArticles: LawArticle[] = [
  {
    id: 'el-301',
    title: 'At-Will Employment Exceptions in the US by State',
    slug: 'at-will-employment-exceptions-by-state',
    alphabet: 'A',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_termination', name: 'Wrongful Termination', slug: 'wrongful-termination' },
    summary:
      'Every US state except Montana follows at-will employment, but most courts recognize real exceptions — public policy, implied contract, and good faith.',
    author: 'Daniel Okoro',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'at-will-employment-exceptions-us-states',
    country: 'United States',
    primarySources: [
      { label: 'Montana Code Annotated § 39-2-904 — elements of wrongful discharge', url: 'https://law.justia.com/codes/montana/title-39/chapter-2/part-9/section-39-2-904/' },
      { label: 'U.S. Equal Employment Opportunity Commission — federal anti-discrimination and anti-retaliation protections', url: 'https://www.eeoc.gov/' },
    ],
    content: `<p>At-will employment is the default rule in every U.S. state but one. In plain terms, it means your employer can end your job at any time, without warning and without giving a reason — and you can quit the same way. But "at-will" has never meant "no rules at all." Over the last several decades, state courts and legislatures have carved out real exceptions that limit when a firing is actually lawful, and one state has rejected the doctrine outright. Knowing which exceptions your state recognizes — and which it doesn't — is the difference between a firing that merely feels unfair and one you may be able to legally challenge.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>At-will employment is the default in 49 states; Montana is the sole exception, requiring "good cause" for dismissal after a probationary period.</li><li>Most other states recognize one or more common-law exceptions: public policy, implied contract, and the covenant of good faith and fair dealing.</li><li>A handful of states — commonly cited as Florida, Georgia, Louisiana, and Rhode Island — recognize few or none of these judicially created exceptions.</li><li>Federal anti-discrimination and anti-retaliation law applies regardless of a state's at-will exceptions.</li><li>Exact recognition and scope of each exception varies by state and continues to evolve through case law, so this guide explains the framework, not a substitute for checking current law where you live.</li></ul></div>

<h2>The One Real Outlier: Montana</h2>
<p>Montana is the only U.S. state that has replaced at-will employment with a statutory just-cause standard. Under the <strong>Montana Wrongful Discharge from Employment Act</strong> (Mont. Code Ann. §§ 39-2-901 to 39-2-915), a discharge is wrongful if it falls into one of three categories set out in § 39-2-904:</p>
<ul>
<li>it was in retaliation for the employee refusing to violate public policy, or for reporting a violation of public policy;</li>
<li>it was not for good cause, and the employee had already completed the employer's probationary period (§ 39-2-910 addresses that period); or</li>
<li>the employer materially violated the express provisions of its own written personnel policy, and that violation deprived the employee of a fair and reasonable opportunity to keep their job.</li>
</ul>
<p>The Act also caps and structures the available remedies (§ 39-2-905) and displaces most common-law wrongful-discharge claims for Montana employees (§ 39-2-913) — a genuine trade-off, not a one-sided win for workers. No other state has adopted anything equivalent; it remains a distinctly Montana feature of U.S. employment law.</p>

<h2>The Three Common-Law Exceptions Elsewhere</h2>
<p>In the other 49 states, at-will remains the default, but most courts have recognized one or more judge-made exceptions that can turn a dismissal into a legal claim even without a Montana-style statute.</p>

<h3>Public Policy Exception</h3>
<p>Most states will not enforce an at-will firing if it punishes an employee for exercising a legal right or duty — refusing to break the law, reporting a safety violation, filing a workers' compensation claim, or serving on a jury are the classic examples. This is the most widely recognized of the three exceptions, though states differ on how broadly they define "public policy" and whether it must trace to a specific statute or constitutional provision.</p>

<h3>Implied Contract Exception</h3>
<p>Some states will treat an employer's own words or conduct — specific promises of continued employment, or job-security language buried in an employee handbook — as forming an implied contract that overrides at-will status, even without a signed agreement. Employers in these states have largely responded with express "this handbook is not a contract" disclaimers, which is why reading the actual disclaimer language matters more than the general policy.</p>

<h3>Covenant of Good Faith and Fair Dealing</h3>
<p>A smaller number of states recognize an implied duty not to terminate an employee in bad faith — for example, firing someone specifically to avoid paying an earned commission or a vesting pension benefit. This is the narrowest and least consistently applied of the three exceptions.</p>

<h2>States With Fewer Recognized Exceptions</h2>
<p>Recognition of these exceptions is not uniform, and secondary legal sources commonly cite Florida, Georgia, Louisiana, and Rhode Island as states whose courts have declined to adopt some or all of them, leaving employees there more dependent on federal law, a written contract, or a specific state statute for protection. Because this area moves through individual court decisions rather than a single central register, treat any specific state's exception list as a starting point to verify against your state's current case law or a licensed employment lawyer, not a final answer.</p>

<h2>What At-Will Never Overrides: Federal Law</h2>
<p>Regardless of which exceptions a state recognizes, federal law independently prohibits firing an employee because of race, color, religion, sex, national origin, age (40+), disability, or genetic information, and prohibits retaliation for reporting these violations or participating in an investigation. An at-will employee who is fired for a discriminatory or retaliatory reason generally has a federal claim even in a state with narrow common-law exceptions.</p>

<h2>Practical Guidance</h2>
<ul>
<li><strong>Read your offer letter and handbook.</strong> Language promising job security, or a specific disciplinary process the employer didn't follow, is often the strongest evidence in an implied-contract state.</li>
<li><strong>Document the reason you were given.</strong> A stated reason that conflicts with your record, or that follows shortly after you exercised a legal right, is the fact pattern that supports a public-policy claim.</li>
<li><strong>Check your state, not just the national picture.</strong> The three exceptions above describe the general framework; whether your state recognizes a given exception, and how broadly, is a state-specific legal question.</li>
<li><strong>Act promptly.</strong> Both state common-law claims and federal discrimination charges carry filing deadlines that can be short — sometimes a matter of months from the dismissal.</li>
</ul>

<h2>Frequently Asked Questions</h2>
<h3>Is my state an at-will state?</h3>
<p>Almost certainly yes — every U.S. state except Montana follows at-will employment as the default rule. The more useful question is not whether your state is at-will, but which exceptions its courts recognize and how they've been applied.</p>
<h3>Can an at-will employee still sue for wrongful termination?</h3>
<p>Yes, in the right circumstances. At-will status means an employer doesn't need a reason to fire you, not that every reason is legally protected. A firing that violates public policy, breaches an implied contract, breaches the covenant of good faith, or violates federal anti-discrimination or anti-retaliation law can still support a claim.</p>
<h3>What makes Montana different from every other state?</h3>
<p>Montana replaced at-will employment with a statutory good-cause standard for employees who have completed their probationary period, under the Wrongful Discharge from Employment Act. No other state has adopted a comparable statute.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Montana Code Annotated, Title 39, Chapter 2, Part 9 — Wrongful Discharge From Employment Act (§§ 39-2-901 to 39-2-915), Montana Legislature</li>
<li>U.S. Equal Employment Opportunity Commission — federal anti-discrimination and anti-retaliation protections</li>
<li>State department of labor or state bar association resources for the specific state in question</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you believe you were fired unlawfully, start by writing down the timeline while it's fresh, gathering your offer letter and handbook, and noting anything you did shortly before the dismissal that could look like the exercise of a legal right. Because the applicable exception — and the deadline to act — depends on your specific state, a consultation with an employment lawyer licensed there is the most reliable next step. For the general, worldwide framework this guide builds on, see <a href="/employment-law/what-is-at-will-employment">What Is At-Will Employment?</a> and <a href="/employment-law/when-is-a-dismissal-wrongful-termination">When Is a Dismissal Considered Wrongful Termination?</a></p>

<p><em>This article is general legal information, not legal advice. Employment law varies by state and changes over time — consult a lawyer licensed in your state before acting.</em></p>`,
  },
  {
    id: 'el-302',
    title: 'Unfair Dismissal in the UK: Rights and 2027 Changes',
    slug: 'unfair-dismissal-uk-guide',
    alphabet: 'U',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_termination', name: 'Wrongful Termination', slug: 'wrongful-termination' },
    summary:
      "UK employees currently need two years' service to claim unfair dismissal — falling to six months from January 2027 under the Employment Rights Act 2025.",
    author: 'Daniel Okoro',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'unfair-dismissal-uk-employment-rights',
    country: 'United Kingdom',
    content: `<p>Unfair dismissal is a distinct legal claim in the UK, separate from wrongful dismissal (a breach-of-contract claim, usually about notice). It asks whether an employer had a fair reason to dismiss and followed a fair process — and, right now, whether the employee had worked there long enough to claim it at all. That last question is about to change. The UK is in the middle of the biggest reform to unfair dismissal rights in over a decade, and getting the timing right matters: publishing the future rule as if it already applies would simply be wrong.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>As of today, an employee generally needs two years' continuous service to bring an ordinary unfair dismissal claim.</li><li>The Employment Rights Act 2025 will cut that qualifying period to six months, but this change does not take effect until 1 January 2027.</li><li>Some dismissals are automatically unfair from day one regardless of length of service — for example, dismissal for whistleblowing or for asserting certain statutory rights.</li><li>Claims currently go through early conciliation with Acas before an Employment Tribunal claim can proceed.</li><li>The cap on unfair dismissal compensation is also due to be removed as part of the same reforms — check the current position before relying on any figure.</li></ul></div>

<h2>The Rule That Applies Today</h2>
<p>Under the current law, most employees need two years of continuous service with their employer before they can bring an ordinary unfair dismissal claim to an Employment Tribunal. This two-year qualifying period has been in place since April 2012. If you have less than two years of service and none of the "automatically unfair" exceptions below apply to your situation, you generally cannot bring this specific claim today — though you may have other options, such as a discrimination or breach-of-contract claim.</p>

<h2>What Changes on 1 January 2027 — And What Doesn't Yet</h2>
<p>The Employment Rights Act 2025 reduces the qualifying period from two years to six months. According to Acas, this change is expected to take effect from January 2027 and is not yet in force. Anyone continuously employed on or before 1 July 2026 will already have accrued six months' service by the time the new rule starts, meaning many current employees will move straight into the new, shorter qualifying period once it commences. The same reforms are also expected to remove the current cap on unfair dismissal compensation. <strong>Because this is a live legislative transition, always check the current commencement date on gov.uk or Acas before relying on either the "two years" or "six months" figure for a specific decision.</strong></p>

<h2>Dismissals That Are Unfair From Day One</h2>
<p>Regardless of the qualifying period — today or after the 2027 change — certain dismissals are treated as automatically unfair without any minimum service requirement. These commonly include dismissal for:</p>
<ul>
<li>whistleblowing (making a protected disclosure);</li>
<li>pregnancy or taking family leave such as maternity, paternity, or parental leave;</li>
<li>asserting a statutory employment right, such as the right to the National Minimum Wage or to request flexible working;</li>
<li>trade union membership or activities.</li>
</ul>
<p>These day-one protections exist independently of the qualifying-period debate and are unaffected by the 2027 change.</p>

<h2>What Makes a Dismissal Fair</h2>
<p>Where the qualifying period is met, an employer must show both a potentially fair reason for dismissal — conduct, capability, redundancy, a legal restriction, or "some other substantial reason" — and that it acted reasonably in treating that reason as sufficient, which usually means following a fair process: a genuine investigation, a chance for the employee to respond, and a right of appeal. A dismissal can be unfair either because the underlying reason wasn't good enough or because the process was flawed, even where the reason itself was sound.</p>

<h2>How a Claim Actually Proceeds</h2>
<ol>
<li><strong>Early conciliation:</strong> before filing a tribunal claim, an employee must notify Acas, which offers free, confidential conciliation to try to resolve the dispute without a hearing.</li>
<li><strong>Tribunal claim:</strong> if conciliation doesn't resolve it, the employee can file an Employment Tribunal claim, generally within three months less one day of the dismissal — a short deadline that is strictly enforced.</li>
<li><strong>Hearing and remedy:</strong> if the claim succeeds, the tribunal can order reinstatement, re-engagement, or — far more commonly — compensation, currently made up of a basic award and a compensatory award.</li>
</ol>

<h2>Frequently Asked Questions</h2>
<h3>Do I qualify for unfair dismissal protection today?</h3>
<p>Under the current law, generally only if you have at least two years' continuous service with your employer, unless one of the automatically unfair categories (such as whistleblowing or pregnancy-related dismissal) applies to you regardless of length of service.</p>
<h3>What changes in 2027 and does it apply to me?</h3>
<p>From 1 January 2027, the qualifying period is due to fall to six months under the Employment Rights Act 2025. If you're employed on or before 1 July 2026, you'll likely have already built up six months' service by the time the change takes effect, meaning you could gain protection from that date even if you don't have it today.</p>
<h3>Is the six-month qualifying period already law?</h3>
<p>The Employment Rights Act 2025 has been passed, but the six-month qualifying-period provision itself does not commence until 1 January 2027. Until that date, the current two-year rule remains the applicable law.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Acas — guidance on unfair dismissal qualifying periods and the Employment Rights Act 2025 reforms</li>
<li>GOV.UK — Employment Rights Act 2025 and dismissal guidance for employers and employees</li>
<li>UK Employment Tribunal procedural rules, for time limits and claim procedure</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you've been dismissed and are unsure whether you qualify, the safest first step is contacting Acas for free early guidance — they can confirm the current position and the applicable time limit for your specific dates of employment. Because the qualifying period is changing on a fixed future date, an employee close to either threshold should get their exact service dates checked rather than relying on a rule of thumb. For the general, worldwide picture of what makes a dismissal unlawful, see <a href="/employment-law/when-is-a-dismissal-wrongful-termination">When Is a Dismissal Considered Wrongful Termination?</a></p>

<p><em>This article is general legal information, not legal advice, and reflects the law as understood at the time of writing during an active legislative transition. Confirm the current qualifying period and any commencement dates with Acas or gov.uk before acting, and consult a solicitor for advice on your specific situation.</em></p>`,
    primarySources: [
      { label: 'Acas, Employment Rights Act 2025', url: 'https://www.acas.org.uk/employment-rights-act-2025' },
      { label: 'Employment Rights Act 2025 (UK)', url: 'https://www.legislation.gov.uk/ukpga/2025/36' },
      { label: 'The Employment Tribunal Procedure Rules 2024 (UK)', url: 'https://www.legislation.gov.uk/uksi/2024/1155' },
    ],
  },
  {
    id: 'el-303',
    title: 'Wrongful Dismissal in Canada: Reasonable Notice',
    slug: 'wrongful-dismissal-canada-reasonable-notice',
    alphabet: 'W',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_termination', name: 'Wrongful Termination', slug: 'wrongful-termination' },
    summary:
      'Canada has no true at-will employment — every non-federal employee is owed notice or pay in lieu, calculated case-by-case using the Bardal factors.',
    author: 'Daniel Okoro',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'wrongful-dismissal-canada-reasonable-notice',
    country: 'Canada',
    content: `<p>Unlike the United States, Canada has no true at-will employment. Every employee has an implied right, arising from the employment contract itself, to reasonable notice before their job ends — or pay in lieu of that notice — unless the employer had just cause to dismiss them outright. When an employer ends the relationship without enough notice and without just cause, that is wrongful dismissal. The hard part, and the part most searches on this topic are really asking about, is how "reasonable" gets calculated — and the honest answer is that there is no formula.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Canadian employees are entitled to reasonable notice (or pay in lieu) unless there is just cause for immediate dismissal — there is no general at-will employment.</li><li>Reasonable notice is decided case by case using the factors set out in <em>Bardal v. Globe & Mail Ltd.</em> (1960): character of employment, length of service, age, and availability of similar employment.</li><li>Provincial and territorial employment standards laws set statutory minimum notice, but courts routinely award common-law reasonable notice well above that minimum.</li><li>Widely circulated "one month per year of service" rules of thumb are not a legal formula and can significantly understate — or overstate — what a court would actually award.</li><li>Federally regulated employees with 12+ months of service have additional protection against dismissal without just cause under the Canada Labour Code.</li></ul></div>

<h2>Why Canada Has No At-Will Employment</h2>
<p>In the United States, the default assumption is that either side can end employment at any time. Canadian common law starts from the opposite premise: continued employment is presumed, and ending it requires either just cause or reasonable notice. This implied term exists in every employment contract even when nothing is written down, though a properly drafted written contract can lawfully set a different, specific notice period — provided it meets at least the statutory minimum.</p>

<h2>Statutory Minimums vs. Common-Law Reasonable Notice</h2>
<p>Every province and territory sets a statutory minimum notice period (or pay in lieu) based on length of service through its employment standards legislation. These minimums are a floor, not a ceiling. In a wrongful dismissal claim without an enforceable written notice clause, courts award common-law "reasonable notice," which is very often substantially longer than the statutory minimum — sometimes multiple times longer for long-service or senior employees. Satisfying the statutory minimum does not, on its own, satisfy the common-law obligation.</p>

<h2>The Bardal Factors</h2>
<p>The leading case, <em>Bardal v. Globe & Mail Ltd.</em> (1960), set out the factors Canadian courts still use today: the character of the employment, the length of service, the age of the employee, and the availability of similar employment given their experience, training, and qualifications. The Supreme Court of Canada has endorsed this approach, and lower courts have treated the list as non-exhaustive — meaning judges can and do weigh additional circumstances specific to the case. There is no fixed multiplier; two employees with similar tenure can receive meaningfully different notice periods depending on age, seniority, and how easily they could realistically find comparable work.</p>

<h2>Why "Rule of Thumb" Calculators Can Mislead</h2>
<p>You will find plenty of informal shortcuts online, most commonly some version of "one month of notice per year of service." Treat these cautiously. They can be a rough starting intuition, but they are not a rule any court is bound to apply, and Canadian employment lawyers routinely caution that they can understate what a senior, older, or hard-to-replace employee is actually entitled to — or overstate what a short-tenure, junior employee would receive. The Bardal factors, not a multiplier, are what a court will actually apply.</p>

<h2>Federally Regulated Employees: An Extra Layer</h2>
<p>Most Canadian employees are governed by provincial law, but employees of federally regulated industries (banking, telecommunications, interprovincial transportation, and similar sectors) fall under the Canada Labour Code. Under section 240 of the Code, a non-managerial employee with 12 or more consecutive months of service who is not covered by a collective agreement can file an unjust dismissal complaint, generally within 90 days of the dismissal — a separate, statutory process that can lead to a written statement of reasons and, in some cases, reinstatement, materially different from the common-law reasonable-notice claim available elsewhere. Managers and unionized employees are excluded from this specific complaint process, though they retain their other common-law or collective-agreement rights.</p>

<h2>Just Cause: The Exception That Removes Notice Entirely</h2>
<p>If an employer can establish just cause — serious misconduct such as theft, fundamental dishonesty, or a serious and persistent failure to perform after clear warning — no notice or pay in lieu is owed at all. Canadian courts set a high bar for just cause, and a poor performance review or a single mistake is rarely enough on its own; this is one of the most litigated questions in Canadian employment law precisely because the stakes (full reasonable notice versus none) are so high.</p>

<h2>Frequently Asked Questions</h2>
<h3>Is there a fixed formula for calculating reasonable notice in Canada?</h3>
<p>No. Courts apply the Bardal factors — character of employment, length of service, age, and availability of similar work — on a case-by-case basis. Any "X months per year of service" figure you see online is a rough shortcut, not a binding rule.</p>
<h3>What is the difference between statutory minimum notice and reasonable notice?</h3>
<p>Statutory minimum notice is the floor set by provincial or territorial employment standards legislation based on length of service. Common-law reasonable notice, decided under the Bardal factors, is very often higher and is what applies unless an enforceable written contract validly limits it.</p>
<h3>Does "at-will" employment exist anywhere in Canada?</h3>
<p>No. Every Canadian employee is entitled to reasonable notice or pay in lieu unless the employer has just cause for immediate dismissal, or a valid written contract sets a different, lawful notice period.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li><em>Bardal v. Globe &amp; Mail Ltd.</em> (1960), Ontario High Court — the leading case on reasonable notice factors</li>
<li>Canada Labour Code (R.S.C., 1985, c. L-2), section 240 — unjust dismissal complaints for non-managerial, non-unionized federally regulated employees with 12+ months' service</li>
<li>Provincial/territorial employment standards legislation for the applicable jurisdiction's statutory minimum notice</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you've been let go without cause, start by identifying whether you're provincially or federally regulated, checking whether your contract has an enforceable notice clause, and gathering your length of service, age, and role details — the exact inputs a court would weigh under Bardal. Because the gap between statutory minimums and what a court might actually award can be substantial, a consultation with an employment lawyer before signing any severance offer is usually worthwhile. For the general, worldwide picture of what makes a dismissal unlawful, see <a href="/employment-law/when-is-a-dismissal-wrongful-termination">When Is a Dismissal Considered Wrongful Termination?</a></p>

<p><em>This article is general legal information, not legal advice. Employment law varies by province and territory and changes over time — consult a lawyer licensed in the relevant jurisdiction before acting.</em></p>`,
    primarySources: [
      { label: 'Bardal v. Globe & Mail Ltd., 1960 CanLII 294 (ON SC)', url: 'https://www.canlii.org/en/on/onsc/doc/1960/1960canlii294/1960canlii294.html' },
      { label: 'Canada Labour Code, R.S.C., 1985, c. L-2, section 240', url: 'https://laws-lois.justice.gc.ca/eng/acts/L-2/section-240.html' },
    ],
  },
  {
    id: 'el-304',
    title: 'Unfair Dismissal in Australia: The Fair Work Process',
    slug: 'unfair-dismissal-australia-fair-work-commission',
    alphabet: 'U',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_termination', name: 'Wrongful Termination', slug: 'wrongful-termination' },
    summary:
      'Australian employees meeting service and income eligibility can challenge a harsh dismissal — within a strict 21-day Fair Work Commission window.',
    author: 'Daniel Okoro',
    updatedAt: 'August 12, 2026',
    readingTime: 11,
    views: 0,
    featured: false,
    imageSeed: 'unfair-dismissal-australia-fair-work-commission',
    country: 'Australia',
    primarySources: [
      { label: 'Fair Work Act 2009 (Cth), section 394 — application for unfair dismissal remedy, 21-day deadline', url: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/fwa2009114/s394.html' },
      { label: 'Fair Work Act 2009 (Cth), section 382 — when a person is protected from unfair dismissal', url: 'http://www.austlii.edu.au/au/legis/cth/consol_act/fwa2009114/s382.html' },
      { label: 'Fair Work Commission — unfair dismissal guidance and current high income threshold', url: 'https://www.fwc.gov.au/unfair-dismissals' },
    ],
    content: `<p>Under the Fair Work Act 2009 (Cth), a dismissal in Australia is "unfair" if it was harsh, unjust, or unreasonable. Unlike a breach-of-contract claim, unfair dismissal is a statutory right enforced through the Fair Work Commission (FWC), Australia's national workplace tribunal — and it comes with strict eligibility rules and one of the shortest filing deadlines in employment law anywhere: 21 calendar days.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>To be eligible, you generally need 6 months' service (12 months if your employer is a small business with fewer than 15 employees), and must earn under the high income threshold or be covered by an award or enterprise agreement.</li><li>The high income threshold is $190,100 for dismissals on or after 1 July 2026, and is adjusted annually — always confirm the figure current at the time of dismissal.</li><li>Applications must be lodged with the Fair Work Commission within 21 calendar days of the dismissal taking effect; extensions are granted only in exceptional circumstances.</li><li>Most claims are resolved through free, informal conciliation before ever reaching a hearing.</li><li>Available remedies are reinstatement or compensation — compensation is capped and reinstatement is comparatively rare in practice.</li></ul></div>

<h2>What Makes a Dismissal "Unfair"</h2>
<p>The Fair Work Commission assesses whether a dismissal was harsh, unjust, or unreasonable by weighing factors set out in the Fair Work Act, including whether there was a valid reason related to the person's capacity or conduct, whether they were notified of that reason and given a chance to respond, and whether the process was otherwise reasonable given the size and resources of the employer. A dismissal can be found unfair because of a flawed process even where the underlying reason had some merit.</p>

<h2>Eligibility: Who Can Apply</h2>
<p>Not every dismissed employee can bring an unfair dismissal claim. Three gates generally apply together:</p>
<ul>
<li><strong>Minimum employment period:</strong> 6 months of continuous service for most employers, or 12 months if the employer is a small business (fewer than 15 employees).</li>
<li><strong>Income or award coverage:</strong> you must earn less than the high income threshold, or be covered by a modern award, or have an enterprise agreement apply to your employment.</li>
<li><strong>Employment type:</strong> certain categories, such as some casual employees without a regular pattern of work, and contractors who are genuinely independent rather than employees, are generally excluded.</li>
</ul>
<p>The high income threshold is indexed annually on 1 July. For dismissals on or after 1 July 2026, it is $190,100, with the compensation cap for a successful claim set at half that figure. Because this number changes every year, confirm the threshold applicable on your actual dismissal date directly with the Fair Work Commission rather than relying on a figure from a prior year.</p>

<h2>The 21-Day Deadline</h2>
<p>An unfair dismissal application must be lodged with the Fair Work Commission within 21 calendar days after the dismissal takes effect. This is one of the strictest deadlines in Australian law — the Commission may only extend it in exceptional circumstances, and missing it is one of the most common reasons a genuinely strong case never gets heard. If you are considering a claim, treat the 21-day clock as the first and most urgent fact to establish, before assessing the merits of the case itself.</p>

<div class="callout callout-warning"><p><strong>The 21 days run from the date the dismissal took effect — not from when you decide to act, and not from your last physical day at work in every case.</strong> Confirming that exact trigger date is more urgent than assessing how strong your case is, since a strong case that's lodged late is not heard at all.</p></div>

<h2>How the Process Works</h2>
<ol>
<li><strong>Lodge the application:</strong> file with the Fair Work Commission within the 21-day window, identifying the dismissal and the outcome sought.</li>
<li><strong>Conciliation:</strong> the Commission typically arranges an informal, confidential conciliation conference, where most matters are resolved by agreement without a hearing.</li>
<li><strong>Hearing (if unresolved):</strong> if conciliation doesn't resolve the matter, it proceeds to a formal hearing before a Commission member, who hears evidence from both sides and issues a binding decision.</li>
<li><strong>Remedy:</strong> if the claim succeeds, the Commission can order reinstatement or, more commonly in practice, compensation — capped at the lower of 26 weeks' pay or half the high income threshold at the time of dismissal.</li>
</ol>

<h3>A Worked Timeline Example</h3>
<p>To make the deadline concrete: if an employee's dismissal takes effect on a Monday, the 21-day clock runs continuously — including weekends — and expires three weeks later, on the Monday three weeks after. A conciliation conference, if the matter proceeds, is typically listed some weeks after that, often conducted by phone or video rather than in person. This is illustrative only — the exact dates in a real matter depend on the Commission's current listing timeframes and should be confirmed directly with the Commission once an application is lodged.</p>

<h2>Unfair Dismissal vs Other Pathways</h2>
<p>Unfair dismissal is only one of several routes a dismissed Australian employee might have, and they are not interchangeable — each has its own forum, deadline, and cap.</p>
<table>
<thead><tr><th>Pathway</th><th>What it covers</th><th>Deadline</th><th>Outcome cap</th></tr></thead>
<tbody>
<tr><td><strong>Unfair dismissal</strong> (Fair Work Act Pt 3-2)</td><td>A dismissal that was harsh, unjust, or unreasonable, subject to the eligibility gates above</td><td>21 calendar days from dismissal</td><td>Reinstatement, or compensation capped at the lower of 26 weeks' pay or half the high income threshold</td></tr>
<tr><td><strong>General protections dismissal claim</strong> (Fair Work Act Pt 3-1, s.365)</td><td>Dismissal for a prohibited reason — e.g. exercising a workplace right, discrimination, or union membership — with no minimum service or income cap</td><td>21 calendar days from dismissal</td><td>Uncapped compensation; no minimum-service or high-income exclusion applies</td></tr>
<tr><td><strong>Breach of contract</strong> (common law, state/territory courts)</td><td>An employer failing to honour the employment contract itself, e.g. notice or termination-payment terms</td><td>Generally around six years in most states and territories (ordinary contract limitation period — confirm the exact period locally)</td><td>Damages for the contractual loss actually suffered, generally uncapped by statute</td></tr>
</tbody>
</table>
<p>Because the general protections pathway has no minimum-service or income-threshold gate, an employee who doesn't qualify for unfair dismissal — for instance, someone dismissed after only three months — may still have a general protections claim if the real reason for dismissal was a prohibited one.</p>

<h2>Frequently Asked Questions</h2>
<h3>How long do I have to file an unfair dismissal claim in Australia?</h3>
<p>21 calendar days from the date the dismissal takes effect. The Fair Work Commission will only extend this deadline in exceptional circumstances, so acting quickly matters more than having every detail of your case worked out first.</p>
<h3>What is the minimum employment period to be eligible?</h3>
<p>Generally 6 months of continuous service, extended to 12 months if your employer is a small business with fewer than 15 employees.</p>
<h3>Is there an income limit on who can claim unfair dismissal?</h3>
<p>Yes, unless you're covered by a modern award or enterprise agreement. The high income threshold is $190,100 for dismissals on or after 1 July 2026, and this figure is indexed annually — confirm the current amount for your specific dismissal date.</p>
<h3>What's the difference between unfair dismissal and a general protections claim?</h3>
<p>Unfair dismissal asks whether the dismissal itself was harsh, unjust, or unreasonable, and only certain employees are eligible to ask that question. A general protections claim asks a different question — was the real reason for dismissal a prohibited one, such as exercising a workplace right or discrimination — and it has no minimum-service or income-threshold gate, though a claimant generally cannot pursue both an unfair dismissal application and a general protections dismissal claim over the same dismissal at the same time.</p>
<h3>Can I bring a claim if I resigned rather than being formally dismissed?</h3>
<p>Sometimes — a resignation that was genuinely forced by an employer's conduct (sometimes called constructive dismissal) can still count as a dismissal for Fair Work Act purposes, but this is a fact-specific and often harder claim to establish than a straightforward termination, since the employee bears the burden of showing the resignation wasn't truly voluntary.</p>

<h2>Practical Next Steps</h2>
<p>If you've just been dismissed and think it may have been unfair, calculate your 21-day deadline first — it runs from the date the dismissal took effect, not from your last physical day at work in every case, so confirm the exact trigger date. From there, check your length of service against the minimum employment period and your earnings against the current high income threshold before assessing the substance of your case. For the general, worldwide picture of what makes a dismissal unlawful, see <a href="/employment-law/when-is-a-dismissal-wrongful-termination">When Is a Dismissal Considered Wrongful Termination?</a></p>

<details><summary>Article Sources</summary>
<ul>
<li>Fair Work Act 2009 (Cth), particularly ss. 382, 385, 392, and 394 — eligibility, the meaning of unfair dismissal, remedies, and the application deadline</li>
<li>Fair Work Commission (fwc.gov.au) — official unfair dismissal guidance and current high income threshold figures</li>
<li>Fair Work Ombudsman (fairwork.gov.au) — general employee-facing guidance on ending employment</li>
</ul>
</details>

<p><em>This article is general legal information, not legal advice. Figures such as the high income threshold are indexed annually — confirm the current amount with the Fair Work Commission, and consult an Australian employment lawyer for advice on your specific situation.</em></p>`,
  },
  {
    id: 'el-305',
    title: 'Non-Compete Enforceability by State in the US',
    slug: 'non-compete-enforceability-by-state-us',
    alphabet: 'N',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_contracts',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_contracts', name: 'Employment Contracts', slug: 'employment-contracts' },
    summary:
      'A few US states void non-competes outright, more ban them below a wage threshold, and the rest use a reasonableness test — now a state-by-state question.',
    author: 'Daniel Okoro',
    updatedAt: 'August 9, 2026',
    readingTime: 11,
    views: 0,
    featured: false,
    imageSeed: 'non-compete-enforceability-by-state-us',
    country: 'United States',
    primarySources: [
      { label: 'Ryan LLC v. FTC, N.D. Tex. (2024) — vacatur of the FTC non-compete rule', url: 'https://law.justia.com/cases/federal/district-courts/texas/txndce/3:2024cv00986/389064/211/' },
      { label: 'Federal Trade Commission, press release on acceding to vacatur of the Non-Compete Clause Rule (Sept. 2025)', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/09/federal-trade-commission-files-accede-vacatur-non-compete-clause-rule' },
      { label: 'Federal Register — removal of the FTC Non-Compete Rule from the CFR (Feb. 2026)', url: 'https://www.federalregister.gov/documents/2026/02/12/2026-02866/revision-of-the-negative-option-rule-withdrawal-of-the-cars-rule-removal-of-the-non-compete-rule-to' },
      { label: 'Cal. Bus. & Prof. Code § 16600' },
    ],
    content: `<p>Ask whether non-compete agreements are enforceable in the United States, and the honest answer is: it depends entirely on which state you're standing in. There is no federal non-compete law today — a rule that would have created one was finalized, then struck down, then formally abandoned. In its absence, the fifty states have gone in sharply different directions: a handful now void non-competes almost entirely, a growing group bans them only below a wage threshold, and the rest still apply a case-by-case reasonableness test that can uphold or kill the exact same clause depending on how it's drafted. This guide maps that current landscape — not a rewrite of the general worldwide explainer, but the specific, fast-moving U.S. state-by-state picture as it stands today.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>California, North Dakota, Oklahoma, and Minnesota void nearly all employee non-competes outright; Washington State will join them from June 30, 2027, and Wyoming enacted a narrower 2025 ban with executive and business-sale carve-outs.</li><li>A growing number of states — including Colorado, Illinois, Oregon, and Washington, D.C. — don't ban non-competes outright but void them for employees earning below an annually adjusted wage threshold.</li><li>The FTC's 2024 nationwide non-compete rule is no longer in effect in any sense: a federal court vacated it in 2024, the FTC dropped its appeal and formally accepted the vacatur in September 2025, and the rule was struck from the Code of Federal Regulations in February 2026. Non-compete law is once again entirely a state matter.</li><li>In the roughly two dozen states with neither a ban nor a threshold, courts apply a common-law reasonableness test to scope, duration, and geography — and some states will narrow ("blue-pencil") an overbroad clause while others simply void it.</li><li>This is one of the most legislatively active areas of U.S. employment law: dozens of bills move through state legislatures every year, so treat any specific figure here as a snapshot to verify against current state guidance before relying on it.</li></ul></div>

<h2>States That Void Non-Competes Outright</h2>
<p>Four states currently treat employee non-competes as void as a matter of course, with only narrow exceptions:</p>
<ul>
<li><strong>California</strong> has the strictest and most closely watched rule. Business and Professions Code §16600 voids nearly all employee non-competes, and two 2023 laws sharpened it further: AB 1076 required employers to notify current and former employees by February 14, 2024 that any non-compete clause in their contract was void, and SB 699 reaches beyond California's own borders — it voids a non-compete against a California employee <em>regardless of where or when the agreement was signed</em>, and creates a private right of action letting an employee sue an employer that tries to enforce one, with damages, injunctive relief, and attorney's fees available to a prevailing employee.</li>
<li><strong>North Dakota</strong> (N.D. Cent. Code §9-08-06) and <strong>Oklahoma</strong> (15 Okla. Stat. §219A) have voided employment non-competes for decades, each with narrow exceptions tied to selling a business or dissolving a partnership; Oklahoma additionally allows a narrow non-solicitation restriction on a former employer's established customers.</li>
<li><strong>Minnesota</strong> banned non-competes effective July 1, 2023 (Minn. Stat. §181.988), for contracts entered into on or after that date — the ban is not retroactive, so a Minnesota non-compete signed before mid-2023 may still be analyzed under the state's older reasonableness rules.</li>
</ul>
<p><strong>Washington State</strong> will become the newest member of this group, but not yet: Governor Bob Ferguson signed a sweeping, retroactive ban (ESHB 1155) on March 23, 2026, that voids virtually all non-competition covenants, including "customer non-servicing" and forfeiture-for-competition clauses — but it does not take effect until <strong>June 30, 2027</strong>, with employer notice obligations following on October 1, 2027. Until that date, Washington's existing wage-threshold rule (below) continues to apply.</p>
<p><strong>Wyoming</strong> enacted a 2025 law that is often lumped in with the outright bans but is meaningfully narrower: effective July 1, 2025, it voids most non-competes going forward, but non-competes remain enforceable for "executive and management personnel" and their professional staff, and for agreements tied to a business sale; physician non-competes are void outright as a separate rule. A Wyoming non-compete is not automatically dead the way a California one is — whether it survives depends heavily on the employee's role.</p>

<h2>A Common Misconception: Montana</h2>
<p>Montana's restraint-of-trade statute (Mont. Code Ann. §28-2-703) uses language superficially similar to California's void-non-compete rule, which leads some summaries to mistakenly group Montana with the ban states. It shouldn't be. Since a mid-1980s shift in its case law, the Montana Supreme Court has permitted <em>reasonable</em> non-competes, putting Montana much closer to the common-law reasonableness states discussed below than to the four true "void" states above.</p>

<h2>Wage-Threshold States: Banned Below a Number, Allowed Above It</h2>
<p>A separate and growing category doesn't ban non-competes across the board — it bans them only for employees earning below a specific wage, on the theory that lower-paid workers have the least bargaining power and the least access to the kind of trade secrets a non-compete is meant to protect. These thresholds are typically adjusted every year, so any dollar figure is a snapshot, not a permanent rule:</p>
<ul>
<li><strong>Colorado</strong> voids non-competes for workers earning below its state-adjusted threshold (set at $130,014 for 2026), with a separate, lower threshold for non-solicitation-only agreements (60% of the same figure).</li>
<li><strong>Illinois</strong>, under the Freedom to Work Act, sets separate thresholds for non-competes ($75,000 for 2026) and non-solicitation agreements ($45,000 for 2026), with both figures scheduled to keep rising in stages through 2037.</li>
<li><strong>Oregon</strong> voids non-competes below its own annually indexed threshold ($116,427 for 2026).</li>
<li><strong>Washington, D.C.</strong> bars non-competes below a general threshold ($162,164 for 2026) with a materially higher figure for "medical specialists" ($270,274 for 2026), both adjusted annually, and requires written disclosure of the restriction no later than when the job offer is accepted.</li>
<li><strong>Washington State</strong>, until its full 2027 ban takes effect, currently voids non-competes below its own state threshold, adjusted annually.</li>
<li>Several other states — including <strong>Maine, Rhode Island, Virginia,</strong> and <strong>Maryland</strong> — also apply their own wage-based thresholds, each set at a different figure and adjusted on its own schedule; because these numbers move every year and differ meaningfully by state, check the current figure with the relevant state labor agency rather than relying on a number printed in any general guide, including this one.</li>
</ul>
<p>Two states take a related but different approach rather than a flat dollar figure. <strong>Massachusetts</strong>'s Noncompetition Agreement Act doesn't set a wage floor at all — instead it requires "garden leave" pay (at least 50% of the employee's highest annualized base salary from the prior two years, paid throughout the restricted period) or other mutually agreed consideration, caps most non-competes at one year, and requires ten days' written notice before an employer tries to enforce one after termination. <strong>Nevada</strong> doesn't use a dollar threshold either — it bans non-competes for employees paid solely on an hourly basis, limits enforcement following a layoff to the severance period, and shifts attorney's fees onto an employer that tries to enforce a non-compete a court finds void.</p>

<h2>The Federal Rule That Rose and Fell</h2>
<p>For a period, it looked like all of this state-by-state variation might become moot. The Federal Trade Commission finalized a rule on April 23, 2024 that would have banned most non-competes nationwide, regardless of state law. It never took effect. A federal court in <em>Ryan LLC v. FTC</em> vacated the rule nationwide on August 20, 2024, holding the FTC lacked the statutory authority to issue it. The FTC initially appealed to the Fifth Circuit, but under new leadership the Commission reversed course: on September 4, 2025, it voted to drop the appeal and formally accede to the vacatur, and in February 2026 the rule was formally removed from the Code of Federal Regulations. <strong>As of today, there is no federal non-compete rule in effect, in any form</strong> — the FTC has instead said it will pursue non-competes case by case under its existing authority rather than through a blanket rule, and a separate bill in Congress (the Workforce Mobility Act) that would restrict non-competes by statute remains stalled in committee. Non-compete law, for now, is exactly what it was before 2024: a matter of state law, state by state.</p>

<h2>Everywhere Else: The Common-Law Reasonableness Test</h2>
<p>In the roughly two dozen states without a ban or a wage threshold, courts fall back on the traditional common-law test: a non-compete is enforceable only if it protects a legitimate business interest — trade secrets, confidential information, or genuine client relationships, not simply the avoidance of ordinary competition — and is reasonable in geographic scope, duration, and the activities it restricts. A restriction covering a wider territory than the employer actually operates in, or lasting longer than necessary to let the interest fade (commonly two years or less, though this varies), is vulnerable to challenge even in a state with no statutory ban at all.</p>
<p>States differ sharply on what happens when a court finds a clause overbroad. Some states — commonly cited as Florida and Texas — will "blue-pencil" the clause, narrowing an overreaching restriction to something reasonable and enforcing what's left, which is more favorable to employers drafting cautiously. Other states — commonly cited as Arkansas, Georgia, Nebraska, Virginia, and Wisconsin — decline to rewrite an unreasonable clause at all and instead void it in its entirety, a "red pencil" approach that puts far more pressure on getting the original drafting right. Because this split is decided by each state's case law rather than a single national rule, an employer operating across several of these states cannot assume the same non-compete language will be treated the same way in each one.</p>

<h2>A Fast-Moving Area of Law</h2>
<p>Non-compete law is one of the most legislatively active corners of U.S. employment law: trackers such as Beck Reed Riden's widely cited 50-state non-compete survey counted roughly 101 non-compete bills pending across 34 states as of early 2026. Several states enacted new restrictions in just the first half of 2026 alone — Tennessee added a $70,000 wage floor effective July 1, 2026, and Louisiana barred non-competes for interns and apprentices effective August 1, 2026. A significant share of recent state activity specifically targets non-competes for physicians and other licensed healthcare workers, a sector where several states have moved to restrict or ban them even while leaving the general rule for other employees unchanged. Given this pace of change, treat every figure and rule in this guide as accurate as of its publication date, and confirm the current rule in the specific state that matters to you before signing or enforcing anything.</p>

<h2>Frequently Asked Questions</h2>
<h3>Does the FTC's non-compete rule still apply anywhere in the U.S.?</h3>
<p>No. The rule was vacated by a federal court in August 2024, the FTC abandoned its appeal and formally accepted that outcome in September 2025, and the rule was removed from the Code of Federal Regulations in February 2026. Non-compete enforceability today depends entirely on the law of the applicable state.</p>
<h3>If my state has a wage threshold, does that mean my non-compete is automatically enforceable if I earn above it?</h3>
<p>Not necessarily. Clearing the wage threshold generally removes that specific statutory bar, but the clause can still be challenged as unreasonable in scope, duration, or geography, or on other grounds under the state's general contract law — a wage threshold is a floor beneath which a non-compete is void, not a guarantee that everything above it is automatically valid.</p>
<h3>I signed my non-compete years ago in a state that has since banned them — is it still enforceable?</h3>
<p>It depends on the specific law. Some bans, like Minnesota's, apply only to agreements signed on or after the effective date, leaving older agreements subject to the prior legal rule; others, like California's SB 699, are written to reach existing agreements more broadly. Check the effective date and retroactivity language of the specific state's statute, since this detail varies and materially changes the answer.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Cal. Bus. &amp; Prof. Code §§16600, 16600.1, 16600.5; California AB 1076 and SB 699 (2023)</li>
<li>N.D. Cent. Code §9-08-06; 15 Okla. Stat. §219A; Minn. Stat. §181.988; Wyoming SF 107 (2025); Washington ESHB 1155 (2026)</li>
<li>Colo. Rev. Stat. §8-2-113; Illinois Freedom to Work Act (820 ILCS 90); Or. Rev. Stat. §653.295; D.C. Ban on Non-Compete Agreements Amendment Act</li>
<li>Federal Trade Commission, non-compete rule rulemaking docket and September 2025 accession to vacatur; <em>Ryan LLC v. FTC</em>, N.D. Tex. (2024)</li>
<li>Beck Reed Riden LLP, 50-State Noncompete Survey (updated periodically)</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Start by identifying which category your state falls into — outright ban, wage threshold, or common-law reasonableness — since that alone determines what question actually matters for your situation. If your state uses a wage threshold, confirm the current figure directly with the state labor agency rather than an older printed source, since these numbers change annually. If you're being asked to sign a new non-compete, or your employer is trying to enforce an existing one, the state-specific rules above are a starting point, not a substitute for a consultation with an employment lawyer licensed in that state, particularly given how quickly this area of law is moving. For the general, worldwide framework this guide builds on, see <a href="/employment-law/what-is-a-non-compete-agreement">What Is a Non-Compete Agreement?</a> and, for the related question of when a U.S. dismissal itself is unlawful, <a href="/employment-law/at-will-employment-exceptions-by-state">At-Will Employment Exceptions in the U.S.: A State-by-State Guide</a>.</p>

<p><em>This article is general legal information, not legal advice. Non-compete law varies by state and changes frequently — confirm the current rule in the applicable state and consult a lawyer licensed there before signing, relying on, or attempting to enforce a non-compete agreement.</em></p>`,
  },
  {
    id: 'el-306',
    title: "Ontario's Non-Compete Ban vs. the Rest of Canada",
    slug: 'ontario-non-compete-ban-vs-rest-of-canada',
    alphabet: 'O',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_contracts',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_contracts', name: 'Employment Contracts', slug: 'employment-contracts' },
    summary:
      "Ontario has banned most employee non-competes by statute since 2021. Elsewhere in Canada the common-law reasonableness test applies; Quebec has its own rules.",
    author: 'Daniel Okoro',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'ontario-non-compete-ban-vs-rest-of-canada',
    country: 'Canada',
    content: `<p>Ontario is the only Canadian province that has banned non-compete agreements by statute. Everywhere else in Canada, a non-compete clause lives or dies under the common law's demanding "reasonableness" test — and Quebec applies its own distinct civil-law framework on top of that. The result is a patchwork that catches many employees and employers by surprise: a clause that would be automatically void in Toronto can still be argued over, and sometimes enforced, in Calgary or Halifax. A federal bill introduced in 2026 could extend Ontario's approach to federally regulated workers, but as of today it remains a proposal, not law.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Ontario's Employment Standards Act, 2000 has banned most employee non-compete agreements since October 25, 2021, with narrow exceptions for senior executives and sellers of a business.</li><li>Non-competes signed in Ontario before October 25, 2021 are not automatically void — they remain subject to the ordinary common-law reasonableness test, as confirmed in <em>Parekh v. Schecter</em> (2022).</li><li>Outside Ontario, Canadian courts apply a strict reasonableness test to non-competes and, unlike courts in some U.S. states, will not "blue-pencil" (rewrite) an overbroad clause to make it enforceable — an unreasonable clause is simply void.</li><li>Quebec governs non-competes through Civil Code article 2089, a written-contract regime distinct from the common law, and puts the burden of proving the clause is reasonable on the employer.</li><li>Federally regulated employees currently have no non-compete-specific protection in the Canada Labour Code, though a 2026 federal bill would change that if passed.</li></ul></div>

<h2>Ontario's Statutory Ban</h2>
<p>Ontario added Part XV.1 to the Employment Standards Act, 2000 ("ESA") through the Working for Workers Act, 2021, and the government confirms it "was deemed to have come into force on October 25, 2021." Section 67.1 defines a non-compete agreement broadly, as any agreement — or any part of one — that prohibits an employee "from engaging in any business, work, occupation, profession, project or other activity that is in competition with the employer's business after the employment relationship between the employee and the employer ends." Section 67.2 then makes any such agreement void, subject to two exceptions. The definition catches a clause regardless of how it's labelled, and it applies whether or not the restriction is limited by time or geography — Ontario didn't narrow non-competes, it removed them for almost every employee.</p>

<h2>The Two Exceptions</h2>
<h3>Senior Executives</h3>
<p>The ban does not apply to an "executive," a term the ESA defines by naming specific C-suite titles: Chief Executive Officer, President, Chief Administrative Officer, Chief Operating Officer, Chief Financial Officer, Chief Information Officer, Chief Legal Officer, Chief Human Resources Officer, Chief Corporate Development Officer, "or any other chief executive position." Employment lawyers have flagged real ambiguity around this list — it's unclear whether it's exhaustive or whether a title like Executive Vice President would qualify — and Ontario courts have not yet fully settled the question. An employer relying on the executive exception for anyone other than a clearly listed C-suite role should not assume the exception applies without legal advice.</p>
<h3>Sale of a Business</h3>
<p>The ban also does not apply where a business — or part of one — is sold or leased and the seller becomes an employee of the purchaser immediately after the sale, provided the non-compete is contained in the purchase agreement itself. This exception recognizes that a business buyer typically needs the seller's promise not to immediately re-enter the market and compete with the very business just sold, which is a different transaction from an ordinary employer restricting an ordinary employee.</p>

<h2>What About Clauses Signed Before October 25, 2021?</h2>
<p>A common misconception is that Ontario's ban retroactively voided every existing non-compete. It didn't. The Ontario government's own guidance confirms Part XV.1 "does not prohibit or void non-compete agreements that were entered into prior to October 25, 2021" — those older clauses remain subject to ordinary common-law scrutiny, exactly as they would have been before the ESA amendment. The Ontario Superior Court confirmed this directly in <em>Parekh v. Schecter</em> (2022), enforcing a non-compete tied to a $5.6 million dental practice sale because the agreement predated the statutory cutoff, even though the same clause would likely be void if signed today. Anyone reviewing an older Ontario non-compete needs to check the signature date against October 25, 2021 before assuming either that it's automatically void or automatically enforceable.</p>

<h2>Non-Solicitation and Confidentiality Clauses Are Different</h2>
<p>Ontario's ban targets non-compete clauses specifically — it does not touch non-solicitation agreements (which stop a departing employee from poaching clients or colleagues without banning them from the field entirely) or confidentiality agreements, provided those clauses are genuinely what they claim to be. A non-solicitation clause drafted so broadly that it functions as a disguised non-compete — for example, one that effectively bars an employee from working in their field at all — risks being recharacterized by a court as a non-compete in substance, and struck down under the same statutory ban despite its label.</p>

<h2>Everywhere Else in Canada: The Common-Law Reasonableness Test</h2>
<p>No other Canadian province or territory has enacted an Ontario-style statutory ban. Outside Ontario, a non-compete is presumed unenforceable as an unlawful restraint of trade unless the employer can show it is reasonable — a burden the employer carries, not the employee. Courts weigh whether the restriction's duration, geographic scope, and the activities it restricts go no further than necessary to protect a legitimate business interest, such as trade secrets or genuine client relationships, rather than simply suppressing ordinary competition.</p>
<p>The leading authority is the Supreme Court of Canada's decision in <em>Shafron v. KRG Insurance Brokers (Western) Inc.</em>, 2009 SCC 6. Shafron had sold his insurance agency to KRG and continued working for the buyer under a covenant restricting him from competing within the "Metropolitan City of Vancouver" for three years after leaving — a phrase with no fixed legal meaning. The Court found the clause ambiguous and therefore unenforceable, and — critically for how Canadian courts approach these clauses generally — declined to simply delete the offending word and enforce what remained.</p>

<h3>Why Canadian Courts Rarely Rewrite an Overbroad Clause</h3>
<p>This is one of the sharpest contrasts with the United States, where some states' courts will "blue-pencil" an overbroad non-compete — narrowing it to a reasonable scope and enforcing what's left. Canadian courts generally will not. <em>Shafron</em> held that judicial severance is available only in rare cases where the offending part is trivial and not part of the covenant's main purpose, which is a high bar the facts in that case didn't meet. In practice, this means a Canadian employer largely gets one attempt to draft an enforceable clause — an overreaching non-compete is far more likely to be struck down entirely than narrowed and saved, which is exactly why careful, conservative drafting matters more in Canada than it might elsewhere.</p>

<h2>Quebec's Distinct Civil-Law Framework</h2>
<p>Quebec does not follow the common law at all — non-competes there are governed by the Civil Code of Québec, a written-contract regime. Article 2089 requires that a non-competition stipulation be in writing and expressed in clear terms, and be "limited, as to time, place and type of employment, to what is necessary for the protection of the legitimate interests of the employer." The Civil Code puts the burden of proving the stipulation is valid squarely on the employer. A related provision, article 2095, makes a non-compete unenforceable if the employer terminated the employee without a serious reason, or gave the employee just cause to resign — reflecting a principle that an employer that ended the relationship unfairly cannot also restrict what the employee does next.</p>

<h2>Federally Regulated Employees: A Change That May Be Coming</h2>
<p>Employees of federally regulated industries — banking, telecommunications, interprovincial transportation, and similar sectors — fall under the Canada Labour Code for matters like hours and termination, but the Code currently has no non-compete-specific provision at all. Their restrictive covenants are governed by the same common-law (or, in Quebec, civil-law) principles that apply to provincially regulated employees in the same province.</p>
<p>That may be about to change. Bill C-31, the Budget 2025 Implementation Act, No. 2, introduced in the House of Commons on May 6, 2026, would add a new division to the Canada Labour Code explicitly modeled on Ontario's ESA framework — prohibiting non-competes for federally regulated employees with the same two categories of exception (business sale, senior executives), and including a one-year transition period before existing clauses would become void. As of this writing, the bill is at second reading in the House of Commons and has not been passed into law. <strong>Treat this as a proposal to watch, not a rule currently in force</strong> — federally regulated employees today have the same common-law protection (and the same burden on the employer to justify a restriction) as other non-Ontario, non-Quebec employees, unless and until Bill C-31 or similar legislation is actually enacted.</p>

<h2>Frequently Asked Questions</h2>
<h3>Does Ontario's non-compete ban apply to me if I work for a federally regulated employer in Ontario?</h3>
<p>Generally no — the ESA is provincial employment standards legislation and does not apply to federally regulated employers (banks, telecoms, airlines, and similar sectors) even if they operate in Ontario. Those employees currently rely on the common-law reasonableness test unless a federal law like the proposed Bill C-31 is enacted.</p>
<h3>If my non-compete is void under Ontario's ESA, can my employer still enforce a non-solicitation clause in the same contract?</h3>
<p>Often yes, provided the non-solicitation clause is genuinely limited to protecting client and colleague relationships rather than functioning as a disguised ban on working in the field. Courts assess what the clause actually does, not just what it's labelled.</p>
<h3>Will a Canadian court narrow my overbroad non-compete instead of striking it down completely?</h3>
<p>Outside narrow circumstances, no. Following the Supreme Court's approach in <em>Shafron</em>, Canadian courts generally refuse to "blue-pencil" an unreasonable restraint into a reasonable one — an overbroad clause is typically void in its entirety, which is a real risk for employers relying on broadly worded restrictions.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Employment Standards Act, 2000, S.O. 2000, c. 41, Part XV.1 (ss. 67.1–67.2), as added by the Working for Workers Act, 2021 — Government of Ontario</li>
<li><em>Parekh et al. v. Schecter et al.</em>, 2022 ONSC 302 (Ont. Sup. Ct. J.)</li>
<li><em>Shafron v. KRG Insurance Brokers (Western) Inc.</em>, 2009 SCC 6</li>
<li>Civil Code of Québec, arts. 2089 and 2095</li>
<li>Bill C-31, Budget 2025 Implementation Act, No. 2, House of Commons of Canada (introduced May 6, 2026; not yet enacted)</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you're an Ontario employee, start by checking the signature date on your non-compete against October 25, 2021 — that single fact determines whether the statutory ban or the older common-law test applies to your clause. If you're outside Ontario, or federally regulated, assume your non-compete must clear the common-law reasonableness bar, and remember the burden of proving that falls on your employer, not you. Because the exceptions, the Quebec civil-law rules, and the federal bill's progress can all shift the analysis, a short consultation with an employment lawyer licensed in the relevant province is the safest way to know where you actually stand. For the general, worldwide framework this guide builds on, see <a href="/employment-law/what-is-a-non-compete-agreement">What Is a Non-Compete Agreement?</a> and, for what happens when a Canadian employment relationship ends more broadly, <a href="/employment-law/wrongful-dismissal-canada-reasonable-notice">Wrongful Dismissal in Canada: How 'Reasonable Notice' Is Calculated</a>.</p>

<p><em>This article is general legal information, not legal advice. Employment law varies by province and territory and changes over time — consult a lawyer licensed in the relevant jurisdiction before acting.</em></p>`,
    primarySources: [
      { label: 'Employment Standards Act, 2000, Part XV.1 (Ontario) — non-compete agreements', url: 'https://www.ontario.ca/document/employment-standard-act-policy-and-interpretation-manual/part-xv1-non-compete-agreements' },
      { label: 'Parekh et al. v. Schecter et al., 2022 ONSC 302' },
      { label: 'Shafron v. KRG Insurance Brokers (Western) Inc., 2009 SCC 6', url: 'https://www.canlii.org/en/ca/scc/doc/2009/2009scc6/2009scc6.html' },
      { label: 'Civil Code of Québec, articles 2089 and 2095', url: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/ccq-1991' },
      { label: 'Bill C-31, Budget 2025 Implementation Act, No. 2 (not yet enacted)' },
    ],
  },
  {
    id: 'el-307',
    title: "Australia's Incoming Non-Compete Ban Explained",
    slug: 'australia-non-compete-ban-sub-threshold-workers',
    alphabet: 'A',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_contracts',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_contracts', name: 'Employment Contracts', slug: 'employment-contracts' },
    summary:
      'Australia has proposed banning non-competes below a high-income threshold from 2027, but no bill exists yet — the common-law test still applies today.',
    author: 'Daniel Okoro',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'australia-non-compete-ban-sub-threshold-workers',
    country: 'Australia',
    content: `<p>If you've read that Australia has banned non-compete clauses for most workers, that's ahead of where the law actually stands. The federal government has announced the policy, run a full public consultation on how it should work, and set a target start date — but as of today, no bill has been introduced into Parliament, and no non-compete ban is in force anywhere in Australia. This guide separates what has actually been announced and consulted on from what remains to be legislated, and explains the rule that governs non-competes right now, while the reform is still being designed.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>The government announced its intention to ban non-compete clauses for workers earning below the Fair Work Act high-income threshold in the 2025-26 Federal Budget, handed down on 25 March 2025, with a target start of 2027.</li><li>As of today, this remains a policy proposal, not law: no bill has been introduced into the Australian Parliament, and Treasury's public consultation on the reform's design closed in September 2025 with the details still being finalized.</li><li>The current high-income threshold, which the ban would use as its cutoff, is $190,100 for the 2026-27 financial year (from 1 July 2026) — a figure that is itself adjusted every year and would need to be checked again by the time any ban actually commences.</li><li>Until a ban is enacted, non-competes in Australia remain governed by the ordinary common-law restraint-of-trade doctrine: void unless the employer proves the restriction is reasonable.</li><li>New South Wales has its own statute, the Restraints of Trade Act 1976 (NSW), letting courts partially enforce an unreasonable restraint rather than strike it out entirely — a state-specific rule, not a national one.</li></ul></div>

<h2>What Has Actually Been Announced</h2>
<p>The proposal traces back to a Treasury issues paper published in April 2024, examining non-compete clauses and other worker restraints as part of a broader competition policy review. That consultation fed directly into the 2025-26 Federal Budget, handed down on 25 March 2025, in which the government announced its intention to ban non-compete clauses for most workers earning below the Fair Work Act's high-income threshold, targeting a start date of 2027. Treasury then ran a further public consultation specifically on the reform's design between July and September 2025, drawing dozens of submissions, with the stated purpose of helping the government finalize the policy's details.</p>

<h2>The Most Important Fact: This Is Not Yet Law</h2>
<p><strong>As of today, no bill implementing this ban has been introduced into the Australian Parliament.</strong> The Fair Work Ombudsman's own current guidance confirms this directly, stating plainly that the Fair Work Act doesn't set any rules for non-compete clauses in employment contracts and that it cannot advise on them — a clear signal that the announced reform has not yet become operative law. The government has announced the policy, consulted on it, and stated a target commencement year, but design work on the details was reportedly still ongoing as of mid-2026, with no exposure draft of legislation formally introduced. Treat any claim that Australia "has banned" non-competes, or that a specific bill is already before Parliament, with real skepticism until you can confirm it against Treasury's own consultation page or the Australian Parliament's official bill register — this is a fast-moving policy area, and secondary sources have not always kept pace accurately with where the reform actually stands.</p>

<h2>What the Ban Is Expected to Cover</h2>
<p>Based on the government's own announcements and consultation materials, the proposal targets non-compete clauses specifically — restrictions on working for a competitor or starting a competing business after employment ends — for workers earning below the high-income threshold. That threshold is itself indexed annually: it was $175,000 at the time of the original Budget announcement, rose to $183,100 from 1 July 2025, and stands at $190,100 for the 2026-27 financial year from 1 July 2026. Because the ban's proposed design and its target date both sit in the future, and because this threshold moves every year regardless of the reform's progress, don't assume today's figure will still be the relevant one once any ban actually takes effect.</p>
<p>A sale-of-business exception has been consistently discussed as likely to survive into any final version of the reform, on the same logic used in other jurisdictions — a business buyer typically needs some assurance the seller won't immediately re-enter the market and compete. Beyond that, Treasury's own consultation has left open questions genuinely undecided as of this writing, including whether non-solicitation clauses (as distinct from non-competes) would be swept into any new restriction, and what carve-outs, if any, would apply for senior executives or equity holders. Some specific numeric figures — particular restraint-length caps or equity-ownership thresholds — circulate in secondary commentary online, but could not be confirmed against an official government source at the time of writing; treat any such specific figure as unverified until Treasury or an introduced bill confirms it.</p>

<h2>A Related but Separate Reform: No-Poach and Wage-Fixing Agreements</h2>
<p>Bundled into the same general policy conversation, but legally distinct, is a separate proposal to restrict "no-poach" and wage-fixing agreements — arrangements between <em>businesses</em> not to hire each other's staff or to coordinate on wages, as opposed to a restriction between an employer and its own employee. This strand would work through the Competition and Consumer Act 2010 rather than the Fair Work Act, shares the same April 2024 Treasury origin and the same 2025-26 Budget announcement, but is a separate mechanism from the employee non-compete ban discussed above, and sits at a similar not-yet-enacted stage.</p>

<h2>What Governs Non-Competes in Australia Right Now</h2>
<p>Until any ban actually passes into law, non-compete clauses in Australia are governed by the ordinary common-law restraint-of-trade doctrine, applied consistently across the country: a restraint is presumed void unless the party trying to enforce it — almost always the employer — proves it is reasonable, meaning no broader than necessary to protect a legitimate business interest such as confidential information, trade connections, or client goodwill, and reasonable in its duration, geographic scope, and the activities it restricts.</p>
<p>New South Wales has its own additional statute layered on top of this general common-law rule: the Restraints of Trade Act 1976 (NSW) provides that a restraint of trade is valid to the extent it is not against public policy, which lets NSW courts read down or partially enforce an unreasonable restraint rather than voiding it outright — a more flexible approach than the stricter severance principles that apply under the general common law elsewhere in Australia. This is a New South Wales-specific rule; no other state or territory has an equivalent statute, so the same overly broad non-compete clause could be partially rescued by a NSW court while being struck down entirely in another state.</p>

<h2>Frequently Asked Questions</h2>
<h3>Has Australia banned non-compete clauses for lower-paid workers?</h3>
<p>Not yet. The government has announced this as a policy goal and consulted on how it would work, targeting 2027, but no bill has been introduced into Parliament and no ban is currently in force anywhere in Australia.</p>
<h3>If I'm asked to sign a non-compete today, does the proposed ban protect me?</h3>
<p>No — a proposal that hasn't been enacted has no legal effect. A non-compete signed today is governed by the existing common-law reasonableness test (and, in New South Wales, the Restraints of Trade Act 1976), not by the reform that's still being designed.</p>
<h3>When will the ban actually take effect?</h3>
<p>The government's target has been 2027, but that target predates a bill even being introduced, and the exact commencement date isn't fixed until legislation is actually passed. Check Treasury's consultation page or the Australian Parliament's bill register for the current status before relying on any specific date.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Australian Government, 2025-26 Federal Budget (25 March 2025), non-compete clause reform announcement</li>
<li>Australian Treasury, consultation on non-compete clauses and other restraints on workers (2024 issues paper; 2025 design consultation)</li>
<li>Fair Work Ombudsman (fairwork.gov.au) — current guidance confirming no statutory non-compete rules are yet in force</li>
<li>Restraints of Trade Act 1976 (NSW)</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you're being asked to sign a non-compete in Australia today, assess it under the law that actually applies right now — the common-law reasonableness test, plus the NSW-specific statute if that's the relevant state — not the reform that's still being designed. If you're an employer planning restrictive covenants with an eye on the next few years, keep an eye on Treasury's consultation outcomes and the parliamentary bill register rather than assuming any specific reported detail is final. Because this is a genuinely fast-moving area with real potential for the rules to change materially before 2027, a consultation with an employment lawyer is the most reliable way to get both today's answer and a read on how exposed a given clause might be to the coming reform. For the general, worldwide framework this guide builds on, see <a href="/employment-law/what-is-a-non-compete-agreement">What Is a Non-Compete Agreement?</a> and, for how Australian dismissals themselves are challenged, <a href="/employment-law/unfair-dismissal-australia-fair-work-commission">Unfair Dismissal in Australia: Eligibility and the Fair Work Commission Process</a>.</p>

<p><em>This article is general legal information, not legal advice, and describes a law reform that had not been enacted as of publication. Confirm the current status with the Fair Work Ombudsman or Treasury, and consult an Australian employment lawyer before signing or relying on a non-compete agreement.</em></p>`,
    primarySources: [
      { label: 'Australian Treasury, reform to non-compete clauses and other restraints on workers', url: 'https://treasury.gov.au/consultation/c2025-681950' },
      { label: 'Fair Work Ombudsman, employment contracts', url: 'https://www.fairwork.gov.au/employment-conditions/employment-contracts/get-help-with-employment-contracts' },
      { label: 'Restraints of Trade Act 1976 (NSW)', url: 'https://legislation.nsw.gov.au/view/whole/pdf/inforce/2024-05-07/act-1976-067' },
    ],
  },
];
