'use strict';
/*
 * Replaces the placeholder body (a single heading + one-sentence paragraph)
 * on the last 3 genuinely thin articles from the 2026-06-28 bulk-seed batch.
 * The other 3 from that same batch (Corporate Compliance -- fixed separately
 * by fix-corporate-compliance-content.cjs; Mediation; Patent Protection for
 * Startups) were already either fixed or turned out to already have full
 * content on inspection.
 *
 * USAGE
 *   CMS_TOKEN=<bearer> node scripts/fix-remaining-stub-content.cjs --dry-run
 *   CMS_TOKEN=<bearer> node scripts/fix-remaining-stub-content.cjs
 */

const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';
const TARGET_BASE = process.env.TARGET_CMS_BASE || 'https://admin.baalvion.com/api-bff/knowledge/cms/api/v1';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const TOKEN = process.env.CMS_TOKEN || null;

function h(level, text) { return { type: 'heading', content: { text, level } }; }
function p(html) { return { type: 'html', content: { html: `<p>${html}</p>` } }; }
function ul(items) { return { type: 'html', content: { html: `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` } }; }

function blocks(raw) {
  return raw.map((b, i) => ({ id: `blk-${i}`, order: i, ...b }));
}

const ARTICLES = [
  {
    id: '0ddac16a-24ab-4a4c-a545-15cfad441efc',
    title: 'Resolving Property Boundary Disputes',
    readingTimeMinutes: 8,
    citations: [
      { title: 'Restatement (Third) of Property: Servitudes' },
      { title: 'HM Land Registry — Practice Guide 40: HM Land Registry plans (boundaries)' },
      { title: 'Uniform Law Commission — Uniform Real Property Electronic Recording Act (recording/title context)' },
    ],
    blocks: blocks([
      p('A boundary dispute usually starts small -- a fence a few feet over the line, a driveway that clips a neighbor\'s corner, a tree whose roots cross underground -- but left unresolved it can cloud a property\'s title and complicate any future sale. Most disputes are avoided, or resolved quickly, by going back to the same starting point: an authoritative survey and a clear paper trail of title.'),

      h(2, 'Start With the Survey and the Record'),
      p('A licensed surveyor\'s plat, tied to the legal description in the deed and to any recorded plat map, is the baseline every boundary dispute gets measured against. Deeds describe boundaries by metes and bounds, by reference to a recorded plat, or by natural monuments -- and small inconsistencies between a decades-old description and what is physically on the ground are common. Before assuming a fence or hedge marks the "real" line, get a current survey and compare it against the chain of title; a surprising number of disputes resolve once both sides are looking at the same accurate measurement.'),

      h(2, 'When Possession Can Shift the Legal Line'),
      h(3, 'Adverse Possession'),
      p('In most U.S. states, someone who occupies land that legally belongs to a neighbor can eventually acquire title to it if their possession was actual, open and notorious, continuous, exclusive, and hostile (without the owner\'s permission) for a statutory period that varies by state, commonly somewhere between 10 and 20 years. The doctrine exists to encourage productive use of land and to eventually resolve long-standing, unchallenged boundary confusion -- but every element has to be proven, and permissive use (even an informal "sure, go ahead" from a prior owner) defeats a claim entirely.'),
      h(3, 'Boundary by Acquiescence'),
      p('Separately, many states recognize "boundary by acquiescence": where neighbors have treated a particular line -- a fence, a hedge, a wall -- as the boundary for a long period, courts in some jurisdictions will treat that line as the legal boundary even if it doesn\'t exactly match the recorded description, on the theory that long, mutual acceptance of a line should not be casually reopened.'),

      h(2, 'Encroachments'),
      p('An encroachment is a structure or improvement -- a fence, shed, driveway, or overhanging roofline -- that physically crosses the boundary line. Remedies typically range from a negotiated license or easement letting the encroachment stay, to an order requiring removal, to (in some jurisdictions, for minor and long-standing encroachments) a forced sale of the small strip of land at market value rather than requiring demolition. Courts generally weigh how long the encroachment existed, whether it was built in good faith, and how disruptive removal would be to both sides.'),

      h(2, 'Routes to Resolution'),
      ul([
        '<strong>Direct negotiation:</strong> often the fastest and cheapest path, especially between neighbors who intend to keep living next to each other.',
        '<strong>A new survey, jointly commissioned:</strong> removes the "my surveyor vs. your surveyor" problem and gives both sides a shared, authoritative reference point.',
        '<strong>Mediation:</strong> a neutral third party helps the parties reach their own agreement -- useful when the relationship matters as much as the outcome.',
        '<strong>Quiet title action:</strong> a lawsuit asking a court to formally determine and record the true boundary, typically pursued when negotiation fails or the title itself is genuinely unclear.',
      ]),

      h(2, 'How This Varies by Jurisdiction'),
      p('In the United States, boundary law is set almost entirely at the state level, so adverse possession periods, acquiescence doctrine, and encroachment remedies all differ by state. In England and Wales, HM Land Registry title plans are based on general boundaries -- they show the approximate position of a boundary, not its precise legal line -- so a genuine dispute is usually resolved by a determined-boundary application or, in some cases, a boundary agreement recorded against both titles, rather than by adverse possession claims of the U.S. kind, since the rules for adverse possession against registered land changed significantly under the Land Registration Act 2002. Because the underlying property and recording systems differ so much between jurisdictions, always confirm the local rules before assuming a U.S.-style adverse possession or acquiescence argument applies elsewhere.'),

      h(2, 'Frequently Asked Questions'),
      h(3, 'Can a fence in the wrong place ever become the real legal boundary?'),
      p('In some jurisdictions, yes -- through adverse possession or boundary-by-acquiescence doctrines, a long-standing fence line can eventually become the legally recognized boundary, though the exact requirements and time periods vary significantly by state or country.'),
      h(3, 'Do I need a lawyer to resolve a boundary dispute?'),
      p('Not always -- many disputes are resolved through direct neighbor negotiation or a jointly commissioned survey. A lawyer becomes important once a quiet title action, a serious encroachment, or a genuinely contested adverse possession claim is on the table.'),
      h(3, 'How much does a boundary survey typically involve?'),
      p('Cost and scope vary by property size, terrain, and how recently the area was last surveyed, but a licensed surveyor will typically research the recorded deed and any prior surveys before physically marking the boundary on the ground.'),

      h(2, 'Practical Next Steps'),
      p('Pull the recorded deed and any prior survey before doing anything else, and commission a current survey if the last one is old or the parties disagree on where it puts the line. Try direct negotiation or a jointly commissioned survey first -- litigation over a boundary line is often disproportionately expensive relative to the land actually in dispute. If a resolution can\'t be reached informally, consult a real estate attorney licensed in the property\'s jurisdiction before filing anything, since remedies and required procedures differ significantly by state and country.'),

      p('<em>This article is general legal information, not legal advice. Property and boundary law differ significantly by jurisdiction and change over time -- consult a qualified real estate lawyer licensed where the property is located before acting.</em>'),
    ]),
  },

  {
    id: '4d36e739-e7be-4f1c-92eb-334208b30356',
    title: 'White-Collar Investigations: What to Expect',
    readingTimeMinutes: 8,
    citations: [
      { title: 'Upjohn Co. v. United States, 449 U.S. 383 (1981)' },
      { title: 'U.S. Department of Justice, Justice Manual — Principles of Federal Prosecution of Business Organizations' },
      { title: 'UK Serious Fraud Office — Deferred Prosecution Agreements guidance' },
    ],
    blocks: blocks([
      p('A white-collar investigation rarely announces itself with a dramatic raid. More often it starts quietly -- a document preservation notice, a subpoena, an internal whistleblower report, or an auditor flagging an irregularity -- and how an organization responds in those first days materially shapes what happens next. This guide walks through the stages a typical investigation follows and what to expect at each one.'),

      h(2, 'Early Signals'),
      p('Investigations are commonly triggered by an internal whistleblower report, an external audit finding, a regulator\'s routine examination turning up something unusual, a competitor or customer complaint, or a subpoena or civil investigative demand arriving out of nowhere. A litigation hold or document preservation notice -- whether self-imposed or demanded by a regulator -- is often the clearest early sign that a matter has moved from routine to serious, since destroying or losing relevant documents after a duty to preserve arises can itself become a separate legal problem.'),

      h(2, 'Why Early Counsel Changes Outcomes'),
      p('Engaging experienced counsel as soon as a credible signal appears -- rather than after a subpoena forces the issue -- consistently produces better outcomes. Early counsel can structure the internal investigation to preserve attorney-client privilege, advise on what must legally be preserved versus what can continue in the ordinary course of business, and help the organization decide early whether voluntary self-disclosure to a regulator is the right call, a decision that can meaningfully affect how the matter is ultimately resolved.'),

      h(2, 'Privilege and the Upjohn Warning'),
      p('When outside counsel interviews employees as part of an internal investigation, U.S. law (following the Supreme Court\'s decision in <em>Upjohn Co. v. United States</em>) generally extends attorney-client privilege to those interviews -- but the privilege belongs to the <strong>company</strong>, not the individual employee. Counsel conducting the interview is required to give what\'s commonly called an "Upjohn warning": explaining that the lawyer represents the company, not the employee personally, that the interview is privileged but the company alone controls whether to waive that privilege, and that the employee may want their own independent counsel. Employees are frequently surprised to learn the company\'s lawyer is not "their" lawyer in this context.'),

      h(2, 'Typical Stages of an Investigation'),
      ul([
        '<strong>Preservation:</strong> a hold notice goes out, and relevant documents, communications, and data are identified and secured.',
        '<strong>Internal investigation:</strong> outside counsel (often alongside forensic accountants) interviews witnesses, reviews documents, and assesses what actually happened and who may be exposed.',
        '<strong>Disclosure decision:</strong> the organization, advised by counsel, decides whether to voluntarily self-disclose findings to a regulator, which can affect cooperation credit later.',
        '<strong>Government investigation:</strong> if regulators or prosecutors get involved, expect subpoenas, document productions, and interviews of current and former employees.',
        '<strong>Resolution:</strong> outcomes range from the matter being closed with no action, to a civil settlement, to a deferred or non-prosecution agreement, to criminal charges against the organization or individuals.',
      ]),

      h(2, 'Deferred and Non-Prosecution Agreements'),
      p('In many white-collar matters, especially against organizations rather than individuals, prosecutors resolve the case through a deferred prosecution agreement (DPA) or non-prosecution agreement (NPA) rather than pursuing a conviction. Under a DPA, charges are filed but held in abeyance -- and typically dismissed -- if the company complies with agreed terms over a monitoring period, which often include a compliance monitor, remediation commitments, and a financial penalty. The UK introduced its own DPA framework for organizations (though not individuals) under the Crime and Courts Act 2013, overseen by the Serious Fraud Office and approved by a court, modeled loosely on the U.S. approach but with its own procedural safeguards.'),

      h(2, 'Employee Rights During an Investigation'),
      p('Employees interviewed as part of an internal investigation are not in police custody, so Miranda-style warnings generally don\'t apply -- but the Upjohn warning described above still matters, and an employee who feels their own interests diverge from the company\'s is generally free to consult independent counsel before or during the process. Employees compelled to testify before a grand jury or government investigators have their own constitutional protections, including the privilege against self-incrimination, which operates independently of whatever the company\'s internal investigation concludes.'),

      h(2, 'Frequently Asked Questions'),
      h(3, 'Does receiving a document preservation notice mean I\'m personally under investigation?'),
      p('Not necessarily -- preservation notices are often sent broadly to anyone who might hold relevant documents, well beyond the specific individuals a regulator or prosecutor may ultimately focus on.'),
      h(3, 'Can I refuse to be interviewed in an internal company investigation?'),
      p('Employment consequences for refusing can differ by company policy and jurisdiction, but the interview itself is generally voluntary as a legal matter -- an employee with concerns about their own exposure should raise the question of independent counsel before agreeing to be interviewed.'),
      h(3, 'What\'s the difference between a subpoena and a civil investigative demand?'),
      p('Both compel document production or testimony, but they\'re issued under different legal authority -- a subpoena is typically issued by a grand jury or court, while a civil investigative demand is a tool certain regulators use to gather information before deciding whether to bring a case at all.'),

      h(2, 'Practical Next Steps'),
      p('At the first credible sign of a potential investigation -- a preservation demand, a whistleblower report, an unusual audit finding -- engage experienced white-collar counsel before deciding how to respond, not after. Put a preservation hold in place immediately and document that it was issued and followed. Resist the instinct to investigate informally without counsel structuring the process, since doing so can waive privilege that would otherwise protect the findings.'),

      p('<em>This article is general legal information, not legal advice. Investigation procedures, privilege rules, and resolution mechanisms differ by jurisdiction and change over time -- consult a qualified white-collar defense lawyer before taking any action in response to a real investigation.</em>'),
    ]),
  },

  {
    id: '8b31d2bf-3fce-4c88-927a-d2c97a5ca3ad',
    title: 'Navigating the Divorce Process',
    readingTimeMinutes: 7,
    citations: [
      { title: 'Uniform Marriage and Divorce Act (Uniform Law Commission)' },
      { title: 'American Bar Association — Family Law Section, general divorce process resources' },
    ],
    blocks: blocks([
      p('Divorce procedure differs by country and, within the U.S., by state -- but most systems move through a similar sequence: filing, disclosure, temporary arrangements, negotiation, and a final decree. Knowing that map in advance makes the process less disorienting, even though the substantive rules on property, support, and custody vary widely by jurisdiction (see this network\'s dedicated guides on those topics for a given country).'),

      h(2, 'Grounds and Residency Requirements'),
      p('Most jurisdictions today offer "no-fault" divorce, where a party need only assert the marriage is irretrievably broken rather than prove misconduct by the other spouse, though some places still allow or require fault-based grounds such as adultery or desertion in certain circumstances. Nearly every jurisdiction also imposes a minimum residency requirement -- commonly a matter of months -- before its courts will accept a filing, which matters for couples who have recently moved or who live in different places.'),

      h(2, 'Filing and Service'),
      p('The process formally begins when one spouse (the "petitioner" or "plaintiff") files a petition or complaint for divorce with the court, which is then served on the other spouse, who has an opportunity to respond. Where the divorce is genuinely uncontested, courts in many places offer a simplified or expedited track.'),

      h(2, 'Financial Disclosure'),
      p('Most jurisdictions require both spouses to exchange full financial disclosure early in the process -- income, assets, debts, and expenses -- since property division and support calculations both depend on an accurate picture of the marital finances. Getting this step right, and doing it honestly, materially reduces conflict and cost later; incomplete or dishonest disclosure is one of the most common sources of drawn-out, expensive litigation and can expose the withholding spouse to sanctions.'),

      h(2, 'Temporary Orders'),
      p('While the case is pending -- which can take months -- courts can issue temporary ("pendente lite") orders covering who stays in the family home, temporary child or spousal support, and a temporary parenting schedule, so that neither spouse nor any children are left without a functioning arrangement while the underlying case proceeds toward resolution.'),

      h(2, 'Negotiation, Mediation, and Settlement'),
      p('The large majority of divorces settle without a trial. Many courts require or strongly encourage mediation before trial is available, and even outside a mandatory program, negotiating directly (often through each spouse\'s lawyer) is typically faster, cheaper, and less adversarial than litigating every issue in front of a judge. A settlement covering property division, support, and (where relevant) custody is then submitted to the court for approval and incorporated into the final decree.'),

      h(2, 'Trial, if Necessary'),
      p('When spouses can\'t reach agreement on one or more issues, the case proceeds to trial, where a judge (rarely a jury, in most family law systems) decides the contested points -- typically property division, support, and custody or parenting time -- based on evidence and the standards set by local law. Trial is generally the most expensive, slowest, and most adversarial path, which is why courts and lawyers alike tend to push settlement wherever the parties are willing.'),

      h(2, 'The Final Decree'),
      p('Once every issue is resolved -- by settlement or by trial -- the court issues a final decree (or judgment) of divorce, formally ending the marriage and incorporating the agreed or ordered terms on property, support, and custody. That decree is enforceable as a court order; a spouse who later fails to comply can typically be brought back before the same court for enforcement.'),

      h(2, 'Frequently Asked Questions'),
      h(3, 'How long does a divorce typically take?'),
      p('It varies enormously by jurisdiction, court backlog, and whether the case is contested -- an uncontested divorce with a full settlement can sometimes finalize in a few months, while a heavily contested case can take a year or more.'),
      h(3, 'Do both spouses need separate lawyers?'),
      p('It isn\'t legally required in most places, but a lawyer generally cannot represent both spouses in a contested divorce due to the conflict of interest -- each spouse retaining independent counsel is the norm once there\'s any real dispute over money or children.'),
      h(3, 'Can the divorce process start before financial disclosure is complete?'),
      p('Yes -- filing and disclosure typically happen in parallel rather than disclosure being a precondition to filing, though many courts won\'t finalize a settlement or move toward trial until disclosure is substantially complete.'),

      h(2, 'Practical Next Steps'),
      p('Start gathering financial records -- income, account statements, debts -- as early as possible, since disclosure delays are one of the most common causes of a stalled case. Understand your jurisdiction\'s residency and filing requirements before submitting a petition, and consult a family law attorney licensed where you or your spouse will file, since property division, support, and custody standards differ significantly by state and country.'),

      p('<em>This article is general legal information, not legal advice. Divorce procedure and substantive law differ significantly by jurisdiction and change over time -- consult a qualified family law attorney licensed in the relevant jurisdiction before acting.</em>'),
    ]),
  },
];

