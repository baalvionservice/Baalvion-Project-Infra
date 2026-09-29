/**
 * Copy for the standalone informational pages (About, Services, Email,
 * Security). Kept as structured data so the page files stay thin and the voice
 * stays consistent with the homepage charter. Figures are defensible; no
 * invented customers, financials, or certifications.
 */

export interface ValueItem {
  title: string;
  body: string;
}

/* ─────────────────────────── About ─────────────────────────── */

export const ABOUT = {
  folio: '§ 01',
  label: 'About Baalvion',
  eyebrow: 'Who we are',
  title: 'A holding company for foundational infrastructure.',
  lede: 'Baalvion designs, builds, and operates the systems beneath global trade, markets, and digital ecosystems — infrastructure engineered for permanence, governed for trust, and held for the long horizon.',
  overview: [
    'Baalvion is not a single product. It is a foundation: a corporate apex that sets standard and governance, a platform layer that operates the systems institutions depend on, and a portfolio of independent brands that extend the foundation into distinct markets. Each operates under one standard of discipline, permanence, and accountability.',
    'We do not chase markets; we build the structures markets run on — the rails for trade, the systems for financial settlement, the platforms that connect institutions, and the intelligence that holds them together. Every system is built to be depended on for decades, not quarters.',
  ],
  mission: {
    label: 'Mission',
    body: 'To build and operate the foundational infrastructure of global commerce — deterministic, governed, and reconcilable systems that institutions can stake their operations on.',
  },
  vision: {
    label: 'Vision',
    body: 'A connected operating fabric across trade, markets, ecosystems, and intelligence, where compliance and isolation are architecture, and where what we build outlasts the conditions that created it.',
  },
  values: [
    { title: 'Permanence over momentum', body: 'We build for the decade, not the demo. Infrastructure is judged by what it withstands.' },
    { title: 'Governance is architecture', body: 'Compliance, isolation, and accountability are designed into the foundation, never bolted on.' },
    { title: 'Systems before features', body: 'We solve for the whole — coherent, composable infrastructure outlasts any single product on it.' },
    { title: 'Discipline is the standard', body: 'Restraint in scope, rigour in execution, precision in money and trust — across everything we operate.' },
  ] as ValueItem[],
  facts: [
    { value: '2026', caption: 'Established' },
    { value: 'Multi-jurisdiction', caption: 'Operating posture' },
    { value: '4', caption: 'Operating domains' },
    { value: 'Long horizon', caption: 'Ownership & capital' },
  ],
} as const;

/* ─────────────────────────── Services / Platform ─────────────────────────── */

export interface ServiceCapability {
  id: string;
  index: string;
  title: string;
  tagline: string;
  body: string;
  capabilities: string[];
}

export const SERVICES = {
  folio: '§ 02',
  label: 'Platform & Services',
  eyebrow: 'What we operate',
  title: 'Four domains. One operational fabric.',
  lede: 'Each domain is an engineered system in its own right — and every one is wired back to the same core of identity, governance, settlement, and intelligence.',
  domains: [
    {
      id: 'trade',
      index: '01',
      title: 'Trade Infrastructure',
      tagline: 'The rails beneath global commerce.',
      body: 'Systems that move goods, documents, and trust across borders — deterministic workflows, verifiable compliance, and settlement that holds under scrutiny.',
      capabilities: ['Customs & documentation', 'Cross-border settlement', 'Compliance & sanctions screening', 'Logistics orchestration'],
    },
    {
      id: 'markets',
      index: '02',
      title: 'Market & Financial Systems',
      tagline: 'The discipline beneath capital.',
      body: 'Pricing, treasury, ledgering, and reconciliation built to institutional tolerances. Every money movement is server-authoritative, traceable, and reconcilable to the cent.',
      capabilities: ['Pricing & FX', 'Treasury & wallets', 'Double-entry ledgering', 'Reconciliation & settlement'],
    },
    {
      id: 'ecosystem',
      index: '03',
      title: 'Ecosystem Platforms',
      tagline: 'Where institutions connect and operate.',
      body: 'Operating environments for trade, talent, resources, and enterprise oversight, with identity, access, and governance built into the foundation.',
      capabilities: ['Identity & access', 'Organisation & tenant management', 'Operations dashboards', 'Counterparty connection'],
    },
    {
      id: 'intelligence',
      index: '04',
      title: 'Intelligence Systems',
      tagline: 'Judgment, encoded into infrastructure.',
      body: 'The intelligence layer — risk, compliance, classification, and optimisation — that turns operational signal into governed, explainable decisions.',
      capabilities: ['Risk & decisioning', 'Classification & HS-code intelligence', 'Compliance automation', 'Optimisation & foresight'],
    },
  ] as ServiceCapability[],
  account: {
    label: 'The account layer',
    title: 'One identity across the network.',
    body: 'A single Baalvion account authenticates you across every platform and property in the network. Identity is centralised, passwordless, and secured with one-time email verification — which is precisely why reliable transactional email is core infrastructure for us, not an add-on.',
  },
} as const;

