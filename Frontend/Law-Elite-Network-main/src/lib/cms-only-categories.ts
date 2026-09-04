/**
 * Categories created directly in the CMS (not part of the original 8 bundled
 * practice areas in docs/seed-data.json, and not in law-service's /categories
 * API). Shared by src/app/[categorySlug]/page.tsx (masthead H1/description +
 * JSON-LD) and src/app/[categorySlug]/layout.tsx (generateMetadata fallback
 * when law-service doesn't know the category), so a hub's name/description/
 * SEO title only need to be defined once.
 *
 * `pillarTitle`/`metaTitle`/`metaDescription` are optional overrides for a hub
 * that also serves as a written pillar/"Complete Guide" page at its own URL
 * (currently only maritime-offshore-injury-law) -- everywhere else falls back
 * to `name`/`description`.
 */
export interface CmsOnlyCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Rendered as HTML in the masthead when present (pillar hub content). */
  descriptionHtml?: string;
  pillarTitle?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export const CMS_ONLY_CATEGORIES: Record<string, CmsOnlyCategory> = {
  'maritime-offshore-injury-law': {
    id: 'cms-cat-maritime-offshore-injury-law',
    name: 'Maritime & Offshore Injury Law',
    slug: 'maritime-offshore-injury-law',
    description: 'Guides covering maritime and offshore injury law, including the Jones Act, LHWCA, OCSLA, and general maritime law claims.',
    pillarTitle: "Maritime & Offshore Injury Law: Complete Guide",
    metaTitle: "Maritime & Offshore Injury Law: Complete Guide",
    metaDescription: 'A complete guide to maritime and offshore injury law -- the Jones Act, general maritime law, LHWCA, and OCSLA -- covering who these laws protect, how claims work, and where to find related guides.',
    descriptionHtml: `
<p>Workers and others injured on navigable waters or in connection with maritime and offshore activity are often governed by a distinct body of federal law rather than the ordinary state workers' compensation or negligence rules that apply to most land-based jobs. This hub is a starting point for understanding that body of law -- who it covers, which statutes and doctrines typically apply, and how a maritime or offshore injury claim generally differs from a standard personal injury case. It is general legal information, not legal advice about any specific injury.</p>

<h2>The Main Sources of Maritime & Offshore Injury Law</h2>
<p>Several distinct federal frameworks can apply to a maritime or offshore injury, often depending on the injured person's job, the location of the accident, and the type of vessel or structure involved:</p>
<ul>
<li><strong>The Jones Act</strong> (46 U.S.C. &sect; 30104) &mdash; gives an injured "seaman" the right to sue their employer for negligence, unlike most land-based employees who are limited to workers' compensation. See our guide to <a href="/jones-act-seamans-injury-rights">Jones Act &amp; seaman's injury rights</a>.</li>
<li><strong>General maritime law</strong> &mdash; a body of federal common law covering doctrines such as unseaworthiness and maintenance and cure, which can apply alongside or instead of the Jones Act. See <a href="/jones-act-vs-general-maritime-law">Jones Act vs. general maritime law</a> and <a href="/maintenance-and-cure-explained">maintenance and cure explained</a>.</li>
<li><strong>The Longshore and Harbor Workers' Compensation Act (LHWCA)</strong> (33 U.S.C. &sect; 901 et seq.) &mdash; a federal workers' compensation system for maritime workers who are not seamen, such as many longshore and harbor workers injured on or near navigable waters.</li>
<li><strong>The Outer Continental Shelf Lands Act (OCSLA)</strong> (43 U.S.C. &sect; 1331 et seq.) &mdash; extends certain federal law, including in many cases the LHWCA, to workers injured on fixed offshore platforms on the Outer Continental Shelf, such as many oil and gas installations.</li>
</ul>
<p>Which of these frameworks applies -- and sometimes more than one can be relevant to the same injury -- depends heavily on facts like the injured person's job duties and connection to a vessel, where the accident happened, and what kind of structure or vessel was involved. That threshold question is often one of the first things an offshore injury lawyer evaluates.</p>

<h2>Who This Area of Law Covers</h2>
<p>Maritime and offshore injury law can potentially apply to commercial vessel crew members, offshore oil and gas workers, dockworkers and longshore workers, harbor workers, and others whose work has a substantial connection to navigable waters or traditional maritime activity. Guides throughout this hub address specific roles and accident types in more depth, including <a href="/oil-rig-injury-lawyer">offshore drilling and oil rig injuries</a> and <a href="/houston-offshore-accident-attorney">region-specific guidance for the Gulf Coast</a>.</p>

<h2>How These Claims Differ From a Typical Injury Case</h2>
<p>Maritime and offshore injury claims often follow different rules than a standard car accident or slip-and-fall case: different deadlines, different available benefits (such as <a href="/maintenance-and-cure-explained">maintenance and cure</a>), different standards of liability, and, in some cases, different courts. Our guides on <a href="/offshore-injury-settlement-value">how offshore settlements are calculated</a>, <a href="/causes-of-offshore-oil-rig-accidents">common causes of offshore accidents</a>, and <a href="/offshore-accident-statute-of-limitations">applicable filing deadlines</a> go into these differences in more detail.</p>

<h2>Explore This Hub</h2>
<p>The guides below cover offshore and maritime injury lawyers, oil rig accidents, Jones Act claims, and the process and deadlines involved in these cases. For related passenger-vessel and cruise ship injury topics, see the <a href="/cruise-ship-passenger-vessel-accidents">Cruise Ship &amp; Passenger Vessel Accidents</a> hub. For general personal injury topics that apply across practice areas -- contingency fees, choosing a lawyer, and the statute of limitations generally -- see <a href="/what-is-a-personal-injury-lawyer">What Is a Personal Injury Lawyer?</a> and the related guides linked from it.</p>

<p><em>This page provides general legal information about maritime and offshore injury law and does not constitute legal advice for any specific situation. Laws and their application vary by jurisdiction and by the specific facts involved.</em></p>
`.trim(),
  },
  'cruise-ship-passenger-vessel-accidents': {
    id: 'cms-cat-cruise-ship-passenger-vessel-accidents',
    name: 'Cruise Ship & Passenger Vessel Accidents',
    slug: 'cruise-ship-passenger-vessel-accidents',
    description: 'Guides covering cruise ship and passenger vessel accident claims, including passenger injuries, cruise ticket contracts, and maritime law issues specific to cruise travel.',
    descriptionHtml: `
<p>A cruise ship injury claim generally works differently from an ordinary personal injury case, because a cruise ticket is itself a contract that can dictate where a passenger is allowed to sue, how quickly they have to act, and what a cruise line's legal duties actually are. This hub explains those differences and links to our guides on specific cruise lines, ports, and accident types. It is general legal information, not legal advice about any specific incident.</p>

<h2>Why the Ticket Contract Matters</h2>
<p>Nearly every major cruise line's passenger ticket contract includes a forum-selection clause naming the single court where a lawsuit must be filed — for most large lines operating out of U.S. ports, that's the U.S. District Court for the Southern District of Florida, in Miami, regardless of where the passenger boarded or lives. The U.S. Supreme Court upheld the enforceability of these clauses in <em>Carnival Cruise Lines, Inc. v. Shute</em>, 499 U.S. 585 (1991), so a passenger who wants to sue almost always has to do so where the contract requires. See our guide on <a href="/cruise-ship-accident-lawyer-miami">pursuing a claim in Miami federal court</a> for what that involves in practice.</p>

<h2>Shorter Deadlines and Notice Requirements</h2>
<p>Cruise ticket contracts typically shorten the deadline to file a lawsuit and separately require written notice of an injury to the cruise line within a much narrower window — often just weeks to a few months — well under the one-to-several-year statute of limitations that applies to an ordinary personal injury claim on land. Missing either deadline can bar a claim entirely, which is why identifying the specific terms early matters more here than in a typical injury case. Our guide comparing <a href="/cruise-line-accident-claims-by-brand">claims requirements across cruise lines</a> looks at how individual brands' contracts handle this.</p>

<h2>Federal Safety and Reporting Requirements</h2>
<p>The Cruise Vessel Security and Safety Act of 2010 (CVSSA) imposes specific federal safety and reporting requirements on large passenger vessels calling at U.S. ports, including minimum railing heights, peepholes on cabin doors, dedicated security staff, and a duty for the cruise line to report certain serious crimes — including homicide, suspicious death, and sexual assault — to the FBI. Separately, the Federal Maritime Commission requires cruise lines departing from U.S. ports to demonstrate financial responsibility for passenger injury and for a cancelled voyage. These federal rules apply alongside, not instead of, the general maritime negligence principles that govern injuries at sea.</p>

<h2>Liability for Shore Excursions</h2>
<p>Whether a cruise line can be held responsible for an injury during a shore excursion often turns on whether the excursion operator was the cruise line's own employee or an independent contractor the line merely arranged and marketed — cruise lines frequently argue the latter to limit their own liability, and the ticket contract's fine print on this point matters. See our guide on <a href="/tender-boat-excursion-dinner-cruise-accidents">tender boat, excursion, and dinner cruise accidents</a> for how that distinction plays out.</p>

<h2>Key Terms</h2>
<p><strong>Forum selection clause</strong> — a ticket-contract term fixing the one court where a claim must be filed. <strong>Notice of claim</strong> — a written notice, often required within weeks of an incident, separate from and earlier than the deadline to file suit itself. <strong>Maritime law</strong> — the body of federal law governing vessel operations and injuries on navigable waters, which applies alongside a passenger's ticket contract.</p>

<h2>Related Legal Areas</h2>
<p>For claims by maritime workers rather than passengers — a different legal framework entirely — see our <a href="/maritime-offshore-injury-law">Maritime &amp; Offshore Injury Law</a> hub. For contingency fees, choosing a lawyer, and deadlines that apply across accident types generally, see <a href="/what-is-a-personal-injury-lawyer">What Is a Personal Injury Lawyer?</a></p>

<h2>Explore the Guides</h2>
<p>The guides below cover pursuing a claim in specific cities and against specific cruise lines, and what happens during tender boat and shore excursion incidents.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://www.fmc.gov/" target="_blank" rel="noopener noreferrer">Federal Maritime Commission (FMC)</a> — passenger vessel financial responsibility requirements for cruise lines operating from U.S. ports.</li>
<li><a href="https://www.uscg.mil/" target="_blank" rel="noopener noreferrer">United States Coast Guard</a> — large passenger vessel safety oversight and incident reporting.</li>
<li><a href="https://www.fbi.gov/how-we-can-help-you/victim-services/additional-resources/crime-victims-on-cruise-ships" target="_blank" rel="noopener noreferrer">FBI — Crime Victims on Cruise Ships</a> — how CVSSA crime-reporting requirements work for passengers.</li>
</ul>

<p><em>This page provides general legal information about cruise ship and passenger vessel accident claims and does not constitute legal advice for any specific situation. Ticket contract terms vary by cruise line and change over time — read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },
  'personal-injury-lawyer': {
    id: 'cms-cat-personal-injury-lawyer',
    name: 'Personal Injury Law',
    slug: 'personal-injury-lawyer',
    description: 'Educational guides on personal injury law, including what personal injury lawyers do, how contingency fees and legal costs work, how to choose and work with an attorney, statutes of limitations, free legal aid resources, and maritime and accident-law terminology.',
    descriptionHtml: `
<p>Personal injury law covers claims for harm caused by another party's negligence or wrongful conduct — everything from a slip-and-fall to a car crash to a maritime injury — and the concepts that apply across nearly all of them: negligence, damages, contingency fees, and filing deadlines. This hub explains those cross-cutting concepts; for accident-type-specific rules, see the related hubs linked below. It is general legal information, not legal advice about any specific injury.</p>

<h2>How a Personal Injury Claim Typically Works</h2>
<p>Most personal injury claims move through a similar sequence: the injury and its cause are documented, medical treatment continues, and a claim is negotiated with an insurance company — sometimes settling before any lawsuit is filed, sometimes escalating to litigation if the parties can't agree on liability or value. Our guide on <a href="/what-is-a-personal-injury-lawyer">what a personal injury lawyer does</a> walks through that process and when hiring one actually helps.</p>

<h2>Comparative and Contributory Negligence</h2>
<p>Most U.S. states use some form of comparative negligence, reducing an injured person's compensation by their own percentage of fault rather than barring recovery outright. A small minority of jurisdictions — Alabama, Maryland, North Carolina, Virginia, and the District of Columbia — instead apply contributory negligence, under which a plaintiff found even slightly at fault can be barred from recovering anything. Which rule applies can be the difference between a full recovery and none, and it's determined entirely by the state where the injury occurred.</p>

<h2>Contingency Fees and the Cost of Hiring a Lawyer</h2>
<p>Most personal injury lawyers work on a contingency-fee basis, taking a percentage of any settlement or verdict rather than charging by the hour, with no fee generally owed if there's no recovery. That arrangement is what makes representation accessible regardless of a client's ability to pay upfront, but it also means the fee percentage and how case costs (filing fees, expert witnesses, records) are handled are worth understanding before signing. Our guides on <a href="/contingency-fee-agreements-explained">how contingency fees work</a> and <a href="/how-much-does-a-lawyer-cost">how much a lawyer actually costs</a> go into the specifics, and <a href="/how-to-choose-a-personal-injury-lawyer">how to choose a personal injury lawyer</a> covers what to evaluate beyond the fee itself.</p>

<h2>Statutes of Limitations Vary by State</h2>
<p>There is no single nationwide deadline to file a personal injury lawsuit — each state sets its own statute of limitations, commonly (but not universally) somewhere between one and six years depending on the state and the type of claim, and missing it typically bars the claim permanently regardless of its merits. Some circumstances, such as the injured person being a minor, can pause or extend the deadline. Our guide on the <a href="/statute-of-limitations-in-the-us">statute of limitations in the U.S. by state</a> breaks down how to find the deadline that actually applies.</p>

<h2>When Legal Aid Is an Option</h2>
<p>Not every injured person can afford — or needs — a private attorney. Free and low-cost legal help exists through legal aid organizations, law school clinics, and bar association referral services, particularly for people who meet income eligibility requirements. Our guide to <a href="/legal-aid-and-free-legal-help-in-the-us">legal aid and free legal help in the U.S.</a> covers where to start looking.</p>

<h2>Key Terms</h2>
<p><strong>Negligence</strong> — a failure to exercise the care a reasonably prudent person would have exercised, resulting in harm to someone else. <strong>Damages</strong> — the compensation sought or awarded, including economic damages (medical bills, lost wages) and non-economic damages (pain and suffering). <strong>Statute of limitations</strong> — the deadline by which a lawsuit must be filed. A fuller glossary of maritime- and accident-law-specific terminology is in our <a href="/maritime-offshore-accident-law-glossary">Maritime &amp; Accident Law Glossary</a>.</p>

<h2>Related Legal Areas</h2>
<p>For injuries to maritime workers under federal frameworks like the Jones Act, see <a href="/maritime-offshore-injury-law">Maritime &amp; Offshore Injury Law</a>. For injuries aboard a cruise ship, where a passenger's ticket contract adds its own rules, see <a href="/cruise-ship-passenger-vessel-accidents">Cruise Ship &amp; Passenger Vessel Accidents</a>.</p>

<h2>Explore the Guides</h2>
<p>The guides below cover what a personal injury lawyer does, contingency fees, choosing an attorney, filing deadlines, free legal aid, and accident-law terminology.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://www.americanbar.org/groups/public_education/resources/law_issues_for_consumers/" target="_blank" rel="noopener noreferrer">American Bar Association — Legal Issues for Consumers</a> — consumer-facing guidance on working with a lawyer and understanding legal costs.</li>
<li><a href="https://www.lsc.gov/" target="_blank" rel="noopener noreferrer">Legal Services Corporation (LSC)</a> — the largest funder of civil legal aid for low-income Americans, with a directory of local grantee organizations.</li>
</ul>

<p><em>This page provides general legal information about personal injury law and does not constitute legal advice for any specific situation. Laws vary significantly by state and change over time — read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },
  'boating-accidents': {
    id: 'cms-cat-boating-accidents',
    name: 'Boating Accidents',
    slug: 'boating-accidents',
    description: 'Guides covering boating accident claims, including liability, insurance, statutes of limitations, and what to do after an accident on the water.',
    descriptionHtml: `
<p>Boating accidents — collisions, capsizings, falls overboard, propeller strikes, and similar incidents involving a boat, jet ski, or other watercraft — sit at the intersection of federal boating-safety rules, U.S. Coast Guard reporting requirements, and state boating law, which varies more than many people expect. This hub explains how a boating accident claim generally works and links to our guides on liability, deadlines, and what to do right after an incident. It is general information, not legal advice about any specific accident.</p>

<h2>What to Do Immediately After an Accident</h2>
<p>The first hours after a boating accident affect both safety and any later claim: checking for injuries, exchanging information, and — where the incident meets state or federal reporting thresholds (generally involving death, disappearance, serious injury, or a set amount of property damage) — filing an official boating accident report. Our guide on <a href="/what-to-do-after-a-boating-accident">what to do after a boating accident</a> walks through the practical steps, including preserving evidence and notifying insurers.</p>

<h2>Liability and Fault on the Water</h2>
<p>Unlike car accidents, where every U.S. state has settled fault or no-fault rules, liability in a boating accident can turn on the operator's conduct (speed, lookout, alcohol use), the vessel owner's responsibility for who they let operate it, and in some cases the manufacturer, if a mechanical or design defect contributed. Federal Navigation Rules establish right-of-way on the water and are often central to establishing fault. See our guide on <a href="/boating-accident-liability-and-fault">who is liable in a boating accident</a> for how these pieces typically fit together.</p>

<h2>Deadlines and State Variation</h2>
<p>There is no single nationwide statute of limitations for boating accident claims — the filing deadline depends on the state, the type of claim (personal injury, wrongful death, or property damage), and sometimes on federal maritime law if the accident occurred on navigable waters. Missing the applicable deadline typically bars the claim entirely. Our guide on the <a href="/boating-accident-statute-of-limitations">boating accident statute of limitations</a> explains why there's no single answer and how to find the deadline that actually applies.</p>

<h2>Key Terms</h2>
<p><strong>Navigable waters</strong> — broadly, waters usable for interstate or foreign commerce, which can trigger federal maritime jurisdiction. <strong>BUI</strong> — boating under the influence, regulated similarly to DUI in most states. <strong>Negligence</strong> — the failure to operate with the care a reasonable boat operator would use, the usual legal basis for a liability claim.</p>

<h2>Related Legal Areas</h2>
<p>Boating accidents on recreational, personally owned vessels are generally handled differently from injuries to commercial maritime workers or cruise ship passengers, which involve their own federal statutory frameworks. See <a href="/maritime-offshore-injury-law">Maritime &amp; Offshore Injury Law</a> and <a href="/cruise-ship-passenger-vessel-accidents">Cruise Ship &amp; Passenger Vessel Accidents</a> for those areas, and <a href="/what-is-a-personal-injury-lawyer">Personal Injury Law</a> for concepts that apply across accident types generally.</p>

<h2>Explore the Guides</h2>
<p>The guides below cover what to do immediately after an accident, how liability and fault are typically assessed, filing deadlines, and what a boating accident lawyer does.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://www.uscgboating.org/" target="_blank" rel="noopener noreferrer">U.S. Coast Guard — Boating Safety Division</a> — federal recreational boating safety standards, accident reporting requirements, and statistics.</li>
<li><a href="https://www.nasbla.org/" target="_blank" rel="noopener noreferrer">National Association of State Boating Law Administrators (NASBLA)</a> — state-by-state boating law resources and model legislation.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general legal information about boating accident claims and does not constitute legal advice for any specific situation. Laws vary by state and change over time — read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },
  'car-accidents': {
    id: 'cms-cat-car-accidents',
    name: 'Car Accidents',
    slug: 'car-accidents',
    description: 'Guides covering car accident claims, including how car accident lawyers work and how to choose one.',
    descriptionHtml: `
<p>Car accidents are one of the most common reasons people first look for a lawyer, but "car accident law" isn't a single body of law — fault rules, insurance requirements, and filing deadlines are set state by state (and differ again outside the U.S.), so what applies to a claim depends heavily on where the crash happened. This hub is a starting point for understanding how car accident claims generally work and where to find a lawyer if you need one; it is general information, not legal advice about any specific crash.</p>

<h2>How a Car Accident Claim Typically Works</h2>
<p>Most car accident claims move through a similar sequence regardless of jurisdiction: the crash is reported to police and insurers, injuries and property damage are documented, medical treatment continues, and then a claim is negotiated with an insurance company — sometimes settling before any lawsuit is filed, sometimes escalating to litigation if the parties can't agree on liability or the value of the claim. A car accident lawyer's role across that process is explained in our guide on <a href="/what-does-a-car-accident-lawyer-do">what a car accident lawyer does</a>.</p>

<h2>Why the State (or Country) Matters</h2>
<p>Two features of the law vary enormously by jurisdiction and can change the outcome of an otherwise identical crash: <strong>fault rules</strong> — some U.S. states are "at-fault," where the driver responsible for the crash (or their insurer) pays; others are "no-fault," where each driver's own Personal Injury Protection (PIP) coverage pays for their own injuries regardless of fault, at least up to a point — and <strong>comparative or contributory negligence rules</strong>, which determine whether, and how much, a driver who was partly at fault can still recover. There is no single national rule for either, so a claim should always be evaluated under the law of the specific state (or country) where the crash occurred.</p>

<h2>Choosing a Lawyer</h2>
<p>Because most car accident lawyers work on contingency (no fee unless they recover money) and free initial consultations are standard, the real evaluation questions are usually about experience with similar cases, communication style, settlement-versus-trial track record, and how the fee agreement is structured. Our guide on <a href="/best-car-accident-lawyer">how to find the best car accident lawyer</a> walks through what to actually compare.</p>

<h2>Related Legal Areas</h2>
<p>Car accident claims sit inside the broader field of personal injury law. For the parts of that process that apply across accident types — contingency fees, statutes of limitations, and how to work with a lawyer generally — see our <a href="/what-is-a-personal-injury-lawyer">Personal Injury Law</a> hub. Crashes involving boats or watercraft instead of cars follow a different set of rules; see <a href="/boating-accidents">Boating Accidents</a>.</p>

<h2>Explore the Guides</h2>
<p>The guides below cover what a car accident lawyer actually does and how to evaluate one. This is a newer section of the site, and we'll add more car-accident-specific guides — on topics like fault determination, dealing with insurance adjusters, and filing deadlines — as they're published.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://www.nhtsa.gov/" target="_blank" rel="noopener noreferrer">National Highway Traffic Safety Administration (NHTSA)</a> — federal crash data, vehicle safety standards, and recall information.</li>
<li><a href="https://www.naic.org/" target="_blank" rel="noopener noreferrer">National Association of Insurance Commissioners (NAIC)</a> — how auto insurance is regulated state by state in the U.S.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general legal information about car accident claims and does not constitute legal advice for any specific situation. Laws vary by state and country and change over time — read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },
  'us-law-and-constitution': {
    id: 'cms-cat-us-law-and-constitution',
    name: 'U.S. Law & Constitution',
    slug: 'us-law-and-constitution',
    description: 'Explainers on how the U.S. Constitution, federal lawmaking, and the broader American legal system work.',
    descriptionHtml: `
<p>The U.S. legal system rests on a written Constitution that creates three branches of government, divides power between the federal government and the states, and sets out the process by which a bill becomes law. This hub is a plain-language starting point for understanding that structure — not a substitute for reading the Constitution itself or consulting a lawyer about how it applies to a specific situation.</p>

<h2>The Three Branches and How Laws Are Made</h2>
<p>Article I of the Constitution vests legislative power in Congress (the House of Representatives and the Senate), Article II vests executive power in the President, and Article III vests judicial power in the Supreme Court and the lower federal courts Congress establishes. A federal bill generally must pass both chambers of Congress in identical form and then be signed by the President — or, if vetoed, be repassed by a two-thirds vote in each chamber — before it becomes law. Our guide on <a href="/us-constitution-how-laws-are-made">the U.S. Constitution and how federal laws are made</a> walks through that process from committee to signature.</p>

<h2>Federal, State, and Local Law Together</h2>
<p>The United States doesn't have one legal system — it has more than fifty overlapping ones: federal law applies nationwide on matters within federal power, each state has its own constitution, legislature, and courts, and cities and counties add local ordinances on top. Which law governs a given question depends on which government has authority over that subject matter, and more than one level can apply to the same situation at once. Our guide on <a href="/how-the-us-legal-system-works">how the U.S. legal system works</a> covers how these layers relate, plus the basics of civil versus criminal cases and the role of courts, judges, and juries.</p>

<h2>Why "How Many Laws Are There?" Doesn't Have a Simple Answer</h2>
<p>People often expect a single number, but there is no authoritative count of "all U.S. laws": federal statutes, federal regulations, and the statutes and regulations of fifty states and thousands of local governments would all need to be counted using a consistent definition of "a law" that doesn't really exist. Our guide on <a href="/how-many-laws-are-there-in-the-us">how many laws there are in the U.S.</a> explains why the commonly repeated figures don't hold up and what can actually be measured.</p>

<h2>Key Terms</h2>
<p><strong>Statute</strong> — a law passed by a legislature. <strong>Precedent / stare decisis</strong> — the principle that courts generally follow prior decisions on the same legal question. <strong>Judicial review</strong> — the power of courts, established in <em>Marbury v. Madison</em> (1803), to strike down laws that conflict with the Constitution. <strong>Codified law</strong> — statutes organized by subject into a code, such as the U.S. Code.</p>

<h2>Related Legal Areas</h2>
<p>The First Amendment's religion clauses and how U.S. courts apply the Constitution to unusual legal disputes are covered in more depth in our <a href="/religion-law-and-weird-laws">Religion, Law &amp; Weird Laws</a> hub. For how lawyers are trained and licensed within this system, see <a href="/legal-education-and-history">Legal Education &amp; History</a>.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://www.archives.gov/founding-docs/constitution" target="_blank" rel="noopener noreferrer">National Archives — The Constitution of the United States</a> — the full, official text.</li>
<li><a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer">Congress.gov</a> — the official record of federal bills, statutes, and legislative activity.</li>
<li><a href="https://www.uscourts.gov/" target="_blank" rel="noopener noreferrer">United States Courts (uscourts.gov)</a> — how the federal court system is organized and how cases move through it.</li>
<li><a href="https://www.govinfo.gov/" target="_blank" rel="noopener noreferrer">GovInfo (U.S. Government Publishing Office)</a> — official federal statutes, regulations, and the U.S. Code.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general legal and civic information and does not constitute legal advice. Read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },
  'religion-law-and-weird-laws': {
    id: 'cms-cat-religion-law-and-weird-laws',
    name: 'Religion, Law & Weird Laws',
    slug: 'religion-law-and-weird-laws',
    description: 'Guides on religious law in the U.S. legal system, plus a look at unusual and rarely enforced state and local laws.',
    descriptionHtml: `
<p>This hub covers two related but distinct topics: how religious law and religious practice interact with the U.S. legal system, and a fact-checked look at unusual state and local laws. Both sit at the edge of what people commonly assume about American law, which is exactly why they benefit from a careful, source-checked explanation rather than a repeat of viral claims. This is general legal information, not legal advice.</p>

<h2>Religious Law Within the U.S. Legal System</h2>
<p>The First Amendment's Establishment Clause and Free Exercise Clause together shape how far religious law and practice can operate within the American legal system: courts generally cannot establish or favor a religion, but individuals and religious communities have broad freedom to practice their faith, including resolving disputes through private religious arbitration or tribunals — as long as the outcome doesn't require a court to violate someone's constitutional rights or enforce something contrary to public policy. Our guides on <a href="/is-sharia-law-legal-in-the-united-states">whether Sharia law is legal in the United States</a> and <a href="/muslim-law-and-legal-practices-in-the-us">Muslim law and legal practices in the U.S.</a> look at how this plays out in practice — including where religious arbitration is enforceable and where U.S. courts draw the line.</p>

<h2>"Weird" and Rarely Enforced Laws</h2>
<p>Lists of "crazy" state laws circulate constantly online, and a large share of them are exaggerated, outdated, or simply made up. Some genuinely unusual statutes and municipal ordinances do exist — often because a state or city legislature never repealed a narrow, once-relevant rule — but confirming one is real requires checking the current state code or municipal ordinance, not just a listicle. Our guide on <a href="/weird-silly-crazy-laws-in-the-usa">weird, silly, and crazy laws in the USA</a> distinguishes verified, still-on-the-books statutes from popular claims that don't check out.</p>

<h2>Key Terms</h2>
<p><strong>Establishment Clause</strong> — the First Amendment provision barring the government from establishing an official religion or favoring one religion over another. <strong>Free Exercise Clause</strong> — the companion provision protecting the right to practice (or not practice) a religion. <strong>Religious arbitration</strong> — private dispute resolution conducted under religious law, which U.S. courts can enforce like any other arbitration agreement if it meets ordinary contract and public-policy requirements. <strong>Dead-letter law</strong> — a statute still technically in force but no longer enforced in practice.</p>

<h2>Related Legal Areas</h2>
<p>For the constitutional structure behind these questions — including how the First Amendment fits into the Constitution as a whole — see our <a href="/us-law-and-constitution">U.S. Law &amp; Constitution</a> hub.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://constitution.congress.gov/browse/essay/amdt1-5/ALDE_00000039/" target="_blank" rel="noopener noreferrer">Constitution Annotated (Library of Congress)</a> — the relationship between the Establishment and Free Exercise Clauses.</li>
<li><a href="https://www.uscourts.gov/about-federal-courts/educational-resources/about-educational-outreach/activity-resources/first-amendment-and-religion" target="_blank" rel="noopener noreferrer">United States Courts — The First Amendment and Religion</a> — federal judiciary educational resource.</li>
<li><a href="https://www.justice.gov/jm/1-15000-respect-religious-liberty-0" target="_blank" rel="noopener noreferrer">U.S. Department of Justice — Justice Manual, Respect for Religious Liberty</a>.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general legal information and does not constitute legal advice. Read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },
  'legal-education-and-history': {
    id: 'cms-cat-legal-education-and-history',
    name: 'Legal Education & History',
    slug: 'legal-education-and-history',
    description: 'Guides on U.S. legal education and the history of American law enforcement and legal institutions.',
    descriptionHtml: `
<p>This hub covers two related but distinct topics: how U.S. legal education and attorney licensing actually work today, and the history of American law enforcement and legal institutions. Both help explain how the modern American legal profession and justice system came to look the way they do. This is general educational information, not legal or career advice.</p>

<h2>How U.S. Legal Education Works</h2>
<p>Becoming a lawyer in the U.S. generally requires a bachelor's degree, a Juris Doctor (J.D.) from a law school — most states require the school to be accredited by the American Bar Association (ABA) — and passing the bar exam in the state where the person intends to practice, along with a character-and-fitness review. Law school rankings, which weigh factors like bar passage rates, employment outcomes, and selectivity, are widely used but methodology varies between publishers and shouldn't be treated as a single objective ranking. Our guide on <a href="/best-law-schools-in-the-usa">evaluating the best law schools in the USA</a> covers ABA accreditation, how rankings actually work, and what to weigh beyond a school's rank.</p>

<h2>The History of American Law Enforcement</h2>
<p>Modern American policing developed unevenly through the 19th and early 20th centuries, growing out of a mix of English common-law traditions, city watch systems, county sheriff offices (an older office than municipal police departments in much of the country), and, in parts of the country, more troubling roots including slave patrols. By the early 1900s, city police departments and county sheriffs used patrol and investigation methods that look primitive by modern standards but set the pattern for a lot of what followed. Our guide on <a href="/law-enforcement-in-1900s-america">law enforcement in 1900s America</a> looks at that period specifically — how departments were organized, how they investigated crime, and how the system evolved from there.</p>

<h2>Why This History Matters</h2>
<p>Understanding how legal education and law enforcement developed helps explain present-day features of the system — from why the bar exam looks the way it does to why policing is organized locally (city and county) rather than as a single national force in most of the country. For the constitutional framework both sit inside, see our <a href="/us-law-and-constitution">U.S. Law &amp; Constitution</a> hub.</p>

<h2>Authoritative Sources &amp; Further Reading</h2>
<ul>
<li><a href="https://www.americanbar.org/" target="_blank" rel="noopener noreferrer">American Bar Association (ABA)</a> — law school accreditation standards and legal education resources.</li>
<li><a href="https://www.ncbex.org/" target="_blank" rel="noopener noreferrer">National Conference of Bar Examiners (NCBE)</a> — how the bar exam is developed and administered.</li>
<li><a href="https://bjs.ojp.gov/" target="_blank" rel="noopener noreferrer">Bureau of Justice Statistics (U.S. Department of Justice)</a> — federal data on law enforcement and the justice system.</li>
</ul>

<p><em>Last updated August 11, 2026. This page provides general educational information and does not constitute legal or career advice. Read our full <a href="/terms-of-service#disclaimers">legal disclaimer</a>.</em></p>
`.trim(),
  },
};
