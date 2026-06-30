/**
 * @fileOverview Law Elite Network — bundled author/contributor profiles.
 *
 * E-E-A-T baseline for the public knowledge site. Every byline on the network
 * resolves to a real contributor profile here (name, focus areas, credentials,
 * biography) so reader-facing pages and Person/Article structured data can show
 * who wrote and reviewed each guide. The central CMS (admin.baalvion.com) wins
 * when it returns an author record; these profiles fill the gap so the site is
 * never anonymous for readers or crawlers.
 *
 * Contributors are legal writers and editors. Their work is general legal
 * education for a worldwide audience — it is NOT jurisdiction-specific legal
 * advice, and a profile here does not imply an attorney–client relationship.
 */

export interface LawAuthor {
  /** URL slug — /author/{slug}. */
  slug: string;
  name: string;
  /** Editorial role, e.g. "Corporate & Securities Editor". */
  title: string;
  /** Short credential line shown under the byline. */
  credentials: string;
  /** Multi-sentence biography (plain text; rendered as paragraphs). */
  bio: string;
  /** Focus areas — align with the site's category names. */
  expertise: string[];
  /** Stable seed for the deterministic editorial portrait. */
  avatarSeed: string;
  /** Optional explicit portrait URL (CMS-managed authors); overrides the seed. */
  avatarUrl?: string;
  /** Optional public profile links. */
  social?: { x?: string; linkedin?: string };
}

