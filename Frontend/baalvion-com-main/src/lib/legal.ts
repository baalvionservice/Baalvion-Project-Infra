/**
 * Legal corpus for baalvion.com. Every policy is rendered on-site (never linked
 * off to another property) so the company's binding terms are first-party,
 * versioned, and reachable from the footer of every page.
 *
 * Voice matches the rest of the charter: precise, plain, and defensible. No
 * invented certifications, regulators, or registration numbers — claims are
 * limited to controls the platform actually operates.
 */

export const LEGAL_EFFECTIVE = '30 June 2026';
export const LEGAL_ENTITY = 'Baalvion';

export interface LegalSection {
  heading: string;
  /** Ordinary paragraphs. */
  paragraphs?: string[];
  /** Rendered as a bulleted list beneath the paragraphs. */
  bullets?: string[];
}

export interface LegalDoc {
  slug: string;
  /** Footer / nav label. */
  shortTitle: string;
  title: string;
  summary: string;
  sections: LegalSection[];
}

const PRIVACY: LegalDoc = {
  slug: 'privacy',
  shortTitle: 'Privacy Policy',
  title: 'Privacy Policy',
  summary:
    'How Baalvion collects, uses, protects, and shares personal data across baalvion.com and the platforms operated beneath it.',
  sections: [
    {
      heading: '1. Scope',
      paragraphs: [
        'This Privacy Policy explains how Baalvion handles personal data when you visit baalvion.com, create or access a Baalvion account, or communicate with us. It applies to the corporate site and to the account and identity layer shared across Baalvion subdomains.',
        'Independent brands in the portfolio may publish their own privacy notices for product-specific processing; where they do, those notices govern that product and this policy governs the corporate and identity surface.',
      ],
    },
    {
      heading: '2. Data we collect',
      paragraphs: ['We collect only what we need to operate the account and the site:'],
      bullets: [
        'Account data you provide — your first name, last name, and email address when you create an account or request a sign-in code.',
        'Authentication events — the time, approximate location (derived from IP), and device or browser of sign-in and verification requests, used to secure the account.',
        'Communications — messages you send to our support, security, privacy, or legal channels, and our replies.',
        'Technical data — IP address, browser type, and pages requested, processed in server logs to keep the service available and to detect abuse.',
        'Cookies strictly necessary for sign-in and security. See the Cookie Policy for detail.',
      ],
    },
    {
      heading: '3. What we do not do',
      bullets: [
        'We do not store account passwords. Authentication is passwordless — access is granted through one-time codes sent to your verified email.',
        'We do not sell personal data.',
        'We do not send unsolicited bulk email or marketing email to addresses that have not opted in.',
        'We do not use your data to build advertising profiles or to track you across unrelated third-party sites.',
      ],
    },
    {
      heading: '4. How we use data',
      bullets: [
        'To create and authenticate your account and keep you signed in across Baalvion properties.',
        'To send transactional email — verification codes, sign-in notifications, security alerts, password/account-recovery messages, and service notices. See the Email Communications page for the full list.',
        'To respond to your support, security, legal, and privacy enquiries.',
        'To secure the platform: detect, investigate, and prevent fraud, abuse, and unauthorised access.',
        'To meet legal, accounting, and regulatory obligations.',
      ],
    },
    {
      heading: '5. Legal bases',
      paragraphs: [
        'Where the GDPR or equivalent law applies, we rely on: performance of a contract (operating your account); our legitimate interests (securing the platform and preventing abuse); your consent (any non-essential cookies or optional communications); and compliance with legal obligations.',
      ],
    },
    {
      heading: '6. Email and our service providers',
      paragraphs: [
        'Transactional email is delivered through reputable infrastructure providers, including Amazon Simple Email Service (Amazon SES) operated by Amazon Web Services. These providers process message metadata and delivery events strictly to send our mail and report on its delivery; they are bound by contract and do not use the content for their own purposes.',
        'We share personal data with processors only under written agreements, only for the purposes described here, and only to the extent necessary.',
      ],
    },
    {
      heading: '7. International transfers',
      paragraphs: [
        'Baalvion operates across multiple jurisdictions. Where personal data is transferred across borders, we use recognised safeguards such as Standard Contractual Clauses and provider data-processing terms, and we apply tenant and data-residency isolation as part of the platform architecture.',
      ],
    },
    {
      heading: '8. Retention',
      paragraphs: [
        'We keep personal data only as long as necessary for the purpose it was collected, to meet legal obligations, or to resolve disputes. Account data persists while your account is active; authentication and delivery logs are retained for a limited period for security and then deleted or anonymised.',
      ],
    },
    {
      heading: '9. Your rights',
      paragraphs: ['Subject to applicable law, you may:'],
      bullets: [
        'Access the personal data we hold about you.',
        'Correct inaccurate or incomplete data.',
        'Delete your account and associated data.',
        'Object to or restrict certain processing.',
        'Request a portable copy of data you provided.',
        'Withdraw consent where processing is based on consent.',
      ],
    },
    {
      heading: '10. Security',
      paragraphs: [
        'We protect data with encryption in transit (TLS), passwordless authentication, signed sessions, tenant isolation, least-privilege access, and audit logging. No system is perfectly secure, but security is designed into the foundation rather than added afterward. See the Security page for more.',
      ],
    },
    {
      heading: '11. Children',
      paragraphs: [
        'Baalvion services are intended for businesses and adults. We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us and we will delete it.',
      ],
    },
    {
      heading: '12. Changes and contact',
      paragraphs: [
        'We may update this policy and will revise the effective date above. Material changes affecting your rights will be notified where appropriate.',
        'For any privacy request or question, contact privacy@baalvion.com.',
      ],
    },
  ],
};

