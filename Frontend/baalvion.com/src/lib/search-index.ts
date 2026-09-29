import { EXTERNAL, ROUTES } from './content';

export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  /** Off-network domain — rendered with the outbound glyph, no client-side route. */
  external?: boolean;
}

/**
 * Static search index for the on-site command palette. Every entry mirrors a
 * real, emitted route or a real property in the network — nothing here is
 * speculative, so the index only needs updating when a page is actually added.
 */
export const SEARCH_INDEX: SearchEntry[] = [
  { title: 'Home', description: 'Baalvion — global infrastructure intelligence.', href: ROUTES.home },
  { title: 'About Baalvion', description: 'Mission, vision, values, and what stage the foundation is at.', href: ROUTES.about },
  { title: 'Platform & Services', description: 'The four domains — Trade, Markets, Ecosystem, Intelligence.', href: ROUTES.services },
  { title: 'Trust Center', description: 'Security, governance, and reliability — the single index for trust.', href: ROUTES.trust },
  { title: 'Security', description: 'Passwordless auth, encryption, tenant isolation, responsible disclosure.', href: ROUTES.security },
  { title: 'Governance', description: 'Jurisdiction, accountability, and regulatory posture.', href: ROUTES.trustGovernance },
  { title: 'Platform Reliability', description: 'What is live, what is being built, stated plainly.', href: ROUTES.trustReliability },
  { title: 'Solutions', description: 'Who engages with the foundation, and how.', href: ROUTES.solutions },
  { title: 'Solutions — Enterprises & Institutions', description: 'Operating environments built for institutional dependence.', href: ROUTES.solutionsEnterprises },
  { title: 'Solutions — Financial Institutions', description: 'Settlement and ledgering built to institutional tolerance.', href: ROUTES.solutionsFinancial },
  { title: 'Solutions — Governments & Regulators', description: 'Infrastructure designed to be examined.', href: ROUTES.solutionsGovernments },
  { title: 'Partners', description: 'Extend the foundation into a market we do not reach alone.', href: ROUTES.partners },
  { title: 'Investors', description: 'The long-horizon thesis, stated plainly on-site.', href: ROUTES.investors },
  { title: 'Careers', description: 'Work across the foundation — routed to the Talent platform.', href: ROUTES.careers },
  { title: 'Email Communications', description: 'How and why Baalvion sends transactional email.', href: ROUTES.email },
  { title: 'Contact', description: 'Reach support, business, privacy, security, or legal directly.', href: ROUTES.contact },
  { title: 'Sign in', description: 'Sign in to your Baalvion account.', href: ROUTES.signin },
  { title: 'Create an account', description: 'Register for a Baalvion account.', href: ROUTES.register },
  { title: 'Account recovery', description: 'Regain access to your account.', href: ROUTES.recovery },
  { title: 'Privacy Policy', description: 'How Baalvion collects, uses, and protects personal data.', href: ROUTES.privacy },
  { title: 'Terms of Service', description: 'The terms governing use of Baalvion platforms.', href: ROUTES.terms },
  { title: 'Cookie Policy', description: 'How Baalvion uses cookies and similar technologies.', href: ROUTES.cookies },
  { title: 'Acceptable Use Policy', description: 'What is and isn’t permitted on Baalvion platforms.', href: ROUTES.acceptableUse },
  { title: 'Data Protection', description: 'Data protection commitments and practices.', href: ROUTES.dataProtection },
  { title: 'Global Trade', description: 'Cross-border trade infrastructure and settlement.', href: 'https://trade.baalvion.com', external: true },
  { title: 'Mining & Resources', description: 'Resource and commodity operations infrastructure.', href: 'https://mining.baalvion.com', external: true },
  { title: 'Markets', description: 'Financial and market systems at institutional tolerance.', href: 'https://market.baalvion.com', external: true },
  { title: 'Talent', description: 'The connective layer for institutional talent.', href: EXTERNAL.talent, external: true },
  { title: 'Connect', description: 'Where institutions and counterparties transact.', href: 'https://connect.baalvion.com', external: true },
  { title: 'Enterprise Access', description: 'The operator’s command surface across the stack.', href: 'https://dashboard.baalvion.com', external: true },
  { title: 'About Baalvion — institutional record', description: 'The full institutional record, at about.baalvion.com.', href: EXTERNAL.about, external: true },
  { title: 'Investor Relations — full thesis', description: 'The long-horizon investment thesis, at ir.baalvion.com.', href: EXTERNAL.ir, external: true },
];