export const LAW_AUTHORS: LawAuthor[] = [
  {
    slug: 'elena-rossi',
    name: 'Elena Rossi',
    title: 'Corporate & Securities Editor',
    credentials: 'LL.M. Corporate Law · 12+ years covering company and securities law',
    bio:
      'Elena Rossi leads Law Elite Network’s coverage of corporate structure, shareholder arrangements, and securities fundamentals. She has spent more than a decade translating dense company-law concepts — from incorporation and share classes to founder agreements and governance — into guidance that founders, directors, and investors can actually use. ' +
      'Her explainers focus on the questions that recur across jurisdictions: what a shareholders’ agreement should protect, how ownership and control come apart, and where standard templates quietly fail. Elena reviews each corporate guide on the network for accuracy and balance before publication.',
    expertise: ['Business & Corporate', 'Tax & Finance'],
    avatarSeed: 'elena-rossi',
    social: { linkedin: 'https://www.linkedin.com/company/law-elite-network' },
  },
  {
    slug: 'marcus-hale',
    name: 'Marcus Hale',
    title: 'Technology & Data Protection Editor',
    credentials: 'J.D. · 10+ years in technology, IP, and privacy law',
    bio:
      'Marcus Hale writes Law Elite Network’s technology, intellectual-property, and data-protection coverage. His work tracks how privacy regimes such as the GDPR and CCPA, trademark and copyright systems, and platform regulation actually affect founders and product teams. ' +
      'Marcus is known for cutting through acronyms — explaining what “processor” versus “controller” means in practice, when a trademark beats a copyright, and how company formation choices ripple into data obligations later. He edits the network’s IP and privacy guides.',
    expertise: ['Technology & IP', 'Business & Corporate'],
    avatarSeed: 'marcus-hale',
    social: { x: 'https://x.com/lawelitenetwork' },
  },
  {
    slug: 'priya-menon',
    name: 'Priya Menon',
    title: 'Startups & Venture Contributor',
    credentials: 'LL.B. · Startup and early-stage venture legal writer',
    bio:
      'Priya Menon covers the legal groundwork of building a company: entity choice, founder equity and vesting, cap tables, early fundraising, and the contracts a young business signs before it can afford counsel. ' +
      'She writes for the founder who needs to understand the trade-offs before talking to a lawyer, not after. Priya’s startup-law explainers are designed to be read at 11pm the night before a decision has to be made.',
    expertise: ['Business & Corporate'],
    avatarSeed: 'priya-menon',
  },
  {
    slug: 'sofia-almeida',
    name: 'Sofia Almeida',
    title: 'Family Law Editor',
    credentials: 'LL.M. Family Law · 14+ years writing on family and matrimonial law',
    bio:
      'Sofia Almeida heads family-law coverage at Law Elite Network, with a focus on divorce, financial settlement, and the practical mechanics of separating two lives. She writes with the understanding that readers arrive at these guides during some of the hardest weeks of their lives. ' +
      'Her work explains process and options without alarmism — what the steps are, what tends to be negotiable, and when a person genuinely needs a lawyer rather than a template. Sofia reviews the network’s family and personal-law guides.',
    expertise: ['Family & Personal'],
    avatarSeed: 'sofia-almeida',
    social: { linkedin: 'https://www.linkedin.com/company/law-elite-network' },
  },
  {
    slug: 'rajesh-iyer',
    name: 'Rajesh Iyer',
    title: 'Family & Children’s Law Contributor',
    credentials: 'LL.B. · Family law writer focused on custody and child welfare',
    bio:
      'Rajesh Iyer writes Law Elite Network’s coverage of child custody, parenting arrangements, and the welfare standards courts apply when families restructure. He is careful to separate what the law actually weighs — the best interests of the child — from the myths that surround custody disputes. ' +
      'His guides walk parents through arrangements, modification, and the evidence that matters, while steering them toward qualified local counsel for their specific situation.',
    expertise: ['Family & Personal'],
    avatarSeed: 'rajesh-iyer',
  },
  {
    slug: 'eleanor-whitfield',
    name: 'Eleanor Whitfield',
    title: 'Estate Planning & Probate Editor',
    credentials: 'LL.M. · 15+ years in wills, trusts, and estate planning',
    bio:
      'Eleanor Whitfield covers wills, estate planning, and probate for Law Elite Network. She has spent fifteen years writing about how people pass on what they own — and how avoidable mistakes in a will or a beneficiary form unravel decades of intentions. ' +
      'Her explainers cover what makes a will valid, why witnessing rules matter, and the difference between planning that survives a challenge and planning that doesn’t. Eleanor edits the network’s estate and succession guides.',
    expertise: ['Family & Personal'],
    avatarSeed: 'eleanor-whitfield',
    social: { linkedin: 'https://www.linkedin.com/company/law-elite-network' },
  },
  {
    slug: 'priya-nair',
    name: 'Priya Nair',
    title: 'Senior Legal Editor',
    credentials: 'LL.M. · 13+ years across commercial, tax, employment, and IP law',
    bio:
      'Priya Nair is a senior editor at Law Elite Network whose byline spans commercial agreements, tax fundamentals, employment contracts, intellectual property, and property transactions. Her breadth comes from years on the desk where these areas overlap — a single business decision often touching all of them at once. ' +
      'Priya’s role is consistency: making sure that a tenant’s rights guide and a corporate-tax explainer hold the same standard of clarity, accuracy, and worldwide framing. She is one of the network’s most-published contributors.',
    expertise: ['Tax & Finance', 'Employment & Labor', 'Technology & IP', 'Property & Real Estate'],
    avatarSeed: 'priya-nair',
    social: { linkedin: 'https://www.linkedin.com/company/law-elite-network', x: 'https://x.com/lawelitenetwork' },
  },
  {
    slug: 'daniel-okafor',
    name: 'Daniel Okafor',
    title: 'Criminal & Regulatory Editor',
    credentials: 'J.D. · 11+ years writing on criminal, tax, and regulatory law',
    bio:
      'Daniel Okafor covers criminal procedure, white-collar and regulatory matters, tax enforcement, and property law for Law Elite Network. He focuses on the points where ordinary people meet the enforcement side of the law — bail, investigations, audits, and disputes — and explains rights and process plainly. ' +
      'His guides are built around a simple principle: readers should understand what is happening to them and what their options are before they sit across from a prosecutor, an auditor, or opposing counsel.',
    expertise: ['Criminal Law', 'Tax & Finance', 'Property & Real Estate'],
    avatarSeed: 'daniel-okafor',
    social: { x: 'https://x.com/lawelitenetwork' },
  },
  {
    slug: 'daniel-okoro',
    name: 'Daniel Okoro',
    title: 'Employment Law Contributor',
    credentials: 'LL.B. · Employment and workplace-rights writer',
    bio:
      'Daniel Okoro writes Law Elite Network’s employment coverage, with particular attention to dismissal, wrongful termination, and the rights employees keep when a job ends. He explains the difference between a lawful dismissal and an unlawful one, and what documentation tends to decide which is which. ' +
      'His work is written for both sides of the relationship — employees trying to understand a sudden termination, and small employers trying to do it correctly.',
    expertise: ['Employment & Labor'],
    avatarSeed: 'daniel-okoro',
  },
  {
    slug: 'aisha-rahman',
    name: 'Aisha Rahman',
    title: 'Criminal Justice Contributor',
    credentials: 'J.D. · Criminal justice and procedure writer',
    bio:
      'Aisha Rahman covers criminal justice for Law Elite Network, from how bail is set and challenged to how white-collar offences are investigated and charged. She writes to demystify a system that is deliberately intimidating, explaining the stages of a case and the rights that apply at each one. ' +
      'Aisha’s explainers are general education for a global readership and always point serious matters toward qualified local defence counsel.',
    expertise: ['Criminal Law'],
    avatarSeed: 'aisha-rahman',
  },
  {
    slug: 'marcus-whitfield',
    name: 'Marcus Whitfield',
    title: 'Dispute Resolution Editor',
    credentials: 'LL.M. Dispute Resolution · Arbitration and mediation writer',
    bio:
      'Marcus Whitfield covers how disputes are resolved outside — and inside — the courtroom: arbitration, mediation, negotiation, and litigation. He helps readers understand which path fits which conflict, what each costs in time and money, and where an enforceable outcome actually comes from. ' +
      'His guides treat dispute resolution as a set of deliberate choices rather than an inevitable march to trial, and he edits the network’s dispute-resolution coverage.',
    expertise: ['Dispute Resolution'],
    avatarSeed: 'marcus-whitfield',
    social: { linkedin: 'https://www.linkedin.com/company/law-elite-network' },
  },
];

/** Normalize a free-text byline ("Elena Rossi") to a profile slug ("elena-rossi"). */
export function authorNameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getAllAuthors(): LawAuthor[] {
  return LAW_AUTHORS;
}

export function getAuthorBySlug(slug: string): LawAuthor | null {
  const target = slug.toLowerCase();
  return LAW_AUTHORS.find((a) => a.slug === target) ?? null;
}

/** Resolve a byline string to a full profile, matching by slug. */
export function getAuthorByName(name: string): LawAuthor | null {
  if (!name) return null;
  return getAuthorBySlug(authorNameToSlug(name));
}