const TERMS: LegalDoc = {
  slug: 'terms',
  shortTitle: 'Terms of Service',
  title: 'Terms of Service',
  summary:
    'The agreement governing your use of baalvion.com and the accounts and services operated beneath it.',
  sections: [
    {
      heading: '1. Agreement',
      paragraphs: [
        'These Terms of Service govern your access to and use of baalvion.com and the account, identity, and informational services Baalvion provides through it. By using the site or creating an account, you agree to these Terms. If you use Baalvion on behalf of an organisation, you confirm you are authorised to bind that organisation.',
      ],
    },
    {
      heading: '2. Accounts',
      bullets: [
        'You must provide accurate registration details and a permanent, working email address. Disposable or temporary inboxes are not accepted.',
        'Authentication is passwordless. You are responsible for maintaining control of the email address tied to your account, because access is granted through codes sent to it.',
        'You are responsible for activity that occurs under your account and must notify security@baalvion.com of any suspected unauthorised access.',
        'You must be old enough to form a binding contract in your jurisdiction.',
      ],
    },
    {
      heading: '3. Acceptable use',
      paragraphs: [
        'Your use of Baalvion is subject to the Acceptable Use Policy, which is incorporated into these Terms. In short, do not break the law, do not abuse or attack the platform, and do not infringe the rights of others.',
      ],
    },
    {
      heading: '4. Communications',
      paragraphs: [
        'By creating an account you agree to receive transactional email necessary to operate that account — verification codes, security alerts, account-recovery messages, and essential service notices. These are not marketing and cannot be unsubscribed from while the account is active, because they are part of the service. Optional communications, if offered, are opt-in and can be turned off. See the Email Communications page.',
      ],
    },
    {
      heading: '5. Intellectual property',
      paragraphs: [
        'The site, its content, the Baalvion name, wordmark, and design are owned by Baalvion or its licensors and are protected by intellectual-property law. These Terms grant you no right to use Baalvion branding without prior written permission.',
      ],
    },
    {
      heading: '6. Third-party links and brands',
      paragraphs: [
        'baalvion.com references platforms and independent portfolio brands operated under the Baalvion foundation. Those properties may have their own terms; your use of them is governed by their terms, not these.',
      ],
    },
    {
      heading: '7. Disclaimers',
      paragraphs: [
        'The site is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, Baalvion disclaims implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the site will be uninterrupted or error-free.',
      ],
    },
    {
      heading: '8. Limitation of liability',
      paragraphs: [
        'To the maximum extent permitted by law, Baalvion is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits or data, arising from your use of the site. Nothing in these Terms excludes liability that cannot lawfully be excluded.',
      ],
    },
    {
      heading: '9. Suspension and termination',
      paragraphs: [
        'We may suspend or terminate access for breach of these Terms or the Acceptable Use Policy, to protect the platform or other users, or to comply with law. You may stop using the service and request account deletion at any time.',
      ],
    },
    {
      heading: '10. Changes',
      paragraphs: [
        'We may update these Terms and will revise the effective date above. Continued use after changes take effect constitutes acceptance.',
      ],
    },
    {
      heading: '11. Governing law and contact',
      paragraphs: [
        'These Terms are governed by the laws of the applicable Baalvion operating jurisdiction, without regard to conflict-of-law rules. Questions about these Terms may be sent to legal@baalvion.com.',
      ],
    },
  ],
};