/* ─────────────────────────── Email Communications (SES-critical) ─────────────────────────── */

export interface EmailType {
  kind: string;
  trigger: string;
  body: string;
}

export interface JourneyStep {
  step: string;
  title: string;
  email: string;
  body: string;
}

export const EMAIL = {
  folio: '§ 03',
  label: 'Email Communications',
  eyebrow: 'Transparency',
  title: 'How and why Baalvion sends email.',
  lede: 'Baalvion sends transactional email — messages triggered by your own actions and required to operate your account securely. We do not send unsolicited bulk email, and we do not send spam.',
  intro: [
    'Authentication on Baalvion is passwordless. Instead of storing passwords, we verify identity with one-time codes sent to your email. That makes timely, reliable email delivery a security-critical part of the service: a delayed or undelivered code means a user cannot sign in or recover access.',
    'Every message below is generated in direct response to a user action or a security event on an account the recipient owns. Recipients are people who have created a Baalvion account using their own, permanent email address.',
  ],
  types: [
    { kind: 'Account verification', trigger: 'When you register or add an email', body: 'A one-time code that confirms you control the email address before an account is activated.' },
    { kind: 'OTP / sign-in codes', trigger: 'Every time you sign in', body: 'A short-lived numeric code used in place of a password to authenticate the sign-in attempt.' },
    { kind: 'Account recovery', trigger: 'When you request access recovery', body: 'A secure code to regain access to your account. Because there are no passwords, recovery is performed entirely by email.' },
    { kind: 'Security alerts', trigger: 'On notable security events', body: 'Notice of a new sign-in, a sign-in from an unrecognised device, or a change to your account’s security settings.' },
    { kind: 'Login notifications', trigger: 'On successful sign-in', body: 'Confirmation that your account was accessed, so unexpected activity is visible to you immediately.' },
    { kind: 'Transaction confirmations', trigger: 'On account or platform transactions', body: 'Receipts and confirmations for actions you take on Baalvion platforms — orders, payments, and settlement events.' },
    { kind: 'Service notifications', trigger: 'On essential service changes', body: 'Operational notices that affect your account: policy updates, maintenance that impacts access, or required actions.' },
  ] as EmailType[],
  journey: [
    { step: '1', title: 'Register', email: 'Verification code', body: 'You create an account with your name and a permanent email address. We email a one-time code to confirm the address.' },
    { step: '2', title: 'Verify email', email: 'Confirmation', body: 'You enter the code. The address is verified and your account is activated — no password is ever set or stored.' },
    { step: '3', title: 'Sign in', email: 'Sign-in code + login notice', body: 'On each sign-in we email a one-time code. After you authenticate, a login notification confirms the access.' },
    { step: '4', title: 'Operate', email: 'Transaction & service notices', body: 'As you use Baalvion platforms, you receive receipts, confirmations, and essential service notifications.' },
    { step: '5', title: 'Stay secure', email: 'Security alerts', body: 'If we detect a new device or a sensitive change, we email a security alert so you can act immediately.' },
    { step: '6', title: 'Recover access', email: 'Recovery code', body: 'Lost access? Because login is passwordless, you simply request a fresh code by email to get back in.' },
  ] as JourneyStep[],
  commitments: [
    'We send transactional email only — triggered by the recipient’s own actions or by security events on their account.',
    'We never send unsolicited bulk email, purchased lists, or spam.',
    'Recipients always use their own, permanent email address; disposable inboxes are rejected at registration.',
    'We honour bounces and complaints, suppress addresses that hard-bounce, and monitor our sender reputation.',
    'Any optional (non-essential) communications, if offered, are strictly opt-in and include a one-click unsubscribe.',
    'Email is delivered through Amazon SES and other reputable providers, with SPF, DKIM, and DMARC alignment on the sending domain.',
  ],
} as const;

