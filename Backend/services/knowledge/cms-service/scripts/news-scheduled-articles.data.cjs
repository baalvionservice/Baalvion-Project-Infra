'use strict';
/*
 * 6 well-researched news articles (3 per site), for scripts/seed-news-scheduled.cjs.
 * Sourced from real, verifiable events (India Corporate Laws Amendment Bill 2026, two
 * July 2026 Supreme Court rulings, and this week's oil/Fed/yen market moves) — see
 * memory imperialpedia-news-1/2/3 and law-elite-news-1/2/3 drafts for source notes.
 * scheduledAt values are staggered across three days so the CMS scheduler (BullMQ) auto-
 * publishes one Law-Elite + one Imperialpedia article per day.
 */

const LAW_AUTHOR = (name) => ({ name });

module.exports = [
  // ── Law Elite Network (India legal news) ──────────────────────────────
  {
    site: 'law-elite-network',
    categorySlug: 'business-corporate',
    categoryName: 'Business & Corporate',
    title: "Corporate Laws (Amendment) Bill, 2026: What India's Decriminalisation Push Means for Companies and LLPs",
    slug: 'corporate-laws-amendment-bill-2026-decriminalisation',
    excerpt: "India's Corporate Laws (Amendment) Bill, 2026 replaces criminal penalties with monetary fines for procedural defaults, doubles small-company thresholds, and empowers NFRA. Here's what changes for companies and LLPs.",
    focusKeyword: 'Corporate Laws Amendment Bill 2026 India',
    dateline: 'New Delhi',
    author: LAW_AUTHOR('Elena Rossi'),
    scheduledAt: '2026-07-04T09:30:00Z',
    keyTakeaways: [
      'The Bill replaces criminal penalties with monetary fines for procedural/technical defaults under the Companies Act and LLP Act.',
      'NFRA gains stronger enforcement powers over auditors even as general compliance risk eases.',
      'Small-company thresholds double (paid-up capital ₹10cr→₹20cr, turnover ₹100cr→₹200cr); the CSR trigger rises ₹5cr→₹10cr.',
      'LLPs operating in IFSCs (e.g. GIFT City) get a formal regulatory framework under the LLP Act.',
      'The Bill is still with a Joint Parliamentary Committee — final provisions may change before enactment.',
    ],
    faq: [
      { question: 'Is the Corporate Laws (Amendment) Bill, 2026 already law?', answer: 'No — it was referred to a Joint Parliamentary Committee after introduction and has not been enacted as of this writing.' },
      { question: 'Does decriminalisation mean no consequences for non-compliance?', answer: 'No — criminal prosecution is replaced with monetary penalties and adjudication, not eliminated liability.' },
      { question: 'Which companies benefit from the new small-company thresholds?', answer: 'Private companies with paid-up capital up to ₹20 crore or turnover up to ₹200 crore would newly qualify once enacted.' },
      { question: 'Does the CSR threshold change apply retroactively?', answer: 'No — threshold changes apply prospectively from the date the amendment takes effect, not to past financial years.' },
    ],
    markdown: `Parliament is weighing the most significant rewrite of India's company-law penalty framework in nearly a decade. The Corporate Laws (Amendment) Bill, 2026, introduced by Finance Minister Nirmala Sitharaman in the Lok Sabha on March 23, 2026, has since been referred to a Joint Parliamentary Committee for detailed scrutiny — a signal that lawmakers expect the changes to reshape day-to-day compliance for a large share of India Inc.

## The core shift: decriminalising the paperwork

The Bill's central move is to strip criminal liability from a long list of procedural and technical defaults under the Companies Act and the Limited Liability Partnership Act, replacing prosecution with monetary penalties and an in-house adjudication mechanism. Two examples illustrate the scale of the change: non-compliance with a Registrar of Companies requisition will now draw a fixed penalty of ₹10,000 rather than criminal proceedings, and failure to hold an annual general meeting on time moves from a prosecutable offence to a monetary-penalty matter.

For company secretaries and compliance officers, the practical effect is fewer trips to a magistrate's court over missed filings and clerical lapses — and a corresponding rise in adjudication orders that carry financial, not custodial, consequences.

## A stronger National Financial Reporting Authority

The trade-off for lighter procedural penalties is a more assertive regulator elsewhere in the system. The Bill expands the National Financial Reporting Authority's powers, giving it clearer authority to issue directions, conduct inquiries, and impose penalties, alongside new mechanisms for auditor registration, reporting and accountability. Audit committees and statutory auditors of large companies should expect NFRA oversight to tighten even as general procedural risk eases.

## Relief for small companies and LLPs

Three changes will matter most to founders and finance teams at smaller entities:

- **Small company thresholds double.** The paid-up capital ceiling for "small company" classification rises from ₹10 crore to ₹20 crore, and the turnover ceiling from ₹100 crore to ₹200 crore — pulling many mid-sized private companies into the lighter compliance regime reserved for small companies.
- **CSR threshold rises.** The net-profit trigger for mandatory CSR spending increases from ₹5 crore to ₹10 crore, exempting a wider band of growing companies from the obligation.
- **IFSC integration for LLPs.** The Bill formally extends the LLP Act, 2008 framework to LLPs operating within International Financial Services Centres, under IFSCA's regulatory umbrella — closing a structural gap for fund and services entities structured as LLPs in GIFT City.

## Digital-first governance

The Bill also codifies electronic communication, digital contact-detail maintenance, and e-service of documents as standard practice rather than an emergency workaround, formalising habits many companies adopted during the pandemic years.

## What businesses should do now

The Bill is still before the Joint Parliamentary Committee, so provisions can change before enactment. Companies and LLPs should treat this as a planning window rather than a compliance deadline: review which procedural defaults currently expose directors to prosecution risk, model whether the new small-company thresholds bring the entity into a lighter filing regime, and flag CSR budgets that may no longer be mandatory once the ₹10 crore threshold takes effect. Boards and compliance teams that map their exposure now will be positioned to act quickly once the JPC reports back and the final text is enacted.

*This article is for general informational purposes and does not constitute legal advice. Consult a qualified corporate lawyer before making compliance decisions based on the Corporate Laws (Amendment) Bill, 2026, which remains under legislative review.*`,
  },
  {
    site: 'law-elite-network',
    categorySlug: 'dispute-resolution',
    categoryName: 'Dispute Resolution',
    title: 'Supreme Court Sets Clearer Rules for Calculating Compensation in Motor Accident Claims',
    slug: 'supreme-court-motor-accident-compensation-itr-ruling',
    excerpt: 'A Supreme Court bench has held that self-employed claimants’ ITR for the year before an accident should ordinarily set their income for Motor Vehicles Act compensation calculations.',
    focusKeyword: 'Supreme Court motor accident compensation ruling',
    dateline: 'New Delhi',
    author: LAW_AUTHOR('Marcus Whitfield'),
    scheduledAt: '2026-07-05T09:30:00Z',
    keyTakeaways: [
      "The Supreme Court held that a self-employed claimant's ITR for the year immediately preceding the accident should ordinarily determine annual income for compensation purposes.",
      'The ruling distinguishes calculation methods for salaried employees (documented via payslips/Form 16) from self-employed claimants.',
      'Income is the base figure in the multiplier method used to calculate Motor Vehicles Act compensation awards.',
      'The decision aims to standardise a previously inconsistent area of tribunal practice.',
      'Claimants without a filed ITR for the relevant year may face an unresolved evidentiary question under the new framework.',
    ],
    faq: [
      { question: 'Does this ruling apply to salaried employees too?', answer: "The clarification is specifically aimed at self-employed claimants; salaried claimants' income is typically established through employer documentation." },
      { question: "What if the claimant didn't file an ITR that year?", answer: 'The judgment does not eliminate other forms of proof, but it establishes the ITR as the ordinary reference point where one exists.' },
      { question: 'Does this change how much compensation claimants receive?', answer: 'It changes how income is calculated, which is one input into the multiplier formula — outcomes will vary by case.' },
      { question: 'Which court issued this ruling?', answer: 'The Supreme Court of India, per a bench of Justice Sanjay Karol and Justice Nongmeikapam Kotiswar Singh.' },
    ],
    markdown: `The Supreme Court has issued fresh guidance on one of the most litigated questions in motor-accident compensation claims: how a victim's annual income should be calculated when courts determine the size of an award. A bench of Justice Sanjay Karol and Justice Nongmeikapam Kotiswar Singh has drawn a clearer line between salaried employees and self-employed persons, addressing an inconsistency that has produced widely varying awards from tribunal to tribunal.

## What the Court held

For self-employed claimants and their dependents, the bench held that the Income Tax Return filed for the year immediately preceding the accident should ordinarily be used to determine annual income for compensation purposes. This resolves a recurring dispute in Motor Accident Claims Tribunals, where self-employed claimants — shopkeepers, professionals, gig and informal-sector workers — often lacked the same documentary trail as salaried employees, whose income is easily verified through payslips, Form 16, and employer records.

By anchoring self-employed income calculations to the most recent ITR, the Court has given tribunals a single, verifiable reference point, reducing reliance on oral testimony or ad hoc income estimation that could be challenged as arbitrary on appeal.

## Why the distinction matters

Motor Vehicles Act compensation is built on a multiplier method: a claimant's determined annual income is multiplied by a factor tied to age to arrive at a lump-sum award, then adjusted for factors like future prospects and dependency. Because the income figure sits at the base of that calculation, even modest differences in how it is assessed can swing final awards by lakhs of rupees. Tribunals have historically applied inconsistent standards for self-employed claimants — sometimes accepting affidavits, sometimes demanding bank statements, sometimes applying notional minimum-wage figures — which the Supreme Court's ruling now narrows toward a documentary standard centred on ITRs.

## Practical impact for claimants and insurers

For claimants without a filed ITR for the relevant year — common among informal-sector workers — the ruling raises a practical question that tribunals will need to work through: what evidentiary standard applies when no ITR exists at all. Insurers and their counsel, meanwhile, gain a more predictable basis for assessing exposure and negotiating settlements, since income figures anchored to ITRs are harder to dispute than income asserted through testimony alone.

Advocates handling pending claims should review whether their self-employed clients have filed ITRs for the year before the accident and, where gaps exist, consider whether supplementary documentation (GST returns, bank statements, trade licences) can support the claim under the framework the Court has now set out.

*This article is for general informational purposes and does not constitute legal advice. If you are pursuing or defending a motor accident compensation claim, consult a qualified litigation counsel about how this ruling applies to your facts.*`,
  },
  {
    site: 'law-elite-network',
    categorySlug: 'criminal-law',
    categoryName: 'Criminal Law',
    title: 'Supreme Court: Magistrates Need Not Record Pre-Charge Evidence Before Committing Sessions-Triable Complaint Cases',
    slug: 'supreme-court-crpc-244-pre-charge-evidence-committal',
    excerpt: 'The Supreme Court has held that a Magistrate is not required to record pre-charge evidence under CrPC Section 244 before committing a complaint case triable exclusively by a Sessions Court.',
    focusKeyword: 'CrPC Section 244 Supreme Court ruling',
    dateline: 'New Delhi',
    author: LAW_AUTHOR('Aisha Rahman'),
    scheduledAt: '2026-07-06T09:30:00Z',
    keyTakeaways: [
      'The Supreme Court ruled a Magistrate need not record pre-charge evidence under CrPC Section 244 before committing a complaint case triable exclusively by a Sessions Court.',
      "The Magistrate's role in such cases is limited to committal, not evidentiary adjudication.",
      'The ruling should reduce delay between filing and trial in Sessions-triable complaint cases.',
      'Defence counsel should expect to raise evidentiary and discharge arguments before the Sessions Court rather than at the Magistrate stage.',
    ],
    faq: [
      { question: 'Does this ruling apply to all criminal complaint cases?', answer: 'No — it applies specifically to complaint cases involving offences exclusively triable by a Court of Sessions.' },
      { question: 'What is Section 244 CrPC?', answer: 'It governs the procedure for recording prosecution evidence in warrant cases instituted otherwise than on a police report.' },
      { question: 'Does this mean the accused has no chance to contest evidence before trial?', answer: 'No — evidentiary and discharge arguments can still be raised, but before the Sessions Court rather than at the Magistrate’s pre-committal stage.' },
      { question: 'When was this ruling delivered?', answer: 'July 1, 2026, by the Supreme Court of India.' },
    ],
    markdown: `The Supreme Court has resolved a procedural question that has long divided trial courts handling complaint cases destined for the Sessions Court: whether a Magistrate must record evidence before committing such a case. Ruling on July 1, 2026, the Court held that a Magistrate is not required to record pre-charge evidence under Section 244 of the Code of Criminal Procedure, 1973, before committing a complaint case involving offences exclusively triable by a Court of Sessions.

## The procedural question

Under the CrPC framework, complaint cases (as opposed to police-initiated cases) ordinarily proceed through a Magistrate, who examines evidence before either discharging the accused or committing the matter for trial. Section 244 sets out the procedure for recording prosecution evidence in warrant cases instituted otherwise than on a police report. The question before the Court was whether this evidence-recording step is a mandatory precondition when the offence alleged is one that only a Sessions Court has jurisdiction to try — in which case the Magistrate's role is ultimately confined to committal, not adjudication.

## What the Court held — and why it matters

The Court held that where the offence is exclusively triable by a Court of Sessions, the Magistrate's function is limited to committal proceedings, and recording pre-charge evidence under Section 244 is not a mandatory precondition to that committal. In practical terms, this removes a procedural step that has, in some courts, been treated as compulsory — a step that could add months of delay to cases that were always going to be tried by a Sessions Court regardless of what the Magistrate found at the pre-charge stage.

For complainants in Sessions-triable matters, the ruling should shorten the path from filing to trial by removing an evidentiary hearing that added time without altering the case's ultimate forum. For defence counsel, it sharpens the distinction between the Magistrate's committal role and the Sessions Court's trial role — evidentiary and discharge arguments that might once have been raised before the Magistrate under Section 244 will now need to be made squarely before the Sessions Court instead.

## Practical impact for criminal litigators

Practitioners handling complaint cases in offences exclusively triable by Sessions Courts should recalibrate case strategy: expect faster committal, and plan to front-load evidentiary and discharge arguments for the Sessions Court stage rather than relying on a Magistrate-level evidence hearing that this ruling confirms is not required. Trial courts, for their part, gain clearer guidance on a procedural point that had produced inconsistent practice across jurisdictions.

*This article is for general informational purposes and does not constitute legal advice. If you are involved in a pending complaint case, consult a qualified criminal defence lawyer about how this ruling affects your matter.*`,
  },

  // ── Imperialpedia (global markets news) ───────────────────────────────
  {
    site: 'imperialpedia',
    categorySlug: 'markets',
    categoryName: 'Markets',
    title: "Oil Prices Sink to 2026 Lows as Iran-US Ceasefire Reopens the Strait of Hormuz",
    slug: 'oil-prices-2026-lows-iran-us-ceasefire-hormuz',
    excerpt: 'August WTI has fallen more than 30% from its May peak above $100 to around $69, as a US-Iran de-escalation eases fears of disruption through the Strait of Hormuz.',
    focusKeyword: 'oil prices Strait of Hormuz ceasefire 2026',
    htmlOnly: false,
    author: { name: 'Imperialpedia Markets Desk' },
    scheduledAt: '2026-07-04T13:00:00Z',
    keyTakeaways: [
      'August WTI has fallen from over $100/barrel in May to around $69, a decline of more than 30%.',
      'The drop follows a 60-day Iran-US de-escalation and increased tanker traffic through the Strait of Hormuz.',
      'Lower oil prices ease inflation pressure and reduce urgency for further near-term rate hikes from the ECB and Bank of Japan, both of which raised rates in June while oil was still elevated.',
      'The ceasefire is widely described as fragile — a reversal could send oil sharply higher with little warning.',
    ],
    faq: [
      { question: 'Why did oil prices fall so much?', answer: 'Reduced fear of supply disruption through the Strait of Hormuz as a US-Iran ceasefire took hold, unwinding the risk premium that had pushed prices above $100.' },
      { question: 'Does cheaper oil mean interest rates will fall?', answer: 'Not automatically — it reduces inflationary pressure and eases the case for further hikes, but central banks weigh many other factors.' },
      { question: 'How much of global oil transits the Strait of Hormuz?', answer: 'Roughly a fifth of global oil supply passes through this chokepoint, which is why disruption risk there has an outsized effect on prices.' },
      { question: 'Is $69 oil likely to last?', answer: 'That depends on whether the ceasefire holds; geopolitical-linked price moves can reverse quickly if the underlying situation changes.' },
    ],
    markdown: `Crude oil has given back its entire spring rally and then some. August WTI futures are trading near $69 a barrel, down more than 30% from the over-$100 peak hit in May, as a 60-day de-escalation between Washington and Tehran holds and tanker traffic through the Strait of Hormuz climbs back toward normal levels.

## What changed

The rally that pushed oil above $100 in May was built on fear: a real risk that shipping through Hormuz — the chokepoint for roughly a fifth of the world's oil — could be disrupted by direct conflict. That risk premium is now unwinding. Markets describe the current truce as fragile but durable enough to matter: Hormuz traffic has increased markedly since the de-escalation took hold, and the physical oil market is responding accordingly.

## Why it matters beyond the pump

A 30%+ pullback in crude from its highs ripples well past gas stations:

- **Inflation relief.** Energy costs are a direct input into headline inflation and an indirect one into transport and manufacturing costs economy-wide. Cheaper oil gives central banks more room to avoid over-tightening.
- **Central bank timing.** Both the ECB and the Bank of Japan raised rates in June, decisions made while oil was still elevated. With crude now meaningfully lower, the urgency behind further near-term tightening from either institution has eased — a timing mismatch worth watching as their next meetings approach.
- **Producer economics.** Lower prices squeeze margins for US shale producers and OPEC+ members alike, and could reopen the debate over supply discipline that higher prices had papered over.

## The risk that hasn't gone away

A ceasefire that holds on paper is not the same as a resolved conflict, and oil markets have been burned before by geopolitical de-escalations that reversed on short notice. The asymmetry cuts one way for now: a return to conflict would send oil sharply higher on very little notice, while the current calm requires the truce to keep holding, week after week, to keep prices anchored near $69.

## What to watch

Energy traders and macro investors alike are watching three signals: whether Hormuz tanker traffic keeps climbing toward pre-crisis levels, whether OPEC+ responds to lower prices with output adjustments at its next scheduled meeting, and whether the 60-day de-escalation window survives intact or shows early cracks. Any of the three could move crude sharply from current levels.

*This article is for general informational purposes and does not constitute investment advice. Commodity and geopolitical-linked markets can move sharply and unpredictably; consult a qualified financial adviser before making investment decisions.*`,
  },
  {
    site: 'imperialpedia',
    categorySlug: 'economy',
    categoryName: 'Economy',
    title: 'Markets Bet on a Second Fed Hike as Job Openings Data Surprises to the Upside',
    slug: 'fed-second-rate-hike-jolts-job-openings-2026',
    excerpt: 'Treasury yields jumped after a stronger-than-expected May JOLTS report, and futures markets now price higher odds of a second Fed rate hike this year.',
    focusKeyword: 'Fed rate hike JOLTS job openings 2026',
    htmlOnly: false,
    author: { name: 'Imperialpedia Markets Desk' },
    scheduledAt: '2026-07-05T13:00:00Z',
    keyTakeaways: [
      'Stronger-than-expected May JOLTS job openings data pushed Treasury yields sharply higher.',
      'Markets are now pricing higher odds of a second Fed rate hike this year, a reversal from earlier rate-cut expectations.',
      'The ECB and Bank of Japan both hiked in June, before oil prices fell more than 30% from their May peak — a timing mismatch worth watching.',
      'Higher-for-longer rate expectations typically support the dollar and pressure rate-sensitive equity sectors.',
    ],
    faq: [
      { question: 'What is JOLTS?', answer: 'The Job Openings and Labor Turnover Survey, a US Bureau of Labor Statistics report tracking job openings, hires, and separations — a key labor-market indicator the Fed watches closely.' },
      { question: 'Why does a strong labor market raise rate-hike odds?', answer: 'Tight labor markets tend to push wages higher, which can feed into broader inflation, giving the Fed more reason to keep policy tighter for longer.' },
      { question: 'Does this mean the Fed will definitely hike again?', answer: 'No — it reflects a shift in market-implied probabilities based on one data release; the Fed weighs a broad range of data before each decision.' },
      { question: 'How are the ECB and Bank of Japan connected to this story?', answer: 'Both hiked rates in June while oil was still elevated; oil has since fallen sharply, raising questions about whether their policy paths still fit the current cost environment.' },
    ],
    markdown: `US Treasury yields jumped after May job openings data came in stronger than economists expected, and futures markets are now pricing in meaningfully higher odds of a second Federal Reserve rate hike before year-end — a shift that would mark a reversal from the rate-cutting path many investors had expected heading into 2026.

## The data that moved markets

The Job Openings and Labor Turnover Survey (JOLTS) for May showed openings running ahead of consensus forecasts, a sign that labor demand remains firmer than the slowing-growth narrative that had dominated market pricing in recent months. Treasury yields rose sharply on the release as traders repriced the path of Fed policy, pulling forward expectations for additional tightening.

## Why one data point is moving so much

A single JOLTS report rarely moves markets this much on its own — its significance here comes from context. The Fed has spent recent meetings signaling data-dependence, watching for evidence that the labor market is cooling enough to justify holding or cutting rates without reigniting inflation. A stronger-than-expected openings number complicates that calculus: it suggests employers are still competing for workers, which historically puts upward pressure on wages and, eventually, prices.

## The ECB and BoJ already moved — on different information

Complicating the picture further, both the European Central Bank and the Bank of Japan delivered rate hikes of their own in June, decisions made while oil prices were still elevated near their 2026 highs. Crude has since fallen more than 30% from those levels amid an Iran-US de-escalation, meaning both central banks tightened into a cost environment that has since eased. That timing mismatch leaves the ECB and BoJ facing a similar question from a different angle: does softer energy inflation change the calculus for their next moves, even as the Fed considers hiking further on labor-market strength alone.

## What it means for markets

Higher-for-longer Fed policy typically supports the dollar, pressures rate-sensitive equity sectors (growth and tech names with valuations built on future earnings discounted at today's rates), and raises borrowing costs across mortgages, corporate debt, and consumer credit. The repricing already visible in Treasury yields is an early signal; equity markets, currency markets, and credit spreads typically take longer to fully digest a shift in rate expectations.

## What to watch next

The next major inputs are the full monthly jobs report (payrolls and unemployment rate, which carry more weight than JOLTS alone), the next Consumer Price Index release, and any commentary from Fed officials about how they're weighing labor-market strength against the recent pullback in energy costs. Markets will also be watching whether the ECB and BoJ signal any reconsideration of their June hikes now that oil has fallen.

*This article is for general informational purposes and does not constitute investment advice. Interest-rate expectations can shift quickly with new data; consult a qualified financial adviser before making investment decisions based on rate forecasts.*`,
  },
  {
    site: 'imperialpedia',
    categorySlug: 'markets',
    categoryName: 'Markets',
    title: "Yen Slides to a 40-Year Low Against the Dollar Despite Bank of Japan's June Hike",
    slug: 'yen-40-year-low-dollar-boj-hike-2026',
    excerpt: 'USD/JPY has reached its highest level in roughly 40 years even after a Bank of Japan rate hike, as the persistent Fed-BoJ policy gap keeps the yen under pressure.',
    focusKeyword: 'yen 40 year low dollar USD/JPY 2026',
    htmlOnly: false,
    author: { name: 'Imperialpedia Markets Desk' },
    scheduledAt: '2026-07-06T13:00:00Z',
    keyTakeaways: [
      'USD/JPY has reached its highest level in roughly 40 years despite a Bank of Japan rate hike in June.',
      'The persistent Fed-BoJ policy rate gap, not the June hike itself, is the primary driver of continued yen weakness.',
      'The euro has also weakened against major currencies after an inflation surprise reduced expectations for further ECB rate cuts.',
      'A weak yen helps Japanese exporters but raises import costs for consumers and businesses.',
    ],
    faq: [
      { question: 'Why did the yen keep falling after the Bank of Japan raised rates?', answer: 'Because the rate gap between Japan and the US remains wide; one hike narrows it only slightly, and markets are now pricing higher odds of a further Fed hike, which would widen the gap again.' },
      { question: 'Is a weak yen good or bad for Japan?', answer: 'Mixed — it benefits exporters through more competitive pricing abroad but raises costs for imported goods and energy, adding to domestic inflation.' },
      { question: 'Why is the euro also weakening if the ECB is expected to cut less?', answer: "Currency moves reflect relative strength; dollar demand tied to US rate expectations can outweigh a currency's own fundamentals." },
      { question: 'Could Japan intervene to support the yen?', answer: 'Japanese authorities have intervened in currency markets during past periods of extreme yen weakness; whether they do so again depends on how far and fast the move continues.' },
    ],
    markdown: `The Japanese yen has weakened past a milestone few traders expected to see again: USD/JPY has pushed to its highest level in roughly 40 years, extending a depreciation that a Bank of Japan rate hike in June failed to reverse. The euro is also under pressure against major currencies, though for a different reason — an inflation surprise that has cooled expectations for further European Central Bank rate cuts this year.

## Why a BoJ hike didn't stop the slide

Conventional currency logic says raising interest rates should support a currency, by making yen-denominated assets more attractive relative to lower-yielding alternatives. That the yen kept falling after the BoJ's June hike says less about the decision itself than about the scale of the gap it's working against: Japan's policy rate remains far below the Federal Reserve's, and a single hike narrows that gap only marginally. With markets now pricing higher odds of a second Fed hike this year on the back of strong labor-market data, the yield differential that has driven yen weakness for years shows little sign of closing.

## The euro's separate story

The euro's weakness has a different driver: an inflation surprise that reduced markets' expectations for another ECB rate cut this year. Fewer expected cuts would typically support a currency by keeping yields higher for longer — but the euro has depreciated against major currencies regardless, reflecting how currency moves often reflect relative strength (in this case, dollar demand tied to US rate expectations) as much as a currency's own fundamentals.

## Who feels a weak yen

A 40-year-low yen cuts differently depending on where you sit:

- **Japanese exporters** benefit from a competitive currency that makes their goods cheaper abroad, a dynamic that has supported Japanese equities through prior periods of yen weakness.
- **Japanese consumers and importers** face higher costs for imported energy, food, and materials, adding to domestic inflation pressure the BoJ is trying to manage even as it hikes rates.
- **Global investors** watch USD/JPY as a barometer of relative monetary-policy stance between the world's largest and third-largest economies — sharp, sustained moves here tend to ripple into carry trades and broader currency positioning.

## What to watch next

The key question is whether the yield gap between the Fed and the BoJ narrows or widens from here. A second Fed hike, now more likely after recent labor-market data, would widen it further and could extend yen weakness. Conversely, any signal that the BoJ is prepared to move faster than a single June hike — or that Japanese officials intervene directly in currency markets, as they have at past extremes — could reverse the trend quickly. Traders are also watching whether the euro's inflation-driven repricing continues or proves to be a one-data-point event.

*This article is for general informational purposes and does not constitute investment advice. Currency markets can move sharply on policy and data surprises; consult a qualified financial adviser before making investment decisions involving foreign exchange.*`,
  },
];
