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
      index: '01',
      title: 'Trade Infrastructure',
      tagline: 'The rails beneath global commerce.',
      body: 'Systems that move goods, documents, and trust across borders — deterministic workflows, verifiable compliance, and settlement that holds under scrutiny.',
      capabilities: ['Customs & documentation', 'Cross-border settlement', 'Compliance & sanctions screening', 'Logistics orchestration'],
    },
    {
      index: '02',
      title: 'Market & Financial Systems',
      tagline: 'The discipline beneath capital.',
      body: 'Pricing, treasury, ledgering, and reconciliation built to institutional tolerances. Every money movement is server-authoritative, traceable, and reconcilable to the cent.',
      capabilities: ['Pricing & FX', 'Treasury & wallets', 'Double-entry ledgering', 'Reconciliation & settlement'],
    },
    {
      index: '03',
      title: 'Ecosystem Platforms',
      tagline: 'Where institutions connect and operate.',
      body: 'Operating environments for trade, talent, resources, and enterprise oversight, with identity, access, and governance built into the foundation.',
      capabilities: ['Identity & access', 'Organisation & tenant management', 'Operations dashboards', 'Counterparty connection'],
    },
    {
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
