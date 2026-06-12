'use strict';
/**
 * Upgrades the Law Elite Network encyclopedia articles to full-length (~1,200–1,500
 * word) SEO / indexing content, managed in the admin-platform CMS console and
 * served to the public A–Z at law-elite-network /legal/<letter> + /article/<slug>.
 *
 * UPSERT by slug: if the article already exists (the earlier stubs) it is PATCHed
 * to the long-form body; otherwise it is created. Everything is then published.
 *
 *   CMS_URL=http://localhost:3011/api/v1 node scripts/seedLawArticlesLongform.cjs
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';
const WEBSITE_ID = process.env.LAW_WEBSITE_ID || '99560d59-8370-4d7f-b451-d4a7edab85a8';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

// ── block builders ───────────────────────────────────────────────────────────
const A = (...blocks) => blocks.map((b, i) => ({ ...b, id: `blk-${i}`, order: i }));
const h = (text, level = 2) => ({ type: 'heading', content: { text, level } });
const p = (text) => ({ type: 'paragraph', content: { text } });
const ul = (items) => ({ type: 'html', content: { html: `<ul>${items.map((li) => `<li>${li}</li>`).join('')}</ul>` } });
const html = (h) => ({ type: 'html', content: { html: h } });
const DISCLAIMER = html('<p><em>This article is general legal information, not legal advice. Laws vary by jurisdiction and change over time. Consult a qualified practitioner about your specific situation.</em></p>');

const KEY = (items) => html(
  `<div class="key-takeaways"><h4>Key Takeaways</h4><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`
);

// ── articles (full-length) ───────────────────────────────────────────────────
const ARTICLES = [
  {
    slug: 'drafting-enforceable-commercial-contracts',
    cat: 'corporate-law-contracts',
    title: 'Drafting Enforceable Commercial Contracts: A Complete Guide',
    excerpt: 'A practical, end-to-end guide to the clauses, structure, and review process that make a commercial contract enforceable and dispute-resistant.',
    cf: { kind: 'article', readingTime: '8 min read', featured: true, alphabet: 'D', tags: ['contracts', 'corporate', 'drafting', 'commercial-law'] },
    seo: { title: 'Drafting Enforceable Commercial Contracts: A Complete Guide | Law Elite', description: 'Learn the essential clauses, structure, and review steps that make a commercial contract enforceable and ready to survive a dispute.', keywords: ['commercial contract', 'contract drafting', 'enforceable contract', 'business agreement', 'contract clauses'] },
    blocks: A(
      p('A commercial contract is more than a record of a deal — it is the operating manual for a business relationship and the script the parties will follow if that relationship breaks down. A well-drafted agreement allocates risk clearly, defines what each side must do, and sets out exactly what happens when something goes wrong. A poorly drafted one invites disputes, erodes margins, and can be unenforceable precisely when you need it most. This guide walks through the anatomy of an enforceable commercial contract and the drafting discipline that keeps it strong.'),
      KEY([
        'Enforceability rests on offer, acceptance, consideration, certainty of terms, and intention to create legal relations.',
        'The most litigated clauses are scope, payment, termination, limitation of liability, and dispute resolution.',
        'Plain, specific drafting beats dense boilerplate — ambiguity is construed against the drafter.',
        'A short pre-signature review checklist prevents most expensive contract disputes.',
      ]),
      h('What Makes a Contract Legally Enforceable'),
      p('Before worrying about individual clauses, a contract has to clear the basic threshold of formation. Courts generally look for five things: a clear offer, an unqualified acceptance of that offer, consideration (something of value exchanged by each side), certainty of terms, and an intention by both parties to be legally bound. Commercial agreements between businesses almost always satisfy the intention requirement, but the other elements are where drafting matters. If essential terms — price, quantity, duration, deliverables — are vague or left "to be agreed later," a court may find there was never a binding contract at all.'),
      p('Capacity and legality round out the picture. Each signatory must have authority to bind their organisation, and the contract\'s purpose must be lawful. A surprising number of disputes turn on whether the person who signed actually had authority to do so, which is why well-run businesses keep a clear signing matrix and ask for evidence of authority on significant deals.'),
      h('The Core Clauses Every Commercial Contract Needs'),
      p('Most commercial contracts share a common skeleton. Understanding what each part is for helps you spot what is missing and what is doing real work versus what is filler.'),
      h('Scope and Deliverables', 3),
      p('This is the heart of the agreement: what exactly is being supplied, to what standard, and by when. Vague scope is the single biggest source of commercial disputes. Wherever possible, define deliverables with measurable acceptance criteria, attach detailed specifications as a schedule, and state expressly what is out of scope. A clause that says "the supplier will provide consulting services" is an argument waiting to happen; one that lists named deliverables, milestones, and acceptance tests is not.'),
      h('Payment and Consideration', 3),
      p('Spell out the amount, currency, timing, invoicing mechanics, and what triggers payment. Address late payment with interest and suspension rights, and clarify whether prices are inclusive or exclusive of tax. If payment depends on milestones or acceptance, tie the two clauses together explicitly so there is no gap between "work delivered" and "payment due."'),
      h('Term, Renewal, and Termination', 3),
      p('State when the contract starts, how long it runs, and how it renews. Termination provisions should distinguish termination for convenience (with notice) from termination for cause (material breach, insolvency, change of control). Define what counts as a material breach and give a cure period where appropriate. Just as important, set out the consequences of termination: final payments, return of property, survival of confidentiality, and transition assistance.'),
      h('Limitation of Liability and Indemnities', 3),
      p('These clauses decide who carries the financial risk when things go wrong, and they are heavily negotiated for good reason. A limitation clause typically caps total liability (often by reference to fees paid) and excludes certain categories of loss such as indirect or consequential damages. Indemnities shift responsibility for specific risks — third-party IP claims, data breaches, personal injury — to the party best able to control them. Courts scrutinise these clauses closely, so they must be clear, reasonable, and not attempt to exclude liability the law does not allow to be excluded.'),
      h('The Clauses People Forget — Until They Need Them'),
      p('Beyond the headline terms, a set of "boilerplate" clauses quietly determines how the contract behaves under stress. They are not filler:'),
      ul([
        '<strong>Governing law and jurisdiction</strong> — which country\'s law applies and which courts hear disputes. Essential in any cross-border deal.',
        '<strong>Dispute resolution</strong> — whether disputes go to litigation, arbitration, or a tiered process of negotiation then mediation then arbitration.',
        '<strong>Force majeure</strong> — what happens when events outside either party\'s control prevent performance.',
        '<strong>Confidentiality</strong> — protecting sensitive information shared during the relationship, surviving termination.',
        '<strong>Assignment and subcontracting</strong> — whether either party can transfer its rights or delegate its obligations.',
        '<strong>Entire agreement and variation</strong> — confirming the written contract is the whole deal and can only be changed in writing.',
        '<strong>Notices</strong> — how formal communications must be delivered to be valid.',
      ]),
      h('Drafting Style: Clarity Is Enforceability'),
      p('The way a contract is written affects whether it holds up. Use short sentences and defined terms consistently. Where a word has a specific meaning, define it once and capitalise it throughout. Avoid stacking synonyms ("null, void and of no effect") that add nothing but ambiguity. Number clauses logically and keep related provisions together. Remember the contra proferentem principle: where a clause is genuinely ambiguous, courts often construe it against the party that drafted it. Precision is not pedantry — it is risk management.'),
      p('Schedules and annexes are your friend. Keep the main body focused on legal mechanics and push detailed specifications, pricing tables, and service levels into clearly referenced schedules. This keeps the contract readable and makes future amendments cleaner.'),
      h('A Pre-Signature Review Checklist'),
      p('Before any commercial contract is signed, run it through a short, disciplined review. Most expensive disputes trace back to a step skipped here:'),
      ul([
        'Are the parties correctly named, with the right legal entities and signing authority confirmed?',
        'Is the scope specific, measurable, and matched to the commercial deal that was actually agreed?',
        'Do payment triggers align with delivery and acceptance, with late-payment remedies?',
        'Are termination rights, notice periods, and post-termination obligations clear and balanced?',
        'Is the liability cap commercially sensible, and are the indemnities reciprocal where appropriate?',
        'Do the governing law, jurisdiction, and dispute-resolution clauses fit where the parties actually operate?',
        'Have all referenced schedules and annexes been attached and checked?',
      ]),
      h('Frequently Asked Questions'),
      h('Does a contract have to be in writing to be enforceable?', 3),
      p('Many oral contracts are enforceable, but certain categories — such as those involving land or guarantees — usually must be in writing. Even where an oral contract is valid, proving its terms is difficult. For any commercial relationship of substance, a written agreement is strongly preferable because it records exactly what was agreed.'),
      h('What is the difference between a warranty and an indemnity?', 3),
      p('A warranty is a contractual promise that a fact is true; if it is breached, the innocent party claims damages and must prove its loss. An indemnity is a promise to reimburse a defined loss directly, often without the usual rules on proving and limiting damages, which is why indemnities are negotiated carefully.'),
      h('Can we just use a template we found online?', 3),
      p('Templates can be a useful starting point, but they are written for a generic situation and a particular jurisdiction. Using one unaltered risks missing terms specific to your deal, including clauses that do not apply, or relying on language that is unenforceable where you operate. Treat templates as a checklist, not a finished contract.'),
      h('Conclusion'),
      p('An enforceable commercial contract is built, not copied. It starts from the commercial reality of the deal, expresses each party\'s obligations with precision, allocates risk deliberately, and plans for the relationship ending as carefully as it plans for it succeeding. Invest in clear scope, sensible liability terms, and a workable dispute-resolution path, and the contract becomes what it should be: a tool that prevents disputes far more often than it resolves them.'),
      DISCLAIMER,
    ),
  },
  {
    slug: 'understanding-dui-defense-strategies',
    cat: 'criminal-law-dui-defense',
    title: 'Understanding DUI Defense Strategies: Your Rights and Legal Options',
    excerpt: 'How experienced defence counsel analyse a DUI charge — from the legality of the stop to testing procedure — and the rights every driver should understand.',
    cf: { kind: 'article', readingTime: '8 min read', featured: true, alphabet: 'U', tags: ['criminal', 'dui', 'defense', 'driving'] },
    seo: { title: 'Understanding DUI Defense Strategies: Your Rights and Options | Law Elite', description: 'A clear guide to how DUI cases are defended — the traffic stop, field sobriety and chemical tests, your rights, and the strategies counsel use.', keywords: ['DUI defense', 'DUI lawyer', 'drunk driving charge', 'field sobriety test', 'criminal defense'] },
    blocks: A(
      p('A charge of driving under the influence (DUI) can feel like a foregone conclusion, but it is not. A DUI case is built from a chain of events — the stop, the observations, the field tests, the chemical analysis — and each link can be examined, challenged, and sometimes broken. Understanding how that chain is constructed, and where it commonly weakens, is the foundation of an effective defence. This guide explains the anatomy of a DUI case and the strategies counsel use to protect a driver\'s rights.'),
      KEY([
        'Every DUI case begins with a stop that must be legally justified — an unlawful stop can taint everything that follows.',
        'Field sobriety and breath/blood tests are procedures with strict requirements that are frequently not met.',
        'You generally have the right to remain silent and the right to counsel; how you use them matters.',
        'Early legal advice changes outcomes — evidence and deadlines are time-sensitive.',
      ]),
      h('The Traffic Stop: Where Every DUI Case Begins'),
      p('Police need a lawful basis to pull a vehicle over — typically a reasonable suspicion that a traffic offence or other violation has occurred. If the stop itself was not justified, the evidence gathered afterwards may be challenged as the fruit of an unlawful detention. Defence counsel will scrutinise the officer\'s stated reason for the stop, dashcam and bodycam footage, and the timeline of events. A stop based on a vague hunch, or one whose stated justification is contradicted by video, is a serious vulnerability in the prosecution\'s case.'),
      p('What happens immediately after the stop matters too. Officers make observations — speech, balance, odour, eyes — that become the narrative of impairment. But these observations are subjective and can have innocent explanations: fatigue, medical conditions, allergies, nervousness, or the simple awkwardness of being stopped by police. Counsel work to separate genuine indicators of impairment from ordinary human behaviour recast as evidence.'),
      h('Field Sobriety Tests Are Not Infallible'),
      p('Standardised field sobriety tests — the horizontal gaze nystagmus test, the walk-and-turn, and the one-leg stand — are designed to be administered under specific conditions and scored against defined criteria. In practice, they are often conducted on uneven roadsides, in poor weather, in inappropriate footwear, and on people with medical or physical conditions that affect balance. Even a perfectly sober person can struggle. Where the test was administered incorrectly or scored inconsistently with the official protocol, its evidential value can be significantly undermined.'),
      h('Breath and Blood Testing: Science With Strict Rules'),
      p('Chemical testing is often treated as the decisive evidence, but the result is only as reliable as the procedure behind it. Breath-testing devices must be properly calibrated and maintained, operated by a trained official, and used after a required observation period to rule out factors that can distort the reading. Blood samples must be collected, stored, and analysed under a documented chain of custody. Defence strategy frequently focuses on:'),
      ul([
        'Whether the testing device was calibrated and maintained according to its required schedule.',
        'Whether the operator was properly certified and followed the mandatory procedure.',
        'Whether the observation period was respected before a breath sample was taken.',
        'Whether the blood sample\'s chain of custody is complete and unbroken.',
        'Whether medical conditions, diet, or rising blood-alcohol curves could have affected the result.',
      ]),
      h('Your Rights During a DUI Investigation'),
      p('Knowing your rights — and exercising them calmly — is part of any defence. In most jurisdictions you have the right to remain silent beyond providing basic identifying information, and you cannot be compelled to incriminate yourself. You generally have the right to consult a lawyer. The rules around refusing a chemical test are nuanced: refusal often carries its own penalties, so this is precisely the kind of decision where prompt legal advice is valuable. The consistent theme is that polite cooperation with lawful requests, combined with a measured exercise of the right to silence, protects your position better than either hostility or over-explaining.'),
      h('Common DUI Defence Strategies'),
      p('There is no single template; the right strategy depends on the facts. Counsel typically evaluate several lines at once:'),
      ul([
        '<strong>Challenging the stop</strong> — arguing there was no lawful basis to detain the driver.',
        '<strong>Challenging the observations</strong> — offering innocent explanations for the alleged signs of impairment.',
        '<strong>Challenging the testing</strong> — attacking calibration, procedure, timing, or chain of custody.',
        '<strong>Rising blood-alcohol defence</strong> — arguing the driver was below the limit while driving even if above it at the later test.',
        '<strong>Medical and dietary factors</strong> — conditions that can affect breath readings or mimic impairment.',
        '<strong>Procedural and rights violations</strong> — failures that may render evidence inadmissible.',
      ]),
      h('Why Early Legal Advice Matters'),
      p('DUI cases move quickly and much of the most useful evidence is perishable. Dashcam and bodycam footage may be overwritten, witnesses\' memories fade, and there are often short deadlines for challenging licence suspensions that run separately from the criminal case. Engaging counsel early preserves evidence, protects procedural rights, and opens options — from negotiating reduced charges to preparing for trial — that narrow as time passes.'),
      h('Frequently Asked Questions'),
      h('Should I refuse a breath test?', 3),
      p('This depends heavily on local law. In many places refusal triggers automatic licence penalties regardless of the underlying case, while in others it limits the evidence available to the prosecution. Because the trade-offs are jurisdiction-specific and consequential, this is a decision best informed by prompt legal advice rather than a general rule.'),
      h('Can a DUI charge be reduced or dismissed?', 3),
      p('Yes. Depending on the evidence, charges may be reduced to a lesser offence or dismissed entirely — for example where the stop was unlawful, the testing was flawed, or rights were violated. Outcomes vary widely with the facts and the jurisdiction.'),
      h('Do I really need a lawyer for a first offence?', 3),
      p('Even a first DUI can carry licence loss, fines, insurance consequences, and a criminal record. Counsel can identify defences a non-lawyer would miss and manage the parallel licence proceedings. Given what is at stake, professional advice is generally worthwhile.'),
      h('Conclusion'),
      p('A DUI charge is the beginning of a process, not the end of the story. Because the case is assembled from a sequence of procedures — each governed by rules that are frequently imperfectly followed — there is real room for scrutiny and defence. Understanding your rights, acting quickly to preserve evidence, and getting experienced counsel involved early are the steps that most reliably protect your position.'),
      DISCLAIMER,
    ),
  },
  {
    slug: 'child-custody-standards-courts-apply',
    cat: 'family-law-child-custody',
    title: 'Child Custody Laws: How Courts Decide and How to Prepare',
    excerpt: 'A plain-language guide to how courts decide custody under the best-interests standard, the types of custody, and how parents can prepare.',
    cf: { kind: 'article', readingTime: '8 min read', featured: true, alphabet: 'C', tags: ['family', 'custody', 'divorce', 'parenting'] },
    seo: { title: 'Child Custody Laws: How Courts Decide and How to Prepare | Law Elite', description: 'Understand the best-interests standard, legal vs physical custody, the factors courts weigh, and practical steps to prepare for a custody matter.', keywords: ['child custody', 'best interests of the child', 'custody lawyer', 'parenting plan', 'family law'] },
    blocks: A(
      p('Few legal matters are as emotionally charged as a dispute over the care of a child. Custody law tries to answer a deceptively simple question — what arrangement is best for this child? — through a framework that balances the rights of both parents against the welfare of the child, who always comes first. Understanding how courts actually decide, what the different forms of custody mean, and how to prepare can replace fear of the unknown with a clear plan.'),
      KEY([
        'The guiding principle in almost every custody decision is the best interests of the child.',
        'Custody has two dimensions: legal custody (decision-making) and physical custody (where the child lives).',
        'Courts weigh stability, each parent\'s capacity, the child\'s relationships, and sometimes the child\'s wishes.',
        'A workable, child-focused parenting plan is the single most persuasive thing a parent can bring.',
      ]),
      h('The Best-Interests Standard'),
      p('Across most jurisdictions, the legal touchstone for any custody decision is the best interests of the child. This is not a single rule but a framework that directs the court to focus on the child\'s welfare, stability, and development rather than on rewarding or punishing the parents. It deliberately gives judges discretion, because no two families are alike. What it does not do is start from a presumption that one parent is automatically more suitable than the other; modern courts evaluate each parent on the merits.'),
      h('Legal Custody vs Physical Custody'),
      p('Two different concepts often get blurred together. Distinguishing them is essential to understanding any custody arrangement.'),
      h('Legal Custody', 3),
      p('Legal custody is the authority to make significant decisions about the child\'s life — education, healthcare, religion, and general welfare. It is frequently shared between both parents (joint legal custody) even when the child lives primarily with one of them, because courts generally favour keeping both parents involved in major decisions unless there is a reason not to.'),
      h('Physical Custody', 3),
      p('Physical custody concerns where the child actually lives and who provides day-to-day care. It can be primarily with one parent, with the other having scheduled time, or shared more evenly between the two homes. Many arrangements combine joint legal custody with a physical schedule weighted toward one parent, reflecting the practical realities of work, school, and distance.'),
      h('The Factors Courts Actually Weigh'),
      p('Although the precise list varies, courts tend to consider a consistent set of factors when applying the best-interests standard:'),
      ul([
        '<strong>Stability and continuity</strong> — the child\'s existing home, school, and community ties.',
        '<strong>Each parent\'s capacity</strong> — ability to provide care, guidance, and a safe environment.',
        '<strong>The child\'s relationships</strong> — bonds with each parent, siblings, and extended family.',
        '<strong>Each parent\'s willingness to support the other\'s relationship</strong> with the child.',
        '<strong>The child\'s wishes</strong> — given weight that increases with the child\'s age and maturity.',
        '<strong>Any history of harm</strong> — domestic violence, neglect, or substance misuse.',
        '<strong>Practical logistics</strong> — work schedules, distance between homes, and the child\'s routine.',
      ]),
      p('Notably, a parent\'s willingness to foster the child\'s relationship with the other parent is increasingly influential. Courts look unfavourably on attempts to undermine or obstruct the other parent without good reason, because preserving both relationships is usually seen as serving the child\'s interests.'),
      h('Parenting Plans: The Heart of a Modern Custody Case'),
      p('Rather than leaving everything to a judge, most well-prepared parents propose a parenting plan — a written arrangement covering the living schedule, holidays, decision-making, communication, and how future disagreements will be resolved. A clear, realistic, child-centred plan does two things: it demonstrates that the parent is focused on the child rather than on winning, and it gives the court a ready-made framework to adopt or adapt. Plans that account for the child\'s routine, schooling, and relationships — rather than simply maximising one parent\'s time — tend to carry the most weight.'),
      h('How to Prepare for a Custody Matter'),
      p('Preparation is less about adversarial tactics and more about demonstrating stable, attentive parenting. Practical steps include:'),
      ul([
        'Keeping a calm, factual record of involvement in the child\'s daily life, schooling, and healthcare.',
        'Maintaining a stable home environment and routine for the child.',
        'Communicating respectfully with the other parent and documenting that you support the child\'s relationship with them.',
        'Proposing a realistic parenting plan rather than an all-or-nothing demand.',
        'Avoiding disparaging the other parent to or in front of the child.',
      ]),
      h('Mediation and Avoiding a Custody Battle'),
      p('Contested court hearings are not the only route, and often not the best one. Many jurisdictions encourage — or require — parents to attempt mediation before a judge decides. In mediation, a neutral professional helps the parents negotiate a parenting arrangement themselves, which tends to be faster, less expensive, and far less damaging to the family than an adversarial trial. Agreements reached this way are usually more durable precisely because both parents helped shape them rather than having an outcome imposed. Even where mediation does not resolve everything, it can narrow the issues the court must decide.'),
      p('Keeping the conflict away from the child is itself part of a strong case. Courts notice when one parent shields the child from disputes and supports the other relationship, and they notice the opposite. Approaching the process as a problem to be solved for the child — rather than a contest to be won against the other parent — serves both the child\'s welfare and, usually, the parent\'s own position.'),
      h('Frequently Asked Questions'),
      h('Does the mother automatically get custody?', 3),
      p('No. Modern courts do not start from a presumption favouring either parent. The decision turns on the best interests of the child, evaluated on the facts of each case, with both parents assessed on their merits.'),
      h('At what age can a child choose which parent to live with?', 3),
      p('There is rarely a fixed age at which a child simply chooses. Courts give the child\'s preference increasing weight as the child matures, but it is one factor among many, not a decision handed to the child.'),
      h('Can a custody order be changed later?', 3),
      p('Yes. Custody orders can usually be modified when there is a significant change in circumstances — a relocation, a change in a parent\'s situation, or a shift in the child\'s needs — provided the change serves the child\'s best interests.'),
      h('Conclusion'),
      p('Custody decisions are guided by a single north star: what is best for the child. Parents who understand the distinction between legal and physical custody, focus on stability and the child\'s relationships, and come prepared with a thoughtful parenting plan put themselves — and more importantly their child — in the strongest position. When in doubt, experienced family-law counsel can translate these principles into a strategy tailored to your family.'),
      DISCLAIMER,
    ),
  },
  {
    slug: 'work-visas-choosing-the-right-category',
    cat: 'immigration-law-visas',
    title: 'Work Visas: Choosing the Right Category and Navigating the Process',
    excerpt: 'A practical overview of how work-visa categories differ, how to match a category to your situation, and how to navigate the application process.',
    cf: { kind: 'article', readingTime: '8 min read', featured: true, alphabet: 'W', tags: ['immigration', 'visas', 'work', 'sponsorship'] },
    seo: { title: 'Work Visas: Choosing the Right Category and the Process | Law Elite', description: 'Understand how work-visa categories differ, how to match one to your role and employer, and the steps and pitfalls of the application process.', keywords: ['work visa', 'work permit', 'visa sponsorship', 'immigration lawyer', 'employment visa'] },
    blocks: A(
      p('A work visa is the legal bridge between a job offer and the right to take that job in another country. Choosing the wrong category, or applying without understanding the requirements, can cost months of delay and significant expense. Because immigration rules are detailed, change frequently, and vary enormously between countries, this guide focuses on the durable principles: how categories differ, how to match one to your circumstances, and how the process typically unfolds.'),
      KEY([
        'Work-visa categories differ mainly by skill level, the role, the sponsoring employer, and intended duration.',
        'Most skilled work visas require employer sponsorship and proof the role meets defined criteria.',
        'Eligibility usually turns on qualifications, experience, salary thresholds, and the employer\'s status.',
        'Timing and documentation are critical — small errors cause large delays.',
      ]),
      h('Why the Right Category Matters'),
      p('Immigration systems do not offer a single "work visa." Instead they provide a menu of categories, each designed for a different situation — skilled employees sponsored by a company, intra-company transferees, investors and entrepreneurs, seasonal or temporary workers, and specialists in shortage occupations. Each category carries its own eligibility criteria, documentation, fees, processing times, and conditions once granted. Applying under the wrong category is one of the most common and costly mistakes, because a refusal not only wastes time and money but can complicate future applications.'),
      h('How Categories Typically Differ'),
      p('While the labels differ by country, work visas tend to vary along a few consistent dimensions:'),
      ul([
        '<strong>Skill level of the role</strong> — many systems reserve their main work routes for skilled occupations meeting a defined threshold.',
        '<strong>Employer sponsorship</strong> — most skilled routes require a licensed or registered employer to sponsor the worker.',
        '<strong>Duration and intent</strong> — temporary assignment, fixed-term employment, or a route that can lead to permanent residence.',
        '<strong>Special routes</strong> — intra-company transfers, shortage-occupation lists, talent or investor visas, and seasonal schemes.',
      ]),
      p('Matching your situation to the right route means looking at the role\'s skill level, whether the employer can and will sponsor, how long you intend to stay, and whether you eventually want a path to settlement. A role that pays above the relevant threshold, with a willing sponsoring employer, usually points to a mainstream skilled-worker route; an internal posting from an overseas office points to an intra-company route; founders and investors have their own categories entirely.'),
      h('Common Eligibility Requirements'),
      p('Although specifics vary, skilled work visas commonly require some combination of the following. Understanding them early helps you assemble evidence before applying:'),
      ul([
        'A genuine job offer from an eligible, often sponsor-licensed, employer.',
        'A role that meets a minimum skill level and, frequently, a minimum salary threshold.',
        'Relevant qualifications or professional experience, sometimes formally assessed or recognised.',
        'Evidence of language ability where the country requires it.',
        'Proof of identity, immigration history, and sometimes financial means and health or character checks.',
      ]),
      h('The Application Process, Step by Step'),
      p('While each country runs its own system, the journey usually follows a recognisable sequence:'),
      ul([
        '<strong>Confirm eligibility</strong> — match the role and your profile to a specific category before anything else.',
        '<strong>Secure sponsorship</strong> — the employer obtains or confirms its sponsor status and issues the required sponsorship document.',
        '<strong>Prepare documentation</strong> — gather qualifications, references, identity documents, and financial evidence.',
        '<strong>Submit the application</strong> — complete the official forms, pay fees, and provide biometrics where required.',
        '<strong>Respond to requests</strong> — answer any follow-up queries promptly and completely.',
        '<strong>Decision and conditions</strong> — on approval, understand the conditions, expiry, and any path to extension or settlement.',
      ]),
      h('Avoiding Common Pitfalls'),
      p('Most refusals and delays come from avoidable errors: applying under the wrong category, missing or inconsistent documents, salary or skill thresholds that are not quite met, or failing to respond to requests on time. Because immigration rules change frequently, relying on out-of-date guidance is itself a risk. The most reliable safeguards are to confirm current requirements before applying, keep documentation consistent and complete, and seek professional advice when the situation is complex — for example dual applications, prior refusals, or changing employers mid-process.'),
      h('Bringing Family Members'),
      p('Many work-visa routes allow the main applicant to bring a partner and children as dependants, but the conditions vary. Some systems require evidence of the relationship, proof that you can support dependants financially without relying on public funds, and separate applications and fees for each family member. Dependants\' rights once in the country also differ — in some routes a partner can work freely, in others their work is restricted. If relocating with family is part of your plan, factor the dependant requirements into your choice of category from the start rather than treating them as an afterthought.'),
      h('After You Arrive: Conditions and Compliance'),
      p('A work visa comes with conditions, and keeping to them protects your status and any future application. These commonly include working only in the sponsored role or for the sponsoring employer, maintaining valid status without overstaying, and notifying the authorities of material changes such as a new address or a change of employer. Many routes also require you to apply to extend your stay before the visa expires, and some count time spent lawfully toward eventual settlement. Treating compliance as an ongoing responsibility — not a one-time hurdle cleared at the border — is what keeps the door open to extensions and, where available, permanent residence.'),
      h('Frequently Asked Questions'),
      h('Can I change employers on a work visa?', 3),
      p('Often yes, but many sponsored visas tie you to a specific employer, so changing jobs may require a new sponsorship and sometimes a fresh application. Check the conditions attached to your visa before making any move.'),
      h('How long does a work visa take to process?', 3),
      p('Processing times vary widely by country, category, and time of year, ranging from a few weeks to several months. Premium or priority services exist in some systems for an extra fee. Build a realistic buffer into your start date.'),
      h('Does a work visa lead to permanent residence?', 3),
      p('Some categories offer a path to settlement after a qualifying period; others are strictly temporary. If long-term residence is your goal, choose a route designed to support it rather than assuming any work visa will convert.'),
      h('Conclusion'),
      p('The key to a smooth work-visa application is choosing the correct category from the outset and meeting its requirements precisely. Because the rules are detailed and shift over time, success comes from current information, careful documentation, and — where the situation is anything but straightforward — advice from an immigration professional who can map your circumstances to the right route.'),
      DISCLAIMER,
    ),
  },
  {
    slug: 'trademarks-building-a-defensible-brand',
    cat: 'intellectual-property-trademarks',
    title: 'Trademarks: Building and Protecting a Defensible Brand',
    excerpt: 'How trademarks work, why clearance comes before launch, and how to register and enforce a brand that genuinely holds up.',
    cf: { kind: 'article', readingTime: '8 min read', featured: true, alphabet: 'T', tags: ['ip', 'trademarks', 'brand', 'intellectual-property'] },
    seo: { title: 'Trademarks: Building and Protecting a Defensible Brand | Law Elite', description: 'A practical guide to trademarks — what they protect, why clearance matters, how registration works, and how to enforce and maintain your rights.', keywords: ['trademark', 'trademark registration', 'brand protection', 'trademark clearance', 'intellectual property'] },
    blocks: A(
      p('A brand is often a business\'s most valuable asset, yet it is the one most frequently left legally unprotected until something goes wrong. A trademark turns a name, logo, or slogan into a defensible legal right — but only if it is chosen, cleared, registered, and enforced properly. This guide explains how trademarks actually work and the practical sequence that builds a brand capable of withstanding challenge.'),
      KEY([
        'A trademark protects the signs that distinguish your goods or services from others.',
        'Clearance searches before launch are the cheapest insurance against a costly rebrand.',
        'Distinctive marks are far stronger and easier to protect than descriptive ones.',
        'Registration grants powerful rights, but enforcement and renewal keep them alive.',
      ]),
      h('What a Trademark Actually Protects'),
      p('A trademark is a sign — typically a word, logo, slogan, or combination — that distinguishes the goods or services of one business from those of another. Its core function is to indicate origin: when a customer sees the mark, they know who stands behind the product. Trademarks are registered in relation to specific categories of goods and services, so the same word can sometimes coexist as different brands in unrelated industries. What a trademark does not do is grant a monopoly over an ordinary word in every context; it protects the use of that sign as a badge of origin in the areas where you actually trade.'),
      h('Distinctiveness: The Foundation of a Strong Mark'),
      p('Not all brand names are equally protectable. Trademarks sit on a spectrum of distinctiveness, and where your mark falls determines how strong it is:'),
      ul([
        '<strong>Invented or "fanciful" marks</strong> — coined words with no prior meaning. The strongest and easiest to protect.',
        '<strong>Arbitrary marks</strong> — real words used in an unrelated context. Also very strong.',
        '<strong>Suggestive marks</strong> — hint at a quality without describing it. Protectable and often commercially appealing.',
        '<strong>Descriptive marks</strong> — describe the product or a feature. Weak, and registrable only if they acquire distinctiveness through use.',
        '<strong>Generic terms</strong> — the common name for the product itself. Never protectable as a trademark.',
      ]),
      p('The commercial temptation is to choose a descriptive name because it explains the product, but that is precisely what makes it hard to protect and easy for competitors to use. A more distinctive name is a stronger legal asset and, over time, often a stronger brand.'),
      h('Clearance: Search Before You Commit'),
      p('Before investing in a name — domains, packaging, signage, marketing — a clearance search checks whether the mark is already taken or conflicts with an existing registration. This step is routinely skipped and routinely regretted. Discovering a conflict after launch can force a rebrand, expose you to infringement claims, and waste everything spent building recognition. A proper clearance reviews trademark registers, common-law uses, and similar marks in related categories, then assesses the real risk of confusion. It is far cheaper than the alternative.'),
      h('The Registration Process'),
      p('Registering a trademark formalises and strengthens your rights. While details vary by jurisdiction, the process generally follows these steps:'),
      ul([
        '<strong>Define the mark and the goods/services</strong> — specify exactly what you are protecting and in which categories.',
        '<strong>Search and assess</strong> — confirm the mark is available and registrable.',
        '<strong>File the application</strong> — submit the mark, the specification, and the fees to the relevant registry.',
        '<strong>Examination</strong> — the registry reviews the application for compliance and conflicts.',
        '<strong>Publication and opposition</strong> — the mark is published so third parties can object within a set period.',
        '<strong>Registration</strong> — if unopposed and accepted, the mark is registered and the rights take effect.',
      ]),
      p('Registration brings significant advantages: a presumption of ownership, the exclusive right to use the mark for the registered goods and services, and a stronger basis for enforcement. Unregistered brands may have some protection through use, but it is narrower, harder to prove, and usually limited geographically.'),
      h('Enforcement and Maintenance'),
      p('A trademark is not a "register and forget" asset. Rights are kept alive by use, by renewal at set intervals, and by enforcement. If you allow others to use a confusingly similar mark unchallenged, your rights can weaken over time. Sensible brand owners monitor for conflicting applications and uses, address infringements proportionately — often starting with a measured letter rather than litigation — and keep their registrations current. Equally, a mark that becomes the generic term for a product can lose protection entirely, so consistent, correct use of the mark as an adjective alongside the product name helps preserve it.'),
      h('How Trademarks Fit Alongside Other IP'),
      p('A trademark is one tool in a wider intellectual-property toolkit, and it is easy to confuse the categories. A trademark protects the signs that identify the source of goods and services — your brand. A patent protects a new invention or technical process. Copyright protects original creative works such as writing, design, and code. A design right protects the appearance of a product. These rights overlap in practice: a single product might carry a brand name protected by trademark, embody an invention protected by a patent, and feature packaging protected by copyright and design rights.'),
      p('Understanding the distinction matters because relying on the wrong right leaves gaps. A trademark will not stop a competitor copying your underlying technology, and a patent will not stop them trading off your brand name. A coherent IP strategy maps each valuable asset — name, invention, content, appearance — to the right form of protection, and keeps them aligned as the business grows into new products and markets.'),
      h('Frequently Asked Questions'),
      h('What is the difference between ™ and ®?', 3),
      p('The ™ symbol can generally be used to claim rights in an unregistered mark, signalling that you treat it as a trademark. The ® symbol indicates a registered trademark and may only be used once registration is granted. Misusing ® before registration can carry consequences in some jurisdictions.'),
      h('How long does a trademark last?', 3),
      p('A registered trademark can last indefinitely, but only if it is renewed at the required intervals and continues to be used. Failure to renew or genuine non-use can lead to the registration lapsing or being challenged.'),
      h('Do I need to register in every country?', 3),
      p('Trademark rights are territorial, so a registration protects you only where it is granted. If you trade or plan to trade internationally, you generally need protection in each relevant market, which international filing systems can streamline.'),
      h('Conclusion'),
      p('A defensible brand is the product of deliberate choices: a distinctive mark, a clearance search before launch, timely registration, and ongoing enforcement and renewal. Treating your trademark as the strategic asset it is — rather than an afterthought — protects both the brand you build and the goodwill your customers attach to it. For anything beyond a simple single-market filing, professional advice pays for itself.'),
      DISCLAIMER,
    ),
  },
  {
    slug: 'commercial-leasing-terms-that-matter',
    cat: 'real-estate-law-leasing',
    title: 'Commercial Leasing: The Key Terms That Decide Who Pays',
    excerpt: 'A tenant-focused guide to the commercial lease clauses that quietly determine cost, flexibility, and risk over the life of a lease.',
    cf: { kind: 'article', readingTime: '8 min read', featured: true, alphabet: 'C', tags: ['real-estate', 'leasing', 'commercial', 'property'] },
    seo: { title: 'Commercial Leasing: The Key Terms That Decide Who Pays | Law Elite', description: 'Understand the commercial lease clauses that matter most — rent and reviews, repairs, assignment, break rights, and more — before you sign.', keywords: ['commercial lease', 'lease agreement', 'commercial property', 'leasing lawyer', 'tenant rights'] },
    blocks: A(
      p('A commercial lease is one of the largest and longest commitments many businesses make, yet it is often signed with attention focused only on the headline rent. The clauses that ultimately decide how much a lease costs, how flexible it is, and who carries the risk when something goes wrong are usually elsewhere in the document. This guide walks through the terms that matter most — written from the tenant\'s perspective, but useful to anyone on either side of the table.'),
      KEY([
        'Rent is only the starting point — repair, service charge, and review clauses often cost more over time.',
        'Repairing obligations decide who pays to maintain and reinstate the property; they are heavily negotiated.',
        'Assignment, subletting, and break clauses determine your flexibility if your business changes.',
        'Read the whole lease before signing — the expensive terms are rarely the obvious ones.',
      ]),
      h('Rent — and Everything That Comes With It'),
      p('The headline rent is the figure everyone notices, but the lease usually layers other recurring costs on top: service charges for shared areas and building services, insurance contributions, and business rates or local taxes. A lease described as having a low rent can be expensive once these are added, so the right comparison is the total occupancy cost, not the rent alone. Equally important is how the rent changes over time. Rent-review clauses — whether fixed increases, index-linked, or open-market reviews — can significantly raise costs across a long term, and "upward-only" reviews mean the rent can rise but never fall, regardless of the market.'),
      h('Repairing Obligations: The Clause That Surprises Tenants'),
      p('Few clauses cause as many disputes as repair. A lease may make the tenant responsible for keeping the premises in good repair — and in some cases for putting them into a better condition than they were at the start. On a "full repairing and insuring" basis, the tenant effectively bears the cost of maintaining the property and may face a substantial bill at the end of the term to reinstate it. Tenants can manage this risk by:'),
      ul([
        'Recording the condition of the premises at the start with a photographic schedule of condition.',
        'Negotiating to limit repairing obligations to the condition documented at the outset.',
        'Clarifying responsibility for structural elements, the roof, and building services.',
        'Understanding dilapidations — the claim a landlord can make at the end of the lease for unmet repair obligations.',
      ]),
      h('Flexibility: Assignment, Subletting, and Break Rights'),
      p('Businesses change, and a lease should not trap you in space you no longer need. Three clauses govern your ability to adapt.'),
      h('Assignment and Subletting', 3),
      p('Assignment transfers the whole lease to a new tenant; subletting grants part or all of the space to someone else while you remain liable. Leases usually permit these only with the landlord\'s consent, and the conditions attached — and whether consent can be unreasonably withheld — make a real difference to your exit options. A lease that effectively blocks assignment can leave you paying for space you cannot use.'),
      h('Break Clauses', 3),
      p('A break clause lets a party end the lease early on a defined date. For tenants it is valuable flexibility, but break clauses are often hedged with strict conditions — notice in the correct form and time, rent paid up to date, and the premises handed back in a particular state. Courts apply these conditions strictly, and a missed technicality can invalidate the break entirely, leaving the tenant locked in. If a break right matters to you, the conditions attached to it matter just as much.'),
      h('Use, Alterations, and Other Practical Terms'),
      p('Several further clauses shape what you can actually do with the space. The permitted-use clause defines what business you may carry on; too narrow a definition can restrict your growth or your ability to assign. Alterations clauses govern whether and how you can fit out or change the premises, and whether you must reinstate them at the end. Insurance, indemnity, and forfeiture (the landlord\'s right to end the lease for breach) all allocate risk and deserve attention. None of these are glamorous, but together they determine how the lease behaves in practice.'),
      h('Before You Sign: A Tenant\'s Checklist'),
      p('A short, disciplined review before signing prevents most leasing regrets:'),
      ul([
        'Calculate the total occupancy cost — rent plus service charge, insurance, and rates — not just the rent.',
        'Understand how and when the rent can be reviewed, and whether reviews are upward-only.',
        'Pin down the repairing obligations and protect yourself with a schedule of condition.',
        'Check assignment, subletting, and break rights against how your business might change.',
        'Confirm the permitted use covers what you do now and might do later.',
        'Identify the end-of-term obligations, including reinstatement and potential dilapidations.',
      ]),
      h('Frequently Asked Questions'),
      h('What does "full repairing and insuring" mean?', 3),
      p('It is a lease structure where the tenant bears the cost of repairing the premises and contributes to or covers insurance, leaving the landlord with a largely cost-free income. It shifts significant risk to the tenant, which is why repairing scope and a schedule of condition matter so much.'),
      h('Can I get out of a commercial lease early?', 3),
      p('Only if the lease allows it — typically through a break clause or by assigning or subletting with consent. Each route has conditions that must be met precisely, so early exit is rarely as simple as it sounds and is best planned for before signing.'),
      h('Should a lawyer review my lease before I sign?', 3),
      p('Given the length of the commitment and the cost of the clauses that are easy to overlook, professional review is generally well worth it. A lawyer can flag onerous terms, negotiate protections, and ensure you understand the obligations you are taking on.'),
      h('Conclusion'),
      p('In a commercial lease, the rent is only the beginning of the story. Repairing obligations, rent reviews, flexibility clauses, and end-of-term liabilities frequently have a bigger long-term impact on cost and risk. Reading the whole document, calculating the true occupancy cost, and securing professional review before signing turn a daunting commitment into a managed, informed decision.'),
      DISCLAIMER,
    ),
  },
];

// ── HTTP helpers ──
async function req(method, url, token, body) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}
const jget = (u, t) => req('GET', u, t);
const jpost = (u, t, b) => req('POST', u, t, b);
const jpatch = (u, t, b) => req('PATCH', u, t, b);

async function login() {
  const res = await jpost(`${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = res.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(res.data).slice(0, 240));
  return token;
}
async function fetchCategories(token) {
  const res = await jget(`${BASE}/categories?limit=500`, token);
  const rows = res.data?.data || [];
  const map = {};
  const walk = (n) => { for (const c of n) { map[c.slug] = c.id; if (Array.isArray(c.children)) walk(c.children); } };
  walk(rows);
  return map;
}
async function fetchContent(token) {
  const map = {};
  for (let page = 1; page <= 20; page++) {
    const res = await jget(`${BASE}/content?limit=100&page=${page}`, token);
    const rows = res.data?.data || [];
    for (const c of rows) map[c.slug] = { id: c.id, status: c.status };
    const p = res.data?.pagination;
    if (!p || page >= p.totalPages) break;
  }
  return map;
}

function wordCount(blocks) {
  return blocks
    .map((b) => (b.content?.text || b.content?.html || '').replace(/<[^>]+>/g, ' '))
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function main() {
  const token = await login();
  const cats = await fetchCategories(token);
  const existing = await fetchContent(token);

  let created = 0, updated = 0;
  const touched = [];
  for (const a of ARTICLES) {
    const wc = wordCount(a.blocks);
    const payload = {
      title: a.title,
      slug: a.slug,
      contentType: 'article',
      excerpt: a.excerpt,
      categoryId: cats[a.cat] || undefined,
      contentBlocks: a.blocks,
      customFields: a.cf,
      seoMetadata: a.seo,
    };
    if (existing[a.slug]) {
      const res = await jpatch(`${BASE}/content/${existing[a.slug].id}`, token, payload);
      if (res.status === 200 || res.status === 201) { updated++; touched.push(a.slug); }
      else console.error(`  update ${a.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
    } else {
      const res = await jpost(`${BASE}/content`, token, payload);
      if (res.status === 200 || res.status === 201) { created++; touched.push(a.slug); }
      else console.error(`  create ${a.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
    }
    console.log(`  ${a.slug} — ~${wc} words [${existing[a.slug] ? 'updated' : 'created'}]`);
  }

  // publish everything touched
  const after = await fetchContent(token);
  let published = 0, already = 0;
  for (const slug of touched) {
    const rec = after[slug];
    if (!rec) continue;
    if (['published', 'scheduled', 'archived'].includes(rec.status)) { already++; continue; }
    const res = await jpost(`${BASE}/content/${rec.id}/workflow/transition`, token, { action: 'publish' });
    if (res.status === 200 || res.status === 201) published++;
    else console.error(`  publish ${slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 160));
  }

  console.log(JSON.stringify({ ok: true, created, updated, published, already, total: touched.length }, null, 2));
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
