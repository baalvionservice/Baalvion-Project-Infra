// Investor FAQ — plain data module (no JSX, no "use client").
//
// This data is consumed by the Investor FAQ section component AND by the
// route's FAQPage JSON-LD structured data. Answers are kept clean plain-text
// (no markdown, no HTML) so they remain valid both in the UI and in schema.org
// output. Voice is institutional and specific to Baalvion's AI-native
// trade-infrastructure thesis.

export interface IrFaqItem {
  q: string;
  a: string;
}

export interface IrFaqCategory {
  category: string;
  items: IrFaqItem[];
}

export const IR_FAQ: IrFaqCategory[] = [
  {
    category: "Business Model",
    items: [
      {
        q: "What does Baalvion actually build?",
        a: "Baalvion Industries Private Limited (CIN U43121OD2025PTC048479) builds an AI-native operating system for global B2B trade, unifying logistics, trade finance and compliance on a single platform. Rather than digitising one slice of the trade workflow, we connect the systems that today run as disconnected silos. The platform is designed so that each transaction, partner and corridor added increases the value available to every other participant.",
      },
      {
        q: "How is Baalvion's business model different from a conventional logistics or fintech company?",
        a: "Conventional players optimise a single function: a freight forwarder moves goods, a lender extends credit, a compliance vendor screens parties. Baalvion operates the connective layer beneath all three, so data captured in one workflow improves decisions in the others. That cross-domain integration is the source of both our defensibility and our operating leverage, because the marginal cost of serving an additional corridor falls as the network grows.",
      },
      {
        q: "Who are Baalvion's customers?",
        a: "Our customers are businesses engaged in cross-border B2B trade, together with the banks, financiers and intermediaries that serve them. The platform is built for enterprises that move goods, capital and documentation across jurisdictions and that bear the cost of today's fragmented, paper-heavy processes. We prioritise customers in high-growth corridors where integrated infrastructure delivers the clearest measurable value.",
      },
      {
        q: "Why is an AI-native architecture central to the business model rather than an add-on?",
        a: "Trade workflows are dense with unstructured documents, classification decisions and compliance judgements that have historically required manual labour. By making AI native to the platform — in compliance screening, logistics optimisation, HS-code classification and document validation — we automate work that competitors still perform by hand. This lowers our cost to serve, improves accuracy and creates a data advantage that compounds as transaction volume grows.",
      },
    ],
  },
  {
    category: "Revenue",
    items: [
      {
        q: "How does Baalvion intend to generate revenue?",
        a: "The platform is designed to monetise across multiple layers of the trade workflow, including platform and technology access, transaction-linked services across logistics and finance, and value-added compliance and intelligence capabilities. As an early-stage company, our revenue model continues to be refined against real customer adoption and corridor economics. We do not publish financial projections, and any illustrative figures presented in investor materials are directional rather than forecasts.",
      },
      {
        q: "Is Baalvion's revenue model transaction-based or subscription-based?",
        a: "We expect a blended model that combines recurring platform access with transaction-linked monetisation tied to the value moving through the system. A blended structure aligns our revenue with customer activity while preserving a predictable recurring base. The precise weighting between recurring and transactional revenue will be calibrated as adoption matures across corridors.",
      },
      {
        q: "What unit economics is the platform designed to deliver?",
        a: "The architecture is built so that the marginal cost of serving additional transactions and corridors declines as the network scales, because AI automation absorbs work that would otherwise grow with headcount. The intended result is improving contribution economics as volume increases. As an early-stage company we are still validating these unit economics against live customer data, and we manage capital deployment conservatively in the interim.",
      },
      {
        q: "Does Baalvion disclose detailed financial statements to prospective investors?",
        a: "Baalvion is a privately held, unlisted company, and detailed financial information is made available to qualified and accredited investors under appropriate confidentiality arrangements, typically within a managed data room. Public investor materials describe our strategy, market and model rather than line-item financials. Prospective investors seeking financial detail can engage our investor relations team to begin that process.",
      },
    ],
  },
  {
    category: "Competition",
    items: [
      {
        q: "Who does Baalvion compete with?",
        a: "We operate adjacent to logistics platforms, trade-finance providers and compliance-technology vendors, but no single incumbent occupies the unified, AI-native position we are building toward. Competition is therefore fragmented across functional silos rather than concentrated in one direct rival. Our strategic risk is less a single competitor and more the collective inertia of established point solutions.",
      },
      {
        q: "What is Baalvion's competitive moat?",
        a: "Our moat is the combination of cross-domain integration and a compounding data advantage. Because logistics, finance and compliance run on one platform, data captured in any workflow improves the AI models serving the others, and that advantage strengthens with every additional transaction and corridor. Network effects reinforce this: each new participant raises the platform's value to all others, raising the cost of switching to a single-function alternative.",
      },
      {
        q: "Could a large incumbent or hyperscaler replicate Baalvion's platform?",
        a: "A well-capitalised incumbent could invest in adjacent capabilities, and we treat that as a serious competitive risk rather than dismiss it. Our defensibility rests on the integrated data and corridor relationships accumulated through real transactions, which are difficult to replicate quickly even with capital. We focus on deepening that integration and on corridors where our AI tooling delivers a measurable, defensible edge.",
      },
      {
        q: "How does Baalvion stay ahead of compliance-technology specialists?",
        a: "Our compliance capability is not a standalone product bolted onto the platform; it is informed by the same logistics and finance data flowing through the system, which improves screening context and accuracy. Specialist vendors lack that integrated view of the underlying trade. We continue to invest in our AI compliance and sanctions tooling so that compliance remains a strength of the platform rather than a dependency on third parties.",
      },
    ],
  },
  {
    category: "Market",
    items: [
      {
        q: "How large is the market Baalvion is addressing?",
        a: "Global B2B trade flows exceed 13 trillion US dollars annually, and a persistent trade-finance gap of roughly 2.5 trillion US dollars leaves significant demand unmet each year. Approximately 80 percent of world trade still depends on fragmented, paper-heavy processes. These are external market estimates that describe the addressable opportunity we are building toward, not company results.",
      },
      {
        q: "Why is now the right time to build this infrastructure?",
        a: "The infrastructure of global trade is being rebuilt in a way that happens roughly once in a generation, driven by the maturation of AI, rising demand for supply-chain resilience and tightening compliance expectations. These forces make integrated, intelligent trade infrastructure both feasible and necessary at the same moment. We believe early, focused execution in this window establishes durable positioning that is hard to challenge later.",
      },
      {
        q: "Which market segments and geographies does Baalvion prioritise?",
        a: "We prioritise high-growth trade corridors and digital ecosystems where our integrated platform delivers the clearest measurable value, with particular focus on emerging markets and technology-driven supply chains. Concentrating on corridors where the pain of fragmentation is greatest lets us demonstrate value quickly and build dense, defensible network effects. Expansion follows demonstrated traction rather than indiscriminate geographic spread.",
      },
      {
        q: "How should investors interpret the market figures in Baalvion's materials?",
        a: "The headline figures — 13 trillion dollars in trade flows, a 2.5 trillion dollar finance gap and 80 percent paper-heavy processes — are external estimates of the total opportunity, not penetration assumptions or revenue forecasts. They frame the scale of the problem we are addressing rather than a claim on near-term capture. Investors should treat any forward-looking illustration as directional and subject to execution and market risk.",
      },
    ],
  },
  {
    category: "Technology",
    items: [
      {
        q: "What are Baalvion's core AI capabilities?",
        a: "Four AI capabilities anchor the platform: an AI compliance and sanctions agent covering AML and KYC screening, an AI logistics optimiser, AI HS-code classification, and AI document validation. Each automates work that is traditionally manual, slow and error-prone across the trade workflow. Together they form a connected intelligence layer in which signals from one capability improve the others.",
      },
      {
        q: "How does the AI compliance and sanctions agent work?",
        a: "The AI compliance and sanctions agent screens parties and transactions for AML, KYC and sanctions exposure, applying machine intelligence to surface risk that manual review can miss. Because it draws on the same logistics and finance context flowing through the platform, it evaluates risk with fuller awareness of the underlying trade. This integrated screening improves both accuracy and speed relative to standalone compliance tooling.",
      },
      {
        q: "What does AI HS-code classification and document validation deliver?",
        a: "AI HS-code classification automates the assignment of harmonised tariff codes, a task that is error-prone and consequential for duties and compliance when done manually. AI document validation checks trade documentation for consistency, completeness and integrity before it propagates downstream. Both reduce manual labour, cut error rates and accelerate the movement of goods and documentation through the system.",
      },
      {
        q: "How does Baalvion manage AI accuracy, reliability and oversight?",
        a: "We treat AI reliability as a core engineering and governance discipline, because errors in compliance, classification or validation carry real regulatory and financial consequences. Our approach keeps appropriate human oversight over high-stakes decisions and continuously evaluates model performance against real-world outcomes. We are candid that model performance is an ongoing area of investment and a genuine technology risk that we actively manage.",
      },
    ],
  },
  {
    category: "Expansion",
    items: [
      {
        q: "How does Baalvion plan to expand?",
        a: "Expansion follows a corridor-led strategy: we deepen presence in proven high-growth trade routes before extending to adjacent corridors and ecosystems. This disciplined sequencing builds dense network effects in each corridor rather than spreading capability thinly across many markets at once. New corridors are prioritised by demonstrated traction, strategic value and the strength of our AI advantage in that context.",
      },
      {
        q: "What role does mergers and acquisitions play in Baalvion's growth?",
        a: "Our strategy contemplates selective acquisition of key technologies in trade finance, compliance automation and logistics management to accelerate platform capabilities and market penetration. Acquisitions are evaluated against strategic fit and integration risk rather than pursued for scale alone. Any inorganic growth is intended to reinforce the integrated platform, not to assemble unconnected point solutions.",
      },
      {
        q: "How does Baalvion sequence product and corridor expansion?",
        a: "We expand the product surface and the corridor footprint in step, allowing capabilities proven in one context to be extended where they create the most value. This avoids over-building ahead of demand and keeps capital aligned with validated opportunities. Sequencing is governed by real customer adoption signals rather than a fixed roadmap detached from traction.",
      },
      {
        q: "What are the main constraints on Baalvion's expansion pace?",
        a: "The principal constraints are capital, execution capacity and the regulatory complexity of operating across jurisdictions. Each new corridor introduces distinct compliance, data and partnership requirements that must be addressed responsibly. We deliberately pace expansion to protect platform quality and regulatory standing rather than pursue growth that outruns our ability to operate safely.",
      },
    ],
  },
  {
    category: "Funding",
    items: [
      {
        q: "How is Baalvion funded, and who can invest?",
        a: "Baalvion is a privately held, unlisted company, and investment is offered to qualified and accredited investors in accordance with applicable requirements. Securities are not registered for public offering and are not available to the general public. Prospective investors can engage our investor relations team to understand current availability and the process for participation.",
      },
      {
        q: "How does Baalvion intend to allocate capital raised?",
        a: "Our capital-allocation framework is designed to deploy funds toward durable value across platform and technology, trade-finance capacity, market and corridor expansion, and governance and reserves. This disciplined structure balances growth investment against operational resilience. Specific allocations are calibrated to the stage of the company and the opportunities validated by customer adoption.",
      },
      {
        q: "What is Baalvion's approach to capital discipline as an early-stage company?",
        a: "We manage capital conservatively, recognising that early-stage companies face real funding and runway risk and that future financing is never guaranteed. Capital is directed toward initiatives that strengthen the integrated platform and the corridor economics that underpin durable value. We avoid speculative spend ahead of demonstrated traction and treat reserves and governance as a deliberate allocation rather than an afterthought.",
      },
      {
        q: "Where can prospective investors begin diligence?",
        a: "Qualified and accredited investors can begin by contacting our investor relations team at invrel@baalvion.com to request access to detailed materials under appropriate confidentiality arrangements. From there we provide access to a managed data room and the information needed for substantive diligence. We encourage investors to review our risk factors carefully as part of that process.",
      },
    ],
  },
  {
    category: "Risk Factors",
    items: [
      {
        q: "What stage-related risks should investors understand?",
        a: "Baalvion is an early-stage company, and an investment carries the substantial risks inherent to early-stage ventures, including the possibility of partial or total loss of capital. We have a limited operating history on which to evaluate performance, and our revenue model and unit economics are still being validated. Past or illustrative figures are not indicative of future results, and outcomes may differ materially from current expectations.",
      },
      {
        q: "What are the principal execution and key-person risks?",
        a: "Building an integrated, AI-native platform across logistics, finance and compliance is operationally demanding, and we may fail to execute on time, on budget or to the required standard. Like many early-stage companies, we depend on a small group of key individuals, and the loss of critical personnel could adversely affect the business. We work to mitigate this through disciplined operations and governance, but the risk cannot be eliminated.",
      },
      {
        q: "What regulatory and compliance risks does Baalvion face?",
        a: "We operate in a domain governed by trade, financial-services, AML, KYC, sanctions and data-protection regulation across multiple jurisdictions, and these rules can change in ways that increase cost or constrain operations. A compliance failure could carry significant financial, legal and reputational consequences. While our own AI compliance tooling strengthens our posture, no control framework can fully eliminate regulatory risk.",
      },
      {
        q: "What capital, competition, technology and adoption risks apply?",
        a: "We face capital risk, because future financing is not assured and adverse market conditions could limit our access to funding. We face competitive risk from incumbents and well-capitalised entrants, and technology risk because our AI models may underperform, produce errors or require continued investment to remain effective. We also face market-adoption risk, as customers may adopt the platform more slowly than anticipated, any of which could materially affect outcomes.",
      },
    ],
  },
  {
    category: "Vision",
    items: [
      {
        q: "What is Baalvion's long-term vision?",
        a: "Our vision is to become the unified operating system beneath global B2B trade, connecting logistics, finance and compliance into a single intelligent layer. We believe the infrastructure of global trade is being rebuilt once in a generation, and we intend to be the AI-native platform at its core. Realising this vision means making cross-border trade faster, more transparent and more accessible than today's fragmented systems allow.",
      },
      {
        q: "How does Baalvion think about durable, long-term value creation?",
        a: "We prioritise durable competitive advantage over short-term optics, concentrating on integration, data and network effects that compound over time. Value is created when each transaction, partner and corridor strengthens the platform for everyone on it. This long-horizon orientation informs how we allocate capital, sequence expansion and measure progress.",
      },
      {
        q: "What does success look like for Baalvion over the next several years?",
        a: "Success means demonstrating that an integrated, AI-native platform measurably outperforms fragmented point solutions across the corridors we serve, and translating that into deepening adoption and improving economics. It also means maintaining the regulatory standing and governance discipline that institutional partners require. We measure progress against real customer traction rather than against forward-looking projections.",
      },
      {
        q: "How does the company's vision shape its day-to-day priorities?",
        a: "Because we are building connective infrastructure, our priorities favour integration depth, data quality and corridor density over feature breadth for its own sake. Every initiative is weighed against whether it strengthens the unified platform and its network effects. This keeps the organisation focused on the few things that compound rather than dispersing effort across disconnected bets.",
      },
    ],
  },
  {
    category: "Exit Opportunities",
    items: [
      {
        q: "What potential exit pathways could be available to investors?",
        a: "Potential exit pathways for early-stage technology infrastructure companies can include a future public listing, a strategic acquisition, or secondary transactions, though none of these is assured. As a privately held, unlisted company, Baalvion makes no commitment to any specific exit and provides no assurance of liquidity. Investors should treat an investment as illiquid and long-term in nature.",
      },
      {
        q: "How liquid is an investment in Baalvion?",
        a: "Securities in Baalvion are privately held and unregistered, and there is no public market for them, so investors should expect limited liquidity and a long holding horizon. Any transfer is subject to applicable restrictions and the company's governance. We are candid that liquidity is a genuine constraint that prospective investors must weigh.",
      },
      {
        q: "Why might Baalvion be attractive to a strategic acquirer over time?",
        a: "The integrated platform, the proprietary data accumulated across logistics, finance and compliance, and the corridor relationships built through real transactions are assets that a strategic acquirer in trade, finance or technology could find difficult to replicate. These same assets that create operating defensibility could, over time, make the company strategically valuable. This is a possibility rather than a plan, and no acquisition is contemplated or assured.",
      },
      {
        q: "Does Baalvion guarantee any exit, return or timeline?",
        a: "No. Baalvion does not guarantee any exit, return of capital or specific timeline, and an early-stage investment may result in partial or total loss. Any discussion of exit opportunities is illustrative of pathways generally available to companies of this type, not a representation about Baalvion specifically. Prospective investors should review the risk factors and consult their own advisers before investing.",
      },
    ],
  },
];
