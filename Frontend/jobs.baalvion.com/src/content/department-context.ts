/**
 * What each team actually is.
 *
 * A job page has to answer more than "what is the job": what the team does, what it is
 * building, what working in it is like, and where people go afterwards. That context is
 * the same for every role in a department, so it is written once — properly — rather
 * than generated per posting.
 *
 * Everything here is checkable. No statistics, no "industry leading", nothing that
 * would need a citation to defend.
 */
export type DepartmentContext = {
  whatWeDo: string;
  context: string;
  howYouWork: string;
  growth: string;
};

export const DEPARTMENT_CONTEXT: Record<string, DepartmentContext> = {
    dept_eng_it: {
        whatWeDo: 'Engineering builds and runs TalentOS — the hiring platform this careers site is itself running on. Job search, the application flow, the recruiter console, and the services underneath all of it.',
        context: 'The platform is multi-tenant and the correctness bar is unusually high for a product of its size: an application that goes missing is somebody\'s career, not a support ticket. Traffic is spiky by nature — a campus placement season concentrates a year of applications into a fortnight — so capacity and queueing are ordinary design concerns rather than scaling exotica.',
        howYouWork: 'Small teams that own a surface end to end, from the migration to what a candidate sees on a slow connection. Code review is expected to teach, not just approve. On-call exists and is compensated, and the rotation is built so nobody is woken twice in a week.',
        growth: 'The individual contributor ladder runs to Principal and Distinguished without requiring anyone to become a manager. Moving into management is a lateral choice made deliberately, not a promotion you fall into.',
    },
    dept_ai: {
        whatWeDo: 'The AI team owns the models inside the product: resume understanding, candidate-to-role matching, and the assistive tooling recruiters use every day.',
        context: 'These models influence who a recruiter sees, which makes fairness a design constraint rather than a review step at the end. Every ranking change is evaluated for differential impact before it ships, and the team has standing authority to stop a launch. The input is genuinely hard — CVs in every format a human can invent, multilingual and code-mixed text, and documents photographed at an angle in bad light.',
        howYouWork: 'Engineering with models in it. You build the evaluation set before you tune anything, and offline-to-online gaps are treated as the main risk rather than an inconvenience. Research is applied — the measure is whether it survives production traffic.',
        growth: 'Deep specialisation is a career here, not a stepping stone. Research Engineer and Principal Data Scientist are terminal titles people hold for years.',
    },
    dept_data: {
        whatWeDo: 'Data owns the pipelines, the warehouse and the definitions the business argues about — funnel conversion, time to hire, source quality.',
        context: 'The hard part is not the pipeline; it is that two teams asking the same question must get the same answer. Most of the work is in the semantic layer and in being willing to say a number is not trustworthy yet.',
        howYouWork: 'SQL-first, with dbt for modelling and Airflow for orchestration. Analysts and engineers sit together rather than throwing requests over a wall.',
        growth: 'Analyst to analytics engineer to data engineer is a well-worn path here, and the reverse happens too.',
    },
    dept_design: {
        whatWeDo: 'Design owns what people move through under pressure: applying for work, sitting an interview, receiving or declining an offer.',
        context: 'The recruiter console is dense, configurable and used eight hours a day — designing it is a systems problem, not a screens problem. The candidate side is the opposite: someone anxious, on a phone, possibly at a moment that matters a great deal to them. Clarity beats novelty on both.',
        howYouWork: 'Figma, a shared component library maintained by a design systems engineer, and critique that is expected to be direct. Research is a practice, not a phase.',
        growth: 'Senior designers lead surfaces. The management track exists but is not the only way up.',
    },
    dept_devops: {
        whatWeDo: 'Infrastructure owns the path from commit to production and everything that keeps it standing: build, deploy, observability, capacity and incident response.',
        context: 'Multi-region, containerised, with tenant isolation that has to hold under load. The interesting problems are in resource isolation and in making a deploy boring.',
        howYouWork: 'Infrastructure as code by default. SLOs and error budgets are real inputs to planning. Postmortems are blameless and are written to be read.',
        growth: 'SRE, platform and security engineering are adjacent here and people move between them.',
    },
    dept_security: {
        whatWeDo: 'Security owns the safety of a platform holding identity documents, salary data and CVs across several jurisdictions.',
        context: 'The threat model is specific: account takeover, document forgery, automated abuse at scale, and people impersonating employers to defraud job seekers. That last one is why Trust & Safety exists as a separate function and why we work closely with it.',
        howYouWork: 'Reviews and threat models done alongside engineering rather than at the end. Findings are written so a developer can act on them, not as a scanner dump.',
        growth: 'AppSec, GRC and security research are distinct tracks, and the team is small enough to move between them.',
    },
    dept_media: {
        whatWeDo: 'Media & Creative Production makes everything the company puts out: films, photography, live streams, podcasts and the vertical video that carries most of it.',
        context: 'Shoots are rarely in comfortable places — campuses, offices, plants, and mine sites on a plateau where the cloud comes down and takes the light with it. Crew is small, so people run their own department on the day.',
        howYouWork: 'Kit is provided and properly maintained. Shoots are planned with a call sheet and a producer. Post is Premiere and Resolve, with a house look owned by the colourist.',
        growth: 'Assistant to operator to lead is a real path here — several of the current crew started as production assistants.',
    },
    dept_social: {
        whatWeDo: 'Social Media & Community runs every channel and the communities on them — candidates and recruiters, in several languages.',
        context: 'Much of the audience is at an anxious point in their career, which sets the tone for everything published. Regional content is made in the language it will be watched in rather than translated into it.',
        howYouWork: 'The team writes, shoots and edits its own short-form work, alongside the media team for anything larger. Numbers are read honestly, including when a campaign did nothing.',
        growth: 'Executive to manager, and across into content, brand or partnerships.',
    },
    dept_trade_fin: {
        whatWeDo: 'Trade Finance & Insurance makes it possible for a seller to ship to a buyer they have never met — credit insurance, letters of credit, guarantees and the risk view behind them.',
        context: 'Cross-border trade fails on trust and on documents, in that order. The instruments here are old and unforgiving: a discrepancy on a document set can hold payment for weeks, and a credit limit set carelessly becomes a loss six months later. Multiple jurisdictions, multiple regulators, and rules that reward people who have read the actual text.',
        howYouWork: 'Close to the commercial team but independent of it — the whole point of the function is being able to say a deal is not insurable. Underwriters, brokers and banks are daily relationships.',
        growth: 'Specialists here are genuinely scarce, and the function is being built rather than maintained.',
    },
    dept_payments: {
        whatWeDo: 'Payments & Gateway Engineering builds the rails money moves on: the gateway, acquirer and PSP integrations, cross-border settlement, escrow, reconciliation and the ledger under all of it.',
        context: 'Money is unforgiving in a way most software is not. A network blip that causes a retry must not become a double charge; a reconciliation break is either a bug or somebody\'s money, and you need to know which within the hour. Add cross-border — correspondent rails, cut-offs, value dates, FX at the point of quote, and screening every leg has to pass — and idempotency stops being a nicety.',
        howYouWork: 'Double-entry thinking, strong reconciliation, and integrations with more than one provider because they all behave differently. PCI DSS scope is a real constraint on architecture, not a checkbox.',
        growth: 'Payments engineering is a specialism that transfers anywhere, and the surface here spans gateway, settlement and cross-border.',
    },
    dept_shipping: {
        whatWeDo: 'Shipping, Freight & Customs moves the goods: carrier relationships, bookings, documentation, customs clearance, chartering and vessel operations.',
        context: 'This is the part of trade that happens in the physical world and refuses to be tidy. Vessels get omitted, containers get held for examination, a wrong container number on a bill of lading stops a consignment at the gate, and demurrage accrues while somebody argues. The work is judged on landed cost and on how few surprises reach the buyer.',
        howYouWork: 'Port-side and desk-side both. Real relationships with lines, agents, CFSs and brokers matter more than any system. Hours follow the vessel rather than the clock when a berth is imminent.',
        growth: 'Operations to management, and across into chartering or trade operations.',
    },
    dept_trade_ops: {
        whatWeDo: 'Trade Operations owns a trade from purchase order to final settlement — documents, shipment, payment, and every exception that needs a person.',
        context: 'Nothing about a cross-border trade is automatic. Suppliers slip, documents come back wrong, quality disputes open after arrival, and someone has to hold the whole thing together and tell both sides the truth about where it stands.',
        howYouWork: 'Process-heavy by design, because the process is what stops a bad week becoming a loss. Close to shipping, trade finance and the marketplace team.',
        growth: 'Executive to manager, with the option to specialise into documentation, compliance or finance.',
    },
    dept_marketplace: {
        whatWeDo: 'Marketplace builds the buyer-seller platform: discovery, quoting, negotiation, orders, and the verification that lets two strangers in different countries transact at all.',
        context: 'Two-sided, so nearly every change helps one side at the other\'s expense and the judgement is in that trade. Trust is the actual product — business verification, ownership checks, document authenticity, and catching a seller who was shut down under another name.',
        howYouWork: 'Product, operations and trust work as one group rather than as three that file tickets at each other.',
        growth: 'The platform is early enough that scope grows faster than headcount.',
    },
    dept_mine_ops: {
        whatWeDo: 'Mine Operations runs the working: drilling, blasting, loading, hauling and the production plan they serve.',
        context: 'Several posts here are statutory under the Mines Act 1952 and the applicable regulations — Mine Manager, Overman, Mining Mate, Blaster, Winding Engine Driver — and cannot be held without the certificate of competency. That is not a preference; it is the law, and it is why the postings state it plainly rather than burying it. The monsoon decides half the year at most of our sites.',
        howYouWork: 'Shift-based, at site, with statutory inspections and reports before work begins. Safety authority is real: anyone can stop a job, and people who use that authority are backed.',
        growth: 'Certificates are sponsored. Operator to mate to overman to manager is the ladder, and people climb it here.',
    },
    dept_mine_hse: {
        whatWeDo: 'Mine Safety, Health & Environment holds the statutory safety and environmental posts and runs the systems behind them.',
        context: 'The safety officer role carries the standing authority to stop work, and the function only works if that authority gets used on a production day. Environmental compliance covers consent conditions, monitoring and the reclamation commitments the clearance was granted on.',
        howYouWork: 'Inspections, risk assessment, incident investigation and training. Rescue team membership is held alongside a trade, with training and medical fitness maintained.',
        growth: 'Statutory qualifications are sponsored, and the function reports independently of production.',
    },
    dept_finance: {
        whatWeDo: 'Finance owns planning, control, statutory compliance and the books — across several countries and currencies.',
        context: 'We employ in multiple jurisdictions, earn in some currencies and pay salaries in others. Payroll accuracy and statutory filing are not negotiable, and the audit trail has to hold.',
        howYouWork: 'Month-end has a rhythm and it is respected. Controls are tested rather than assumed.',
        growth: 'Analyst to manager to controller, with tax, treasury and audit as specialisms.',
    },
    dept_hr: {
        whatWeDo: 'People & HR owns everything about employment here — structure, compensation, performance, employee relations and the culture the company actually has.',
        context: 'We sell hiring software, so how we treat our own people is the product demonstration. That is also why compensation bands are published and why candidate experience is held to a standard we would show a customer.',
        howYouWork: 'Business partners sit with the teams they support rather than in a separate function.',
        growth: 'Generalist to business partner to lead, with compensation, ER and L&D as specialisms.',
    },
    dept_ta: {
        whatWeDo: 'Talent Acquisition hires for the whole company — engineering, mining, media, trade and everything else on this site.',
        context: 'Recruiting for a company whose product is recruiting sets an obvious bar. Every candidate gets a written answer, the process is visible to them throughout, and nobody is left wondering for three weeks.',
        howYouWork: 'Structured interviews with published rubrics. Sourcing is a craft here, not a numbers game.',
        growth: 'Coordinator to recruiter to lead, with campus, sourcing and recruitment marketing as specialisms.',
    },

    dept_prod: {
        whatWeDo: 'Product owns what gets built and why — the candidate experience, the recruiter console, and the judgement about which of the two a change should serve when it cannot serve both.',
        context: 'This is a product whose users are at opposite ends of the same transaction, and most decisions help one at the other\'s expense. A feature that makes screening faster for a recruiter can make rejection more opaque for a candidate. Naming that trade-off rather than hiding it is most of the work.',
        howYouWork: 'Specifications state the problem and the constraints and leave the solution open enough for design and engineering to improve on it. Discovery happens before the roadmap, not after it. Success is defined before work starts, and reported honestly when it does not move.',
        growth: 'Associate to product manager to senior, with group product management for people who want to lead through others. The individual contributor path is real.',
    },
    dept_qa: {
        whatWeDo: 'Quality Engineering owns whether what we ship actually works — the automated suites, the exploratory testing, and the decision to hold a release.',
        context: 'The flows that must never break are specific and knowable: applying for a job, scheduling an interview, making an offer. A broken application form is somebody\'s career, so the testing effort concentrates where the consequence is, rather than spreading evenly for a coverage number.',
        howYouWork: 'Automation in the pipeline on every change, exploratory testing where the interesting defects actually are, and real devices for the low-end phones most candidates use. A flaky suite is treated as a defect in its own right.',
        growth: 'Manual to automation to lead, and across into engineering — several of the current engineers started in quality.',
    },
    dept_it_support: {
        whatWeDo: 'IT keeps everyone working — devices, access, the corporate systems, and the site networks at the plants and mines.',
        context: 'The estate runs from an engineer\'s laptop in Bengaluru to a weighbridge terminal at Damanjodi where dust and heat shorten the life of everything and a failure stops trucks moving. Those are different problems and the function has to be good at both.',
        howYouWork: 'A real ticket queue with a response standard, joiner-mover-leaver that actually happens on the day, and automation of the administration rather than staffing it. Documentation is part of the job.',
        growth: 'Support to systems administration to management, with security and infrastructure as adjacent moves.',
    },
    dept_rd: {
        whatWeDo: 'Applied Research takes work from the literature to something that survives production traffic — matching, ranking, document understanding and extraction quality.',
        context: 'The problems are applied rather than open-ended. A method that improves an offline metric and degrades the live experience has not worked, and the team is expected to say so rather than publish the offline number.',
        howYouWork: 'The evaluation set is built before anything is tuned. Prototyping is fast and the willingness to abandon an approach is treated as a strength. Research that stops at a paper has not finished.',
        growth: 'Research engineer to senior to principal, with publication supported where it is appropriate.',
    },
    dept_sales: {
        whatWeDo: 'Sales sells the hiring platform to the organisations that will run their recruiting on it — from mid-market teams to enterprises with a buying committee spanning HR, IT, security, procurement and legal.',
        context: 'We are selling recruiting software to recruiters, which sets an obvious bar: a sloppy process in our own sales cycle is a product argument against us. Discovery matters more than demonstration here, because a hiring process is specific to a company and a generic pitch lands nowhere.',
        howYouWork: 'Deal teams rather than lone closers — solutions engineering for the technical proof, security for the questionnaire, legal for the contract. Forecasts are expected to be accurate, including calling a deal that will not close.',
        growth: 'SDR to account executive to enterprise, with management and sales operations as separate tracks.',
    },
    dept_sales_eng: {
        whatWeDo: 'Solutions Engineering is the technical half of the sales conversation — demonstrations, architecture, integrations and the security review.',
        context: 'Most enterprise deals turn on a technical question: will this work with their HRIS, their identity provider, their data residency requirement. Answering honestly is the job, including when the honest answer loses the deal — a sale closed on an assumption that fails in implementation costs more than it earned.',
        howYouWork: 'Proofs of concept built to answer the customer\'s actual question rather than to show the standard demo. Product gaps go back with the deal context attached.',
        growth: 'Solutions engineering into product, into implementation, or into sales leadership.',
    },
    dept_mktg: {
        whatWeDo: 'Marketing owns how the company is understood — the content, the search presence, the campaigns and the employer brand.',
        context: 'A careers site is an unusual marketing surface: it has to rank, it has to convert, and it has to be true, because everyone reading it will find out. That constraint rules out most of what passes for recruitment marketing and leaves the parts that actually work — showing the work, and structuring it so a search engine and an answer engine can both use it.',
        howYouWork: 'Content is researched and sourced, not generated. Numbers are read honestly, including when a campaign did nothing. SEO and engineering work on the same site architecture rather than filing tickets at each other.',
        growth: 'Executive to manager to lead, with content, performance, product marketing and brand as distinct specialisms.',
    },
    dept_partnerships: {
        whatWeDo: 'Partnerships builds the technology and channel relationships that extend what the platform can do and where it can sell.',
        context: 'The agreement is the easy part. What decides whether a partnership works is the relationship after signature and whether both sides actually commit resource to it, which is why this function is measured on sourced pipeline rather than on logos announced.',
        howYouWork: 'Close to product on the integration roadmap and close to sales on the joint motion. Channel conflict is managed before it damages a relationship.',
        growth: 'Manager to director, and across into business development or sales leadership.',
    },
    dept_support: {
        whatWeDo: 'Support answers candidates and recruiters — the account problems, the application questions, and the technical issues that need somebody to debug across a stack.',
        context: 'A large share of the people writing in are at an anxious point in their career and a slow or careless answer lands harder than it would elsewhere. That sets the tone for everything, including the escalation that has to be honest about how long a fix will take.',
        howYouWork: 'Shift coverage across the working day, response standards that are met rather than reported, and the discipline to spot a recurring issue and get it removed rather than answering it forty times.',
        growth: 'Specialist to technical support to team lead, with implementation and customer success as adjacent moves.',
    },
    dept_impl: {
        whatWeDo: 'Implementation takes a new customer from signature to running in production — configuration, data migration, integrations and training.',
        context: 'Data migration is where implementations actually go wrong: whatever they were using before is messier than it was described as being, and the honest conversation about that has to happen early. The goal is a customer who can work without us, not a customer who depends on us.',
        howYouWork: 'Projects run to a date with slippage flagged early, and handover to customer success carries the promises and the open items in writing.',
        growth: 'Consultant to senior to practice lead, with solutions engineering and product as adjacent moves.',
    },
    dept_ops: {
        whatWeDo: 'Business Operations runs the operating system of the company — planning, reporting, and the cross-functional problems nobody else owns.',
        context: 'Most of the work is in the gaps between functions, where a process fails and no single team is accountable for it. The function exists to pick those up and make them somebody\'s job permanently.',
        howYouWork: 'Analysis that ends in a recommendation rather than a deck of options. Processes documented so they survive a person leaving.',
        growth: 'Analyst to manager to director, with strategy, revenue operations and finance as adjacent moves.',
    },
    dept_supply: {
        whatWeDo: 'Supply Chain plans and moves what the operations need — sourcing, inbound movement, inventory and the warehouse.',
        context: 'The chain runs to mine sites and plants where a missing part stops production and the nearest alternative is several hours away. That changes the calculation on safety stock and on which supplier relationships are worth the effort.',
        howYouWork: 'Supplier performance managed with data rather than impression. Demand planning that holds the balance between a stock-out and working capital tied up in stock.',
        growth: 'Coordinator to analyst to manager, with procurement and site logistics as adjacent moves.',
    },
    dept_procurement: {
        whatWeDo: 'Procurement runs sourcing and supplier management across every category the company buys in — from cloud infrastructure to mining consumables.',
        context: 'The categories are genuinely different: a software contract is negotiated on terms, an OTR tyre contract on availability and total cost per hour. Category knowledge is what separates procurement that saves money from procurement that only slows purchasing down.',
        howYouWork: 'Tenders run properly, savings tracked against the price actually paid before, and supplier due diligence done before the first order rather than after a problem.',
        growth: 'Specialist to category manager to head of procurement.',
    },
    dept_facilities: {
        whatWeDo: 'Workplace & Facilities runs the buildings and the services in them — offices, the studio, and the site and township facilities.',
        context: 'Statutory building compliance is not optional and the certificates behind it are auditable. Beyond that, the function is judged on whether the place works for the people in it, which is a different and harder standard.',
        howYouWork: 'Vendor management across cleaning, catering, security and maintenance, with real service standards. Safety and emergency preparedness are owned here rather than assumed.',
        growth: 'Coordinator to manager, with health and safety as a specialism.',
    },
    dept_legal: {
        whatWeDo: 'Legal covers commercial contracting, employment, corporate matters, privacy and the regulatory position across every jurisdiction we operate in.',
        context: 'We hold identity documents, salary data and CVs across several data-protection regimes at once, and we sell into organisations whose procurement and security teams will test every claim we make. Advice has to be practical enough to act on and precise enough to survive that.',
        howYouWork: 'A contracting playbook so routine negotiation does not need a lawyer for every clause. Risk stated plainly rather than hedged into uselessness.',
        growth: 'Counsel to senior counsel to general counsel, with privacy, commercial and employment as specialisms.',
    },
    dept_strategy: {
        whatWeDo: 'Strategy works on the questions that decide direction — which markets, which products, which segments, and what to stop doing.',
        context: 'The analysis is only worth the decision it changes. Work here is expected to end in a view somebody can act on or disagree with, not a summary of the market.',
        howYouWork: 'Primary research rather than secondary. Business cases built to be challenged.',
        growth: 'Analyst to manager to director, with corporate development and business operations as adjacent moves.',
    },
    dept_exec: {
        whatWeDo: 'The executive team and the people who make it function — the operating rhythm, the board material, and the follow-through on what was decided.',
        context: 'Most executive failure is not a bad decision, it is a decision that was made and then quietly did not happen. The roles here exist to close that gap.',
        howYouWork: 'Discretion is the baseline. The work is often unglamorous and always consequential.',
        growth: 'These roles are unusually good vantage points, and people move from them into functional leadership.',
    },
    dept_l_and_d: {
        whatWeDo: 'Learning & Development builds capability across a workforce that runs from engineers to site operators — management development, technical training, and the statutory safety training the sites require.',
        context: 'The audience is genuinely varied, and designing for it means designing for a phone on a poor connection in a second language as often as for a laptop. Statutory training completion at the sites is auditable, which makes tracking a compliance obligation rather than an administrative preference.',
        howYouWork: 'Design from a capability assessment rather than a course catalogue. Measure whether training changed anything, which is harder and more useful than measuring attendance.',
        growth: 'Instructional design, technical training and programme management are distinct paths within the function.',
    },
    dept_trust: {
        whatWeDo: 'Trust & Safety protects the people using the platform — from fake employers, fraudulent postings, and the recruitment scams that target job seekers.',
        context: 'The scam that does the most damage is simple: somebody impersonates an employer and asks a candidate for a fee. The victims are people looking for work, which is why this function exists separately from security and why enforcement decisions get documented rather than made on instinct.',
        howYouWork: 'Consistent enforcement with recorded reasoning, pattern detection behind individual reports, and honest reporting on what is still getting through. Wellbeing support is provided because some of the material is genuinely distressing.',
        growth: 'Analyst to investigator to manager, with policy as a distinct track.',
    },
    dept_loc: {
        whatWeDo: 'Localisation makes the product and the content work in the languages our users actually use — across Indian languages and the European and APAC markets.',
        context: 'Hiring vocabulary translates badly. A literal rendering of terms like "shortlisted" or "offer rolled out" reads as nonsense in several of our languages, so the work is localisation rather than translation. The engineering side has its own problems: text that expands forty per cent, scripts that break naive layouts, and pluralisation rules English does not have.',
        howYouWork: 'Translation is in the pipeline rather than a phase at the end. Strings are tested in the interface where they will actually appear.',
        growth: 'Linguist to reviewer to localisation manager, with localisation engineering as a separate technical track.',
    },
    dept_admin: {
        whatWeDo: 'Administration and transport keep the offices, sites and townships running — reception, office services, security, housekeeping, and the vehicles that move people between them.',
        context: 'At the site locations this is not back-office work. The shift bus on the ghat road is how people get to work at all, and the township water supply is what residents notice first when it fails.',
        howYouWork: 'Reliability is the whole job. Vehicle checks before the first trip, documents kept current, and problems reported rather than driven on with.',
        growth: 'Assistant to executive to supervisor, with facilities and site administration as onward paths.',
    },
    dept_mine_geo: {
        whatWeDo: 'Survey & Geology maps the deposit and measures the working — statutory survey, grade control, exploration and the sampling everything else is judged on.',
        context: 'Mine survey is a statutory function: the plans are legally required, and confirming the working stays inside the lease boundary is an obligation rather than a courtesy. Grade control decides what the operation is actually worth, because the marks a geologist puts on a face are what the operators dig to.',
        howYouWork: 'Field survey and modelling both. Reconciliation between model, face and plant is expected to be investigated when it disagrees, not explained away.',
        growth: 'Assistant surveyor to surveyor, and geologist to senior with exploration as a specialism. Statutory qualifications are sponsored.',
    },
    dept_mine_maint: {
        whatWeDo: 'Mine Maintenance keeps the fleet and the plant running — HEMM, workshops, electrical, welding, hydraulics, tyres and instrumentation.',
        context: 'The central tension is preventive maintenance against production pressure, and the function is judged on whether it holds the schedule when the pit wants the machine back. Component life here is decided by unglamorous things: oil cleanliness, greasing discipline, and taking a tyre off before it fails on a haul road.',
        howYouWork: 'Lock-out and tag-out without exception. Failure analysed to a root cause rather than the component replaced and the wait resumed. Job records kept accurately, because they are what makes any of that possible.',
        growth: 'Helper to trade to supervisor to engineer. Trade certification is sponsored and the ladder is genuinely climbed here.',
    },
    dept_mine_proc: {
        whatWeDo: 'Processing & Refining turns what comes out of the ground into product — crushing, beneficiation, the alumina refinery, the laboratory and quality control.',
        context: 'A continuous plant is never stopped, only handed over, which makes shift discipline and handover quality the difference between a good week and an incident. In the refinery the work is with caustic liquor at temperature, and the protective equipment requirements are absolute rather than advisory.',
        howYouWork: 'Operating to procedure, preparing equipment for maintenance under permit, and reporting the abnormal rather than working around it. Laboratory results are turned around fast enough for the shift to act on them.',
        growth: 'Operator to senior operator to shift supervisor, with process engineering for people who take the qualification.',
    },
    dept_mine_admin: {
        whatWeDo: 'Mine Administration runs the site\'s supporting functions — stores, the explosive magazine, weighbridge, dispatch, time office, security, HR, community relations and statutory compliance.',
        context: 'Several of these are control points rather than clerical jobs. The weighbridge slip drives invoicing and royalty computation, the explosive register is a legal document that gets audited, and contractor labour compliance is where site operations most often get into serious trouble. Integrity in these roles matters more than experience.',
        howYouWork: 'Records kept accurately because they are legal records. Discrepancies investigated rather than adjusted away. Community grievances followed through to an answer, including when the answer is no.',
        growth: 'Clerk to officer to supervisor, with HR, compliance and community relations as distinct specialisms.',
    },
};

/** Context for a department, or undefined when we have nothing honest to say about it. */
export function departmentContext(id?: string | null): DepartmentContext | undefined {
  return id ? DEPARTMENT_CONTEXT[id] : undefined;
}
