'use strict';
/**
 * What each team actually is.
 *
 * A job page needs to answer more than "what is the job" — it has to say what the team
 * does, what it is building, and what working in it is like. That context is the same
 * for every role in a department, so it is written once here, properly, rather than
 * generated per posting.
 *
 * Each entry supplies:
 *   whatWeDo   — the team's remit, in a sentence or two
 *   context    — what is actually being built or run right now, and why it is hard
 *   howYouWork — the working reality: tools, rhythm, who you sit with
 *   growth     — where people go from here
 *
 * This is the honest, checkable kind of detail. Nothing here is a statistic, a claim
 * about being an industry leader, or anything that would need a citation to defend.
 */
module.exports = {
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
};