async function api(method, urlPath, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${TARGET_BASE.replace(/\/+$/, '')}${urlPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* */ }
  if (!res.ok) throw new Error(`${method} ${urlPath} -> ${res.status} ${(json && (json.error?.message || json.message)) || text}`);
  return json;
}

async function main() {
  console.log('Remaining stub-content fix');
  console.log(`  mode : ${DRY_RUN ? 'DRY RUN' : 'UPDATE'}\n`);
  if (!TOKEN) throw new Error('No CMS_TOKEN set.');

  for (const art of ARTICLES) {
    const current = await api('GET', `/cms/websites/${encodeURIComponent(SITE)}/content/${art.id}`);
    const article = current?.data;
    if (!article) { console.log(`  ! not found: ${art.title} (${art.id})`); continue; }
    console.log(`  "${article.title}" -- currently ${article.contentBlocks?.length ?? 0} block(s), will write ${art.blocks.length} block(s) + ${art.citations.length} citation(s)`);

    if (DRY_RUN) continue;

    const currentCustomFields = article.customFields || {};
    await api('PATCH', `/cms/websites/${encodeURIComponent(SITE)}/content/${art.id}`, {
      contentBlocks: art.blocks,
      readingTimeMinutes: art.readingTimeMinutes,
      customFields: { ...currentCustomFields, citations: art.citations },
    });
    console.log(`    -> updated`);
  }

  console.log(`\n${DRY_RUN ? 'Dry run complete. No changes made.' : 'Done.'}`);
}

main().catch((err) => { console.error('FAILED:', err.message); process.exit(1); });