/* ─────────────────────────── Security & Trust ─────────────────────────── */

export const SECURITY = {
  folio: '§ 04',
  label: 'Security',
  eyebrow: 'Trust & protection',
  title: 'Security designed into the foundation.',
  lede: 'Baalvion treats security, isolation, and accountability as architecture — built in from the first commit, not added after the fact.',
  practices: [
    { title: 'Passwordless authentication', body: 'There are no stored passwords to steal. Identity is verified with short-lived, one-time email codes and signed sessions.' },
    { title: 'Encryption in transit', body: 'All traffic is served over HTTPS with HSTS, and sensitive data is encrypted at rest.' },
    { title: 'Tenant isolation', body: 'Each organisation’s data is isolated with row-level controls so tenants, currencies, and jurisdictions stay separated.' },
    { title: 'Least-privilege access', body: 'Staff and services hold only the access their role requires, with sensitive actions captured in an audit log.' },
    { title: 'Abuse prevention', body: 'Authentication endpoints are rate-limited and protected with human-verification to stop automated attacks.' },
    { title: 'Hardened delivery edge', body: 'Strict security headers, a content-security policy, and bot mitigation are enforced at the edge.' },
  ] as ValueItem[],
  commitments: {
    label: 'Our commitments to you',
    items: [
      'We protect your privacy and never sell your personal data.',
      'We collect the minimum data needed to operate your account.',
      'We are transparent about every email we send.',
      'We respond to security reports promptly and act on them.',
    ],
  },
  disclosure: {
    label: 'Responsible disclosure',
    body: 'If you believe you have found a security vulnerability, please report it privately to security@baalvion.com. We investigate every report and will not pursue good-faith research conducted under this policy.',
  },
} as const;

/* ─────────────────────────── Contact ─────────────────────────── */

export const CONTACT_PAGE = {
  folio: '§ 05',
  label: 'Contact',
  eyebrow: 'Get in touch',
  title: 'Speak to the foundation.',
  lede: 'Reach the right channel directly, or send a message below. We aim to respond within two business days.',
  channels: [
    { label: 'Support', desc: 'Account access, sign-in, and general help.', email: 'support@baalvion.com' },
    { label: 'Business', desc: 'Partnerships, platforms, and general enquiries.', email: 'hello@baalvion.com' },
    { label: 'Privacy', desc: 'Data requests and privacy questions.', email: 'privacy@baalvion.com' },
    { label: 'Security', desc: 'Vulnerability reports and security issues.', email: 'security@baalvion.com' },
    { label: 'Legal', desc: 'Terms, policies, and legal notices.', email: 'legal@baalvion.com' },
    { label: 'Abuse', desc: 'Report spam, abuse, or misuse.', email: 'abuse@baalvion.com' },
  ],
  company: {
    label: 'Company',
    lines: [
      'Baalvion — a multi-jurisdiction holding company for foundational infrastructure.',
      'Operating across the Americas, EMEA, and APAC.',
      'Established 2026. Postal correspondence available on request.',
    ],
  },
} as const;

/* ─────────────────────────── Trust Center ─────────────────────────── */

export interface TrustCard {
  title: string;
  body: string;
  href: string;
}

export const TRUST_CENTER = {
  folio: '§ 06',
  label: 'Trust Center',
  eyebrow: 'Security, governance & reliability',
  title: 'Trust, engineered into the foundation.',
  lede: 'Security, governance, and reliability are not disclosures added after the fact — across every domain Baalvion operates, they are architecture, applied to a single standard.',
  intro: 'This is the single index for how Baalvion protects accounts, structures accountability, and describes its own stage honestly. If you are reviewing Baalvion ahead of a partnership, an account, or an investment, start here.',
  faq: [
    {
      question: 'What is Baalvion?',
      answer: 'Baalvion is a multi-jurisdiction holding company for foundational infrastructure, designing, building, and operating the systems beneath global trade, markets, and digital ecosystems. It is organised as a corporate layer, a platform layer, and a portfolio of independent brands.',
    },
    {
      question: 'Is authentication on Baalvion passwordless?',
      answer: 'Yes. There are no stored passwords to steal — identity is verified with short-lived, one-time email codes and signed sessions, across every platform in the network.',
    },
    {
      question: 'How is tenant data isolated?',
      answer: 'Each organisation’s data is isolated with row-level controls so tenants, currencies, and jurisdictions stay separated — treated as architecture rather than configuration.',
    },
    {
      question: 'What stage is Baalvion at?',
      answer: 'Baalvion is an established, actively operated foundation (2026) — four operating domains, six live platforms, and five independent brands, held under a multi-jurisdiction posture. We describe scale in terms of what is architecturally true today.',
    },
    {
      question: 'Does Baalvion hold formal security or regulatory certifications?',
      answer: 'Certifications and regulatory registrations are disclosed here as, and only as, they are obtained. Baalvion does not claim standards it has not been independently assessed against.',
    },
  ],
} as const;

