import type { LawArticle } from '../law-content';

export const employmentLaborArticles: LawArticle[] = [
  {
    id: 'el-001',
    title: 'What Belongs in an Employment Contract?',
    slug: 'what-belongs-in-an-employment-contract',
    alphabet: 'W',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_contracts',
    category: {
      id: 'cat_employment_labor',
      name: 'Employment & Labor',
      slug: 'employment-law',
    },
    subcategory: {
      id: 'sub_el_contracts',
      name: 'Employment Contracts',
      slug: 'employment-contracts',
    },
    summary:
      'An employment contract sets out pay, duties, hours, and notice — and getting the key terms in writing protects both the worker and the employer.',
    author: 'Priya Nair',
    updatedAt: 'March 12, 2026',
    readingTime: 9,
    views: 6420,
    featured: true,
    imageSeed: 'employment-contract-essentials',
    content: `<p>An employment contract is the legal backbone of the working relationship. It records what each side has promised: what the employer will pay and provide, and what work the employee will perform in return. Even where a job starts on a handshake, a contract still exists in the eyes of the law — the only question is whether its terms are written down clearly or left to be argued about later. Putting the important terms in writing reduces disputes, sets expectations, and gives both parties something to rely on if things go wrong.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>A contract exists once work and pay are agreed, whether or not anything is signed.</li><li>Core terms cover pay, job duties, hours, leave, notice, and confidentiality.</li><li>Many countries require written particulars of employment within a set time after the start date.</li><li>A contract cannot lawfully strip away statutory minimum rights such as minimum wage or paid leave.</li><li>Read restrictive clauses carefully before signing — some limit what you can do after you leave.</li></ul></div>

<h2>Why a Written Contract Matters</h2>
<p>Verbal agreements are valid but hard to prove. A written contract creates a shared reference point, so that months later neither side has to rely on memory about what was promised. In many jurisdictions the law actively encourages or requires this. In the United Kingdom, for example, employers must give a written statement of main terms on or before the first day of work. Across the European Union, transparency rules require key conditions to be provided in writing early in the relationship. India's various labour codes and standing orders similarly push employers toward documented terms.</p>

<h2>Core Terms to Expect</h2>
<p>While formats vary, most well-drafted contracts address a common set of subjects. If any of these are missing or vague, it is worth asking before you sign.</p>

<h3>Pay and Benefits</h3>
<ul><li>Salary or wage rate, and how often it is paid</li><li>Overtime treatment, bonuses, and commission rules</li><li>Pension, insurance, and other benefits</li></ul>

<h3>Work Itself</h3>
<ul><li>Job title and a description of duties</li><li>Place of work and any remote or travel expectations</li><li>Working hours and arrangements for rest breaks</li></ul>

<h3>Time Off and Ending the Job</h3>
<ul><li>Holiday entitlement and how it is calculated</li><li>Sick pay and parental leave</li><li>Notice periods for resignation and dismissal</li></ul>

<h2>Statutory Floors You Cannot Sign Away</h2>
<p>A contract sits on top of the law, not instead of it. Most countries set minimum standards — a minimum wage, maximum working hours, paid holiday, and basic protection from unfair dismissal — that apply regardless of what a contract says. A clause that promises less than the legal minimum is generally unenforceable to that extent. So if a contract states a wage below the statutory minimum, the worker is still entitled to the legal floor. Knowing this prevents employees from being talked out of rights they cannot actually waive.</p>

<h2>Clauses That Deserve a Second Look</h2>
<p>Some terms quietly carry long-term consequences. Restrictive covenants, such as non-compete and non-solicitation clauses, can limit where you work or whom you contact after leaving. Courts in many jurisdictions only enforce these where they are reasonable in scope, geography, and duration; overly broad restraints are often struck down. Confidentiality clauses, intellectual-property assignment, and probationary terms also deserve careful reading, because they shape your obligations both during and after employment.</p>

<h2>How the Rules Differ by Country</h2>
<p>Jurisdiction shapes how much a contract can actually control the relationship. In most of the United States, employment is "at will," meaning either side can usually end it at any time for almost any lawful reason, so written contracts are less universal for ordinary staff. By contrast, the United Kingdom, the European Union, and India impose stronger statutory protections — required notice, paid leave, and limits on dismissal — that apply even when the contract is silent. The same clause can therefore mean very different things depending on where you work.</p>

<h2>What Happens When a Contract Is Silent</h2>
<p>No contract covers every situation, and gaps are filled by "implied terms" — obligations courts read into the relationship even though nobody wrote them down. Common implied terms include a duty of mutual trust and confidence, an obligation on the employer to provide a safe workplace, and a duty on the employee to serve faithfully and follow reasonable instructions. Custom and practice — how things have actually been done at the company over time — can also fill gaps, for example an unwritten but consistently honored bonus scheme. Because implied terms are less certain than an express clause, the safer approach for both sides is to write down anything genuinely important rather than relying on what a court might later infer.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Can my employer change my contract terms without my agreement?</strong> Generally no — most jurisdictions treat unilateral changes to core terms (pay, hours, duties) as a breach, though minor administrative updates or changes reserved by an express flexibility clause may be permitted.</p>
<p><strong>Is a probationary period a separate contract?</strong> No — it is a clause within the same contract that typically allows shorter notice or a simpler dismissal process during an initial period, but core statutory protections (like anti-discrimination law) still apply from day one in most systems.</p>
<p><strong>What if I never received a written contract at all?</strong> The employment relationship and its core statutory rights still exist regardless — you can typically still request a written statement of terms, and many jurisdictions penalize employers who fail to provide one within the required timeframe.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>UK Employment Rights Act 1996, written statement of particulars</li>
<li>EU Directive 2019/1152 on transparent and predictable working conditions</li>
<li>India, Code on Wages 2019 and Industrial Relations Code 2020</li>
<li>U.S. Department of Labor, employment law guidance by state</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Before signing, read the whole document, ask for clarification on anything vague, and keep a copy for your records. Pay particular attention to pay, notice, and any clause that restricts you after you leave. If the contract involves significant restrictions, equity, or unusual terms — or if it appears to undercut your statutory rights — have it reviewed by a qualified employment lawyer in your country before you commit.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
    primarySources: [
      { label: 'Employment Rights Act 1996, Part I (UK) — written statement of particulars', url: 'https://www.legislation.gov.uk/ukpga/1996/18/contents' },
      { label: 'Directive (EU) 2019/1152 on transparent and predictable working conditions', url: 'https://eur-lex.europa.eu/eli/dir/2019/1152/oj/eng' },
      { label: 'India, Code on Wages 2019 and Industrial Relations Code 2020' },
      { label: 'U.S. Department of Labor, Employment Law Guide', url: 'https://webapps.dol.gov/elaws/elg/' },
    ],
  },
  {
    id: 'el-002',
    title: 'When Is a Dismissal Considered Wrongful Termination?',
    slug: 'when-is-a-dismissal-wrongful-termination',
    alphabet: 'W',
    categoryId: 'cat_employment_labor',
    subcategoryId: 'sub_el_termination',
    category: {
      id: 'cat_employment_labor',
      name: 'Employment & Labor',
      slug: 'employment-law',
    },
    subcategory: {
      id: 'sub_el_termination',
      name: 'Wrongful Termination',
      slug: 'wrongful-termination',
    },
    summary:
      'Wrongful termination happens when a dismissal breaks the law or the contract — for example firing someone for a discriminatory or retaliatory reason.',
    author: 'Daniel Okoro',
    updatedAt: 'April 28, 2026',
    readingTime: 8,
    views: 5170,
    featured: false,
    imageSeed: 'wrongful-termination-explained',
    content: `<p>Losing a job is rarely pleasant, but not every dismissal is unlawful. Wrongful termination is a specific legal idea: it describes a firing that breaks the law, breaches the employment contract, or violates a protected right. Understanding the difference between a hard-but-lawful dismissal and a genuinely wrongful one helps employees know when they have a real claim — and helps employers avoid costly mistakes. The line depends heavily on where you work, because countries take very different approaches to how easily a job can be ended.</p>

<div class="key-takeaways"><h4>Key Takeaways</h4><ul><li>Wrongful termination means a dismissal that is illegal, not merely unfair-feeling.</li><li>Firing for a discriminatory or retaliatory reason is unlawful almost everywhere.</li><li>"At-will" systems allow most dismissals, but exceptions still protect workers.</li><li>Many countries require a valid reason and fair process before dismissal.</li><li>Strong documentation and prompt action are critical if you intend to challenge a firing.</li></ul></div>

<h2>What Makes a Termination "Wrongful"</h2>
<p>A dismissal becomes wrongful when the reason or the method crosses a legal line. The clearest examples are firings based on a protected characteristic — such as race, sex, religion, age, disability, or pregnancy — and firings that punish an employee for exercising a legal right. Dismissing someone for reporting safety violations, filing a harassment complaint, or taking legally protected leave is generally unlawful. So is breaching the contract itself, for instance by ignoring an agreed notice period or dismissal procedure.</p>

<h2>Common Categories of Unlawful Dismissal</h2>
<p>Although the labels differ between legal systems, wrongful terminations tend to fall into recognizable groups.</p>

<h3>Discrimination</h3>
<ul><li>Firing connected to a protected characteristic</li><li>Selecting someone for redundancy on a discriminatory basis</li></ul>

<h3>Retaliation and Public Policy</h3>
<ul><li>Punishing whistleblowing or complaints about illegal conduct</li><li>Dismissing someone for refusing to break the law</li><li>Penalizing the use of protected leave or union activity</li></ul>

<h2>The "At-Will" Difference</h2>
<p>The biggest variation worldwide is between at-will and protected systems. In most of the United States, employment is at will: an employer can dismiss a worker at any time for almost any reason, or no reason, as long as it is not an illegal one. Even there, important exceptions apply — anti-discrimination law, retaliation rules, and public-policy protections still hold. By contrast, the United Kingdom, the European Union, and India generally require employers to show a fair reason and follow a proper process. In these systems, a dismissal can be "unfair" even when no discrimination is involved, simply because the employer lacked good grounds or skipped required steps.</p>

<h2>Notice, Process, and Fair Reasons</h2>
<p>Outside at-will systems, how a dismissal is carried out matters as much as why. Employers are often expected to give contractual or statutory notice, conduct investigations, hold meetings, and allow the employee to respond before deciding. Skipping these steps can render an otherwise justifiable dismissal unfair. Redundancy and restructuring usually carry their own rules about consultation and selection criteria. An employer who has a legitimate reason but handles the process badly may still face a successful claim.</p>

<h2>What to Do If You Believe You Were Wrongfully Fired</h2>
<p>If a dismissal feels unlawful, acting quickly and methodically matters, because legal deadlines for claims can be short.</p>
<ul><li>Write down what happened, including dates, names, and what was said</li><li>Gather contracts, emails, performance reviews, and any warning letters</li><li>Note any comments suggesting a discriminatory or retaliatory motive</li><li>Check the time limit for filing a complaint in your jurisdiction</li></ul>

<h2>Settlement Agreements and Severance</h2>
<p>Many wrongful-termination disputes end not in a tribunal but in a negotiated settlement, often called a severance or settlement agreement. In exchange for a payment (and sometimes a reference letter), the employee typically waives the right to bring further claims related to the employment. Because signing away a legal claim is a serious step, many jurisdictions require the employee to receive independent legal advice — sometimes paid for by the employer — before such a waiver is valid. It is worth resisting pressure to sign quickly: a rushed settlement offered "today only" is a common tactic, and a properly advised employee is often able to negotiate meaningfully better terms than the first offer.</p>

<h2>Frequently Asked Questions</h2>
<p><strong>Can I be fired for poor performance without any warning?</strong> In at-will jurisdictions, often yes; in jurisdictions requiring fair process, usually no — most such systems expect documented performance concerns, a chance to improve, and a fair procedure before dismissal on performance grounds.</p>
<p><strong>Does resigning instead of being fired affect my rights?</strong> It can — a genuine resignation is generally not treated as a dismissal, though "constructive dismissal" claims exist in many systems where an employer's conduct was so bad that resignation was effectively forced, which courts treat as equivalent to firing.</p>
<p><strong>Is severance pay required by law?</strong> It depends entirely on the jurisdiction and circumstances — some countries mandate statutory severance for redundancy or unfair dismissal, while others leave it purely to contract or employer discretion.</p>
<p><strong>Does an employer have to give a reason at the moment of dismissal?</strong> Requirements vary — some jurisdictions require the reason to be stated in writing at the time, while others allow it to emerge later during a tribunal claim, though a reason that shifts or contradicts itself over time is often treated as suspicious evidence of an unlawful underlying motive.</p>

<h2>Sources & Further Reading</h2>
<ul>
<li>U.S. Equal Employment Opportunity Commission, retaliation and discrimination guidance</li>
<li>UK Employment Rights Act 1996, unfair dismissal provisions and ACAS Code of Practice</li>
<li>India, Industrial Disputes Act 1947 (now consolidated under the Industrial Relations Code 2020)</li>
<li>International Labour Organization, Termination of Employment Convention (No. 158)</li>
</ul>

<h2>Practical Next Steps</h2>
<p>Start by preserving evidence and reviewing your contract and any company policy on dismissal. Many countries offer a government body, tribunal, or labour authority where complaints can be lodged, often with strict deadlines. Because the rules and time limits vary so widely, speak to a qualified employment lawyer in your jurisdiction early — ideally before you sign any settlement or release — so you understand your options while a claim is still possible.</p>

<p><em>This article is general legal information, not legal advice. Laws differ by country and change over time — consult a qualified lawyer licensed in your jurisdiction before acting.</em></p>`,
    primarySources: [
      { label: 'EEOC, Enforcement Guidance on Retaliation and Related Issues', url: 'https://www.eeoc.gov/laws/guidance/enforcement-guidance-retaliation-and-related-issues' },
      { label: 'Employment Rights Act 1996, Part X (UK) — unfair dismissal', url: 'https://www.legislation.gov.uk/ukpga/1996/18/contents' },
      { label: 'Acas Code of Practice on disciplinary and grievance procedures', url: 'https://www.acas.org.uk/acas-code-of-practice-on-disciplinary-and-grievance-procedures' },
      { label: 'India, Industrial Disputes Act 1947' },
      { label: 'ILO, Termination of Employment Convention, 1982 (No. 158)', url: 'https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB:12100:0::NO:::P12100_ILO_CODE:C158' },
    ],
  },
];