const COOKIES: LegalDoc = {
  slug: 'cookies',
  shortTitle: 'Cookie Policy',
  title: 'Cookie Policy',
  summary: 'What cookies and similar technologies baalvion.com uses, and why.',
  sections: [
    {
      heading: '1. What cookies are',
      paragraphs: [
        'Cookies are small text files stored on your device. Similar technologies include local storage and session tokens. We use a deliberately small set, focused on keeping you signed in and the platform secure.',
      ],
    },
    {
      heading: '2. Cookies we use',
      bullets: [
        'Strictly necessary — session and authentication cookies that keep you signed in across Baalvion subdomains and protect against cross-site request forgery. The platform cannot function without these.',
        'Security — short-lived tokens used during sign-in and human-verification (Cloudflare Turnstile) to prevent automated abuse.',
        'Preferences — where applicable, a cookie that remembers basic interface choices.',
      ],
    },
    {
      heading: '3. What we do not use',
      paragraphs: [
        'baalvion.com does not use advertising cookies, cross-site tracking pixels, or third-party marketing trackers. We do not sell or share cookie data for advertising.',
      ],
    },
    {
      heading: '4. Managing cookies',
      paragraphs: [
        'You can block or delete cookies in your browser settings. Because our authentication relies on strictly necessary cookies, disabling them will prevent you from signing in. Where non-essential cookies are used, they are set only with your consent and can be withdrawn.',
      ],
    },
    {
      heading: '5. Contact',
      paragraphs: ['Questions about cookies can be sent to privacy@baalvion.com.'],
    },
  ],
};