/* ─────────────────────────── Trust — Governance ─────────────────────────── */

export interface StructureBlock {
  title: string;
  body: string;
}

export const GOVERNANCE = {
  folio: '§ 07',
  label: 'Governance',
  eyebrow: 'Regulatory posture',
  title: 'Governance is architecture, not an afterthought.',
  lede: 'Baalvion is structured as a multi-jurisdiction holding company: a corporate apex, an operating platform layer, and a portfolio of independent brands — each accountable, isolated, and held to the same standard.',
  structure: {
    label: 'How the foundation is structured',
    body: 'A corporate layer sets standard, governance, and stewardship. A platform layer operates the systems institutions run on. A portfolio of independent brands extends the foundation into distinct markets, each operated at arm’s length, sharing infrastructure and discipline rather than identity. No layer inherits authority it has not been given; each is accountable for what it operates.',
  },
  isolation: {
    label: 'Jurisdiction & isolation',
    body: 'Baalvion is built to operate across borders, not merely to reach them. Data residency, tenant isolation, regulatory regimes, and sanctions posture are treated as architecture rather than configuration — each tenant, each currency, and each jurisdiction stays isolated from the next by design, not by policy alone.',
  },
  accountability: {
    label: 'Accountability',
    items: [
      'Every account on the network is authenticated through one identity layer, so access and its audit trail are never fragmented across domains.',
      'Sensitive actions are logged and access is scoped to least privilege, in line with the practices published on the Security page.',
      'Formal certifications and regulatory registrations are disclosed here as, and only as, they are obtained — we do not claim standards we have not been independently assessed against.',
    ],
  },
} as const;

/* ─────────────────────────── Trust — Reliability ─────────────────────────── */

export const RELIABILITY = {
  folio: '§ 08',
  label: 'Platform Reliability',
  eyebrow: 'Architecture & stage',
  title: 'What is live, what is being built, stated plainly.',
  lede: 'Baalvion operates real infrastructure today and is actively extending it. We describe the difference between the two directly, rather than let one borrow credibility from the other.',
  today: {
    label: 'The operating fabric, today',
    body: 'Each of the four domains — Trade, Markets, Ecosystem, and Intelligence — corresponds to a live platform in the network, reachable from the homepage index. These are operating environments, not concept pages: they carry their own uptime, their own release cadence, and their own operational scope.',
  },
  identity: {
    label: 'The identity layer',
    body: 'One passwordless account authenticates every user across every platform and property in the network. Identity is centralised and verified by one-time email code rather than a stored password — a deliberate, live piece of shared infrastructure underneath everything else described on this site.',
  },
  principle: {
    label: 'The reliability standard',
    body: 'Permanence over momentum: infrastructure is judged by what it withstands, not what it promises. Systems before features: we solve for the whole, because coherent, composable infrastructure outlasts any single product built on it.',
  },
  stage: {
    label: 'Our stage, stated honestly',
    body: 'Baalvion is an established, actively operated foundation (2026) — four operating domains, six live platforms, and five independent brands, held under a multi-jurisdiction posture. We describe scale in terms of what is architecturally true today, and update this page as that changes.',
  },
} as const;

/* ─────────────────────────── Solutions ─────────────────────────── */

export interface AudienceCard {
  title: string;
  body: string;
  href: string;
}

