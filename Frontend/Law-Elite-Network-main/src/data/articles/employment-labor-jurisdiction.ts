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
    title: 'At-Will Employment Exceptions in the U.S.: A State-by-State Guide',
    slug: 'at-will-employment-exceptions-by-state',
    alphabet: 'A',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_termination', name: 'Wrongful Termination', slug: 'wrongful-termination' },
    summary:
      'Every U.S. state except Montana follows at-will employment, but courts in most states have carved out real exceptions — public policy, implied contract, and good faith — that limit when an employer can actually fire you.',
    author: 'Daniel Okoro',
    updatedAt: 'August 9, 2026',
    readingTime: 10,
    views: 0,
    featured: false,
    imageSeed: 'at-will-employment-exceptions-us-states',
    country: 'United States',
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
    title: 'Unfair Dismissal in the UK: Qualifying Period, Rights and the 2027 Changes',
    slug: 'unfair-dismissal-uk-guide',
    alphabet: 'U',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_termination', name: 'Wrongful Termination', slug: 'wrongful-termination' },
    summary:
      'UK employees currently need two years of service to claim unfair dismissal — but that qualifying period is set to fall to six months from January 2027 under the Employment Rights Act 2025. Here is what applies today and what changes.',
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
  },
  {
    id: 'el-303',
    title: "Wrongful Dismissal in Canada: How 'Reasonable Notice' Is Calculated",
    slug: 'wrongful-dismissal-canada-reasonable-notice',
    alphabet: 'W',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_termination', name: 'Wrongful Termination', slug: 'wrongful-termination' },
    summary:
      "Canada has no true at-will employment — every non-federal employee is owed either working notice or pay in lieu, and courts calculate that notice case by case using the Bardal factors, not a fixed formula.",
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
  },
  {
    id: 'el-304',
    title: 'Unfair Dismissal in Australia: Eligibility and the Fair Work Commission Process',
    slug: 'unfair-dismissal-australia-fair-work-commission',
    alphabet: 'U',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: EMPLOYMENT_LABOR_CATEGORY,
    subcategory: { id: 'sub_el_termination', name: 'Wrongful Termination', slug: 'wrongful-termination' },
    summary:
      "Australian employees who meet the minimum employment period and income eligibility rules can challenge a dismissal that was harsh, unjust or unreasonable — but only within a strict 21-day window to lodge with the Fair Work Commission.",
    author: 'Daniel Okoro',
    updatedAt: 'August 9, 2026',
    readingTime: 9,
    views: 0,
    featured: false,
    imageSeed: 'unfair-dismissal-australia-fair-work-commission',
    country: 'Australia',
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

<h2>How the Process Works</h2>
<ol>
<li><strong>Lodge the application:</strong> file with the Fair Work Commission within the 21-day window, identifying the dismissal and the outcome sought.</li>
<li><strong>Conciliation:</strong> the Commission typically arranges an informal, confidential conciliation conference, where most matters are resolved by agreement without a hearing.</li>
<li><strong>Hearing (if unresolved):</strong> if conciliation doesn't resolve the matter, it proceeds to a formal hearing before a Commission member, who hears evidence from both sides and issues a binding decision.</li>
<li><strong>Remedy:</strong> if the claim succeeds, the Commission can order reinstatement or, more commonly in practice, compensation — capped at the lower of 26 weeks' pay or half the high income threshold at the time of dismissal.</li>
</ol>

<h2>Frequently Asked Questions</h2>
<h3>How long do I have to file an unfair dismissal claim in Australia?</h3>
<p>21 calendar days from the date the dismissal takes effect. The Fair Work Commission will only extend this deadline in exceptional circumstances, so acting quickly matters more than having every detail of your case worked out first.</p>
<h3>What is the minimum employment period to be eligible?</h3>
<p>Generally 6 months of continuous service, extended to 12 months if your employer is a small business with fewer than 15 employees.</p>
<h3>Is there an income limit on who can claim unfair dismissal?</h3>
<p>Yes, unless you're covered by a modern award or enterprise agreement. The high income threshold is $190,100 for dismissals on or after 1 July 2026, and this figure is indexed annually — confirm the current amount for your specific dismissal date.</p>

<h2>Sources &amp; Further Reading</h2>
<ul>
<li>Fair Work Act 2009 (Cth), particularly ss. 382, 385, 392, and 394 — eligibility, the meaning of unfair dismissal, remedies, and the application deadline</li>
<li>Fair Work Commission (fwc.gov.au) — official unfair dismissal guidance and current high income threshold figures</li>
<li>Fair Work Ombudsman (fairwork.gov.au) — general employee-facing guidance on ending employment</li>
</ul>

<h2>Practical Next Steps</h2>
<p>If you've just been dismissed and think it may have been unfair, calculate your 21-day deadline first — it runs from the date the dismissal took effect, not from your last physical day at work in every case, so confirm the exact trigger date. From there, check your length of service against the minimum employment period and your earnings against the current high income threshold before assessing the substance of your case. For the general, worldwide picture of what makes a dismissal unlawful, see <a href="/employment-law/when-is-a-dismissal-wrongful-termination">When Is a Dismissal Considered Wrongful Termination?</a></p>

<p><em>This article is general legal information, not legal advice. Figures such as the high income threshold are indexed annually — confirm the current amount with the Fair Work Commission, and consult an Australian employment lawyer for advice on your specific situation.</em></p>`,
  },
];