const ACCEPTABLE_USE: LegalDoc = {
  slug: 'acceptable-use',
  shortTitle: 'Acceptable Use Policy',
  title: 'Acceptable Use Policy',
  summary: 'The conduct required of everyone who uses Baalvion services.',
  sections: [
    {
      heading: '1. Purpose',
      paragraphs: [
        'This Acceptable Use Policy protects Baalvion, its users, and the wider internet. It applies to everyone who accesses baalvion.com or any service operated beneath it, and is incorporated into the Terms of Service.',
      ],
    },
    {
      heading: '2. You must not',
      bullets: [
        'Use the service for any unlawful purpose or in violation of any applicable regulation, sanction, or export-control regime.',
        'Attempt to gain unauthorised access to any account, system, or network, or probe, scan, or test the vulnerability of our systems without written authorisation.',
        'Interfere with or disrupt the service — including denial-of-service attempts, flooding, or overloading infrastructure.',
        'Send spam, unsolicited bulk messages, or phishing, or harvest addresses or data from the platform.',
        'Upload or transmit malware, or content that infringes intellectual-property, privacy, or other rights.',
        'Impersonate any person or entity, or misrepresent your affiliation.',
        'Circumvent authentication, rate limits, tenant isolation, or other security or access controls.',
        'Use the service to harass, defame, or harm others, or to distribute illegal content.',
      ],
    },
    {
      heading: '3. Email and anti-abuse',
      paragraphs: [
        'Baalvion sends transactional email only. Using any Baalvion system to relay spam, to send mail to non-consenting recipients, or to damage our sender reputation is strictly prohibited and will result in immediate suspension.',
      ],
    },
    {
      heading: '4. Enforcement',
      paragraphs: [
        'We may investigate suspected violations and may suspend or terminate access, remove content, and cooperate with law enforcement. We may act immediately where there is risk to the platform or to others.',
      ],
    },
    {
      heading: '5. Reporting',
      paragraphs: [
        'Report abuse, security issues, or suspected violations to abuse@baalvion.com or security@baalvion.com.',
      ],
    },
  ],
};

const DATA_PROTECTION: LegalDoc = {
  slug: 'data-protection',
  shortTitle: 'Data Protection Policy',
  title: 'Data Protection Policy',
  summary:
    'The organisational and technical commitments Baalvion makes to protect personal data, complementing the Privacy Policy.',
  sections: [
    {
      heading: '1. Principles',
      paragraphs: ['Baalvion handles personal data according to established data-protection principles:'],
      bullets: [
        'Lawfulness, fairness, and transparency.',
        'Purpose limitation — data is used only for the purposes for which it was collected.',
        'Data minimisation — we collect the least data necessary.',
        'Accuracy — we keep data correct and current.',
        'Storage limitation — we retain data only as long as needed.',
        'Integrity and confidentiality — data is secured against loss and unauthorised access.',
        'Accountability — we can demonstrate compliance with these principles.',
      ],
    },
    {
      heading: '2. Technical measures',
      bullets: [
        'Encryption of data in transit using TLS, and encryption of sensitive data at rest.',
        'Passwordless authentication and signed, short-lived sessions — no stored passwords to leak.',
        'Tenant isolation and row-level access controls so each organisation’s data stays separated.',
        'Least-privilege access for staff and services, with audit logging of sensitive actions.',
        'Rate limiting, abuse detection, and human-verification on authentication endpoints.',
      ],
    },
    {
      heading: '3. Organisational measures',
      bullets: [
        'Access to personal data is restricted to those who need it for their role.',
        'Processors are engaged only under written data-processing agreements.',
        'Security and privacy are reviewed as part of how systems are designed and changed.',
      ],
    },
    {
      heading: '4. Processors and sub-processors',
      paragraphs: [
        'We use vetted infrastructure providers, including Amazon Web Services (Amazon SES for transactional email) and Cloudflare (edge delivery and bot mitigation). Each processes data only on our instructions and under contract. A current list of material sub-processors is available on request to privacy@baalvion.com.',
      ],
    },
    {
      heading: '5. Data-subject requests and breach response',
      paragraphs: [
        'We respond to data-subject requests within the timeframes required by applicable law. In the event of a personal-data breach that poses a risk to individuals, we will assess, contain, and notify affected parties and regulators as required.',
      ],
    },
    {
      heading: '6. Contact',
      paragraphs: [
        'For data-protection matters, including to exercise your rights or request our sub-processor list, contact privacy@baalvion.com.',
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  privacy: PRIVACY,
  terms: TERMS,
  cookies: COOKIES,
  'acceptable-use': ACCEPTABLE_USE,
  'data-protection': DATA_PROTECTION,
};

export const LEGAL_INDEX: LegalDoc[] = [
  PRIVACY,
  TERMS,
  COOKIES,
  ACCEPTABLE_USE,
  DATA_PROTECTION,
];