export const SOLUTIONS_HUB = {
  folio: '§ 09',
  label: 'Solutions',
  eyebrow: 'Who engages with the foundation',
  title: 'One foundation. Built for every counterpart that depends on it.',
  lede: 'Baalvion is engaged differently depending on who you are — an institution operating on one of our platforms, a financial partner, a regulator, a partner extending the network, or an investor evaluating the foundation itself. The foundation is the same; how you meet it differs.',
  audiences: [
    { title: 'Enterprises & Institutions', body: 'Operating environments built for institutional dependence, across trade, markets, ecosystem, and intelligence.', href: '/solutions/enterprises' },
    { title: 'Financial Institutions', body: 'Settlement, ledgering, and reconciliation built to institutional tolerance.', href: '/solutions/financial-institutions' },
    { title: 'Governments & Regulators', body: 'Infrastructure designed to be examined — isolation and compliance as structural properties, not disclosures.', href: '/solutions/governments' },
    { title: 'Partners', body: 'Extend the foundation into a market or capability we do not reach alone.', href: '/partners' },
    { title: 'Investors', body: 'A long-horizon foundation, evaluated on its own terms.', href: '/investors' },
  ] as AudienceCard[],
} as const;

export interface SolutionSection {
  heading: string;
  body: string;
}

export interface SolutionPage {
  folio: string;
  label: string;
  eyebrow: string;
  title: string;
  lede: string;
  sections: SolutionSection[];
  closing: string;
  cta: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

export const SOLUTIONS_ENTERPRISES: SolutionPage = {
  folio: '§ 10',
  label: 'Solutions — Enterprises & Institutions',
  eyebrow: 'For enterprises & institutions',
  title: 'Operating environments built for institutional dependence.',
  lede: 'If your organisation runs on one of Baalvion’s platforms — trade, markets, ecosystem, or intelligence — you are depending on infrastructure engineered for permanence, not a product optimised for growth metrics.',
  sections: [
    {
      heading: 'Built on one operational fabric',
      body: 'Every platform in the network is wired back to the same core of identity, governance, settlement, and intelligence. Adopting one domain does not mean integrating with an isolated product — it means joining a fabric designed to extend coherently as your dependence on it grows.',
    },
    {
      heading: 'One identity, one audit trail',
      body: 'A single passwordless Baalvion account authenticates your organisation’s access across every platform it uses. Access is scoped to least privilege and sensitive actions are logged, so accountability is never fragmented across the systems you depend on.',
    },
    {
      heading: 'Isolation you can rely on',
      body: 'Tenant isolation, data residency, and jurisdictional posture are structural properties of the platform layer, not configuration options — detailed in full on the Governance and Security pages of the Trust Center.',
    },
  ],
  closing: 'See the domain your organisation would run on, or review the isolation and access model behind it.',
  cta: { label: 'Explore Platform & Services', href: '/services' },
  ctaSecondary: { label: 'Review the Trust Center', href: '/trust' },
};

export const SOLUTIONS_FINANCIAL: SolutionPage = {
  folio: '§ 11',
  label: 'Solutions — Financial Institutions',
  eyebrow: 'For financial institutions',
  title: 'Settlement, ledgering, and reconciliation built to institutional tolerance.',
  lede: 'Baalvion’s Market & Financial Systems domain is designed for counterparties that must reconcile to the cent — deterministic ledgering, server-authoritative money movement, and treasury infrastructure built for institutional scrutiny.',
  sections: [
    {
      heading: 'Correctness before convenience',
      body: 'Pricing, treasury, ledgering, and reconciliation are built to institutional tolerances. Every money movement is server-authoritative and traceable — a question of correctness first, not a UI convenience layered over an unreliable core.',
    },
    {
      heading: 'Reconcilable by design',
      body: 'Double-entry ledgering and reconciliation are foundational to the domain, not an add-on report generated after the fact. This is the same discipline described on the Reliability page of the Trust Center, applied specifically to money movement.',
    },
    {
      heading: 'Where this connects',
      body: 'Market & Financial Systems shares its identity, isolation, and governance model with every other domain in the network — reviewed in full on the Governance page.',
    },
  ],
  closing: 'Review the domain directly, or speak to the team accountable for it.',
  cta: { label: 'Explore Market & Financial Systems', href: '/services#markets' },
  ctaSecondary: { label: 'Speak to the foundation', href: '/contact' },
};

export const SOLUTIONS_GOVERNMENTS: SolutionPage = {
  folio: '§ 12',
  label: 'Solutions — Governments & Regulators',
  eyebrow: 'For governments & regulators',
  title: 'Infrastructure designed to be examined.',
  lede: 'Baalvion treats regulatory engagement as a first-class input, not a constraint applied after the fact. Isolation, jurisdictional posture, and compliance are structural properties of the foundation, and we welcome scrutiny of how they are implemented.',
  sections: [
    {
      heading: 'Compliance as architecture',
      body: 'Compliance and sanctions screening are part of the Trade Infrastructure domain’s core design, not a bolt-on integration — and the same isolation principle applies across every other domain the foundation operates.',
    },
    {
      heading: 'Multi-jurisdiction by design',
      body: 'Data residency, tenant isolation, and jurisdiction-specific regulatory regimes are treated as architecture rather than configuration, detailed in full on the Governance page of the Trust Center.',
    },
    {
      heading: 'A direct channel',
      body: 'Regulatory and government enquiries are routed to the same team accountable for legal and compliance posture — reach us directly rather than through a general enquiry form.',
    },
  ],
  closing: 'Review how governance is structured, or reach the team directly.',
  cta: { label: 'Review Governance', href: '/trust/governance' },
  ctaSecondary: { label: 'Contact the foundation', href: '/contact' },
};

/* ─────────────────────────── Partners ─────────────────────────── */

export const PARTNERS_PAGE: SolutionPage = {
  folio: '§ 13',
  label: 'Partners',
  eyebrow: 'Extend the foundation',
  title: 'Extend the foundation, without extending the risk.',
  lede: 'Baalvion’s platform layer and independent brand portfolio both depend on external partners — technology integrators, financial institutions, and operators who extend a domain into a market we do not reach alone.',
  sections: [
    {
      heading: 'Platform integration partners',
      body: 'Organisations that connect their own systems to a Baalvion platform — extending trade, market, ecosystem, or intelligence infrastructure into workflows we do not build ourselves.',
    },
    {
      heading: 'Financial & settlement partners',
      body: 'Institutions that participate in or extend the Market & Financial Systems domain, where reconciliation, custody, and settlement discipline matter most.',
    },
    {
      heading: 'Portfolio & brand operators',
      body: 'The independent brands in the network are operated at arm’s length under the foundation’s standard. Partnership at this layer means operating a distinct brand while sharing infrastructure and discipline, not identity.',
    },
  ],
  closing: 'Tell us which layer you’re looking to extend, and we’ll route it to the right team.',
  cta: { label: 'Start a partnership conversation', href: '/contact' },
};

/* ─────────────────────────── Investors ─────────────────────────── */

export const INVESTORS_PAGE = {
  folio: '§ 14',
  label: 'Investors',
  eyebrow: 'The long-horizon thesis',
  title: 'A long-horizon foundation, evaluated on its own terms.',
  lede: 'Baalvion is built and capitalised for permanence rather than a cycle. This page states the posture plainly; the full long-horizon thesis is maintained at ir.baalvion.com.',
  points: [
    'Four operating domains — trade, markets, ecosystem, and intelligence — wired to one operational fabric rather than assembled as unrelated bets.',
    'A three-layer structure (corporate, platform, portfolio) that lets independent brands compound the foundation’s infrastructure without diluting its standard.',
    'Governance, isolation, and accountability designed in from the foundation up — reviewed in full in the Trust Center.',
    'Capital, ownership, and decisions held for continuity: the foundation is structured so that patience compounds rather than erodes.',
  ],
  cta: { label: 'Read the long-horizon thesis', href: 'https://ir.baalvion.com' },
  ctaSecondary: { label: 'Investor enquiries', href: 'mailto:hello@baalvion.com' },
} as const;

/* ─────────────────────────── Careers ─────────────────────────── */

export const CAREERS_PAGE = {
  folio: '§ 15',
  label: 'Careers',
  eyebrow: 'Work across the foundation',
  title: 'Work on infrastructure meant to outlast you.',
  lede: 'Baalvion does not host its own listings on this page — talent across the network is coordinated through the Talent platform, the same connective layer described in Platform & Services.',
  body: 'Roles across the foundation span all four domains: trade and logistics engineering, market and financial systems, ecosystem and identity platforms, and applied intelligence — alongside the governance, security, and operating functions that hold the foundation together. Open roles, across the corporate layer, the platform layer, and the portfolio, are listed on the Talent platform.',
  cta: { label: 'View open roles on the Talent platform', href: 'https://jobs.baalvion.com' },
  ctaSecondary: { label: 'Introduce yourself directly', href: 'mailto:hello@baalvion.com' },
} as const;
