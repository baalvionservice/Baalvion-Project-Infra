/**
 * @fileOverview Law Elite Network — bundled author/contributor profiles.
 *
 * E-E-A-T baseline for the public knowledge site. Every byline on the network
 * resolves to a contributor profile here (name, focus areas, role, biography)
 * so reader-facing pages and Person/Article structured data can show who wrote
 * and edited each guide. The central CMS (admin.baalvion.com) wins when it
 * returns an author record; these profiles fill the gap so the site is never
 * anonymous for readers or crawlers.
 *
 * Deliberately excluded: specific formal credentials (bar admissions, degree
 * names, firm affiliations) or years-of-experience figures for any
 * contributor. None of that has been independently verified, and stating it
 * as fact would be exactly the kind of fabricated-credential claim that
 * damages trust on a legal-information site. `credentials` and `bio` below
 * describe editorial role and topical focus only. If verified, real
 * qualifications for a contributor are supplied later, they belong here
 * instead of invented ones — see /editorial-standards.
 *
 * Contributors are legal writers and editors. Their work is general legal
 * education for a worldwide audience — it is NOT jurisdiction-specific legal
 * advice, and a profile here does not imply an attorney–client relationship.
 *
 * `social` is intentionally omitted below for most bundled contributors: none
 * of the original 11 has an individual LinkedIn/X account on file, only the
 * shared @lawelitenetwork company accounts. Rendering those as "{Name} on
 * LinkedIn" (and as Person.sameAs in structured data) would misrepresent a
 * company page as that person's own profile. Only set `social` on a
 * contributor once a URL that is genuinely that individual's own account
 * exists — as confirmed for Deepak Kumar Kuldeep below.
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
  /** Degrees/schools, e.g. "M.D. — University of Mississippi". CMS-managed only; never inferred. */
  education?: string[];
  /** Professional certifications, e.g. "CFP®". CMS-managed only; never inferred. */
  certifications?: string[];
  /** Optional public profile links. */
  social?: { x?: string; linkedin?: string; facebook?: string; instagram?: string };
}

export const LAW_AUTHORS: LawAuthor[] = [
  {
    slug: 'elena-rossi',
    name: 'Elena Rossi',
    title: 'Corporate & Securities Editor',
    credentials: 'Corporate & Securities desk, Law Elite Network',
    bio:
      'Elena Rossi leads Law Elite Network’s coverage of corporate structure, shareholder arrangements, and securities fundamentals, translating dense company-law concepts — from incorporation and share classes to founder agreements and governance — into guidance that founders, directors, and investors can actually use. ' +
      'Her explainers focus on the questions that recur across jurisdictions: what a shareholders’ agreement should protect, how ownership and control come apart, and where standard templates quietly fail. Elena reviews each corporate guide on the network for accuracy and balance before publication, following the process described in our Editorial Standards.',
    expertise: ['Business & Corporate', 'Tax & Finance'],
    avatarSeed: 'elena-rossi',
  },
  {
    slug: 'marcus-hale',
    name: 'Marcus Hale',
    title: 'Technology & Data Protection Editor',
    credentials: 'Technology & Data Protection desk, Law Elite Network',
    bio:
      'Marcus Hale writes Law Elite Network’s technology, intellectual-property, and data-protection coverage. His work tracks how privacy regimes such as the GDPR and CCPA, trademark and copyright systems, and platform regulation actually affect founders and product teams. ' +
      'Marcus is known for cutting through acronyms — explaining what “processor” versus “controller” means in practice, when a trademark beats a copyright, and how company formation choices ripple into data obligations later. He edits the network’s IP and privacy guides.',
    expertise: ['Technology & IP', 'Business & Corporate'],
    avatarSeed: 'marcus-hale',
  },
  {
    slug: 'priya-menon',
    name: 'Priya Menon',
    title: 'Startups & Venture Contributor',
    credentials: 'Startups & Venture desk, Law Elite Network',
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
    credentials: 'Family Law desk, Law Elite Network',
    bio:
      'Sofia Almeida heads family-law coverage at Law Elite Network, with a focus on divorce, financial settlement, and the practical mechanics of separating two lives. She writes with the understanding that readers arrive at these guides during some of the hardest weeks of their lives. ' +
      'Her work explains process and options without alarmism — what the steps are, what tends to be negotiable, and when a person genuinely needs a lawyer rather than a template. Sofia reviews the network’s family and personal-law guides.',
    expertise: ['Family & Personal'],
    avatarSeed: 'sofia-almeida',
  },
  {
    slug: 'rajesh-iyer',
    name: 'Rajesh Iyer',
    title: 'Family & Children’s Law Contributor',
    credentials: 'Family & Children’s Law desk, Law Elite Network',
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
    credentials: 'Estate Planning & Probate desk, Law Elite Network',
    bio:
      'Eleanor Whitfield covers wills, estate planning, and probate for Law Elite Network, writing about how people pass on what they own — and how avoidable mistakes in a will or a beneficiary form unravel decades of intentions. ' +
      'Her explainers cover what makes a will valid, why witnessing rules matter, and the difference between planning that survives a challenge and planning that doesn’t. Eleanor edits the network’s estate and succession guides.',
    expertise: ['Family & Personal'],
    avatarSeed: 'eleanor-whitfield',
  },
  {
    slug: 'priya-nair',
    name: 'Priya Nair',
    title: 'Senior Legal Editor',
    credentials: 'Senior Editor, Law Elite Network',
    bio:
      'Priya Nair is a senior editor at Law Elite Network whose byline spans commercial agreements, tax fundamentals, employment contracts, intellectual property, and property transactions. Her breadth comes from working across the desks where these areas overlap — a single business decision often touching all of them at once. ' +
      'Priya’s role is consistency: making sure that a tenant’s rights guide and a corporate-tax explainer hold the same standard of clarity, accuracy, and worldwide framing. She is one of the network’s most-published contributors.',
    expertise: ['Tax & Finance', 'Employment & Labor', 'Technology & IP', 'Property & Real Estate'],
    avatarSeed: 'priya-nair',
  },
  {
    slug: 'daniel-okafor',
    name: 'Daniel Okafor',
    title: 'Criminal & Regulatory Editor',
    credentials: 'Criminal & Regulatory desk, Law Elite Network',
    bio:
      'Daniel Okafor covers criminal procedure, white-collar and regulatory matters, tax enforcement, and property law for Law Elite Network. He focuses on the points where ordinary people meet the enforcement side of the law — bail, investigations, audits, and disputes — and explains rights and process plainly. ' +
      'His guides are built around a simple principle: readers should understand what is happening to them and what their options are before they sit across from a prosecutor, an auditor, or opposing counsel.',
    expertise: ['Criminal Law', 'Tax & Finance', 'Property & Real Estate'],
    avatarSeed: 'daniel-okafor',
  },
  {
    slug: 'daniel-okoro',
    name: 'Daniel Okoro',
    title: 'Employment Law Contributor',
    credentials: 'Employment Law desk, Law Elite Network',
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
    credentials: 'Criminal Justice desk, Law Elite Network',
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
    credentials: 'Dispute Resolution desk, Law Elite Network',
    bio:
      'Marcus Whitfield covers how disputes are resolved outside — and inside — the courtroom: arbitration, mediation, negotiation, and litigation. He helps readers understand which path fits which conflict, what each costs in time and money, and where an enforceable outcome actually comes from. ' +
      'His guides treat dispute resolution as a set of deliberate choices rather than an inevitable march to trial, and he edits the network’s dispute-resolution coverage.',
    expertise: ['Dispute Resolution'],
    avatarSeed: 'marcus-whitfield',
  },
  {
    slug: 'deepak-kumar-kuldeep',
    name: 'Deepak Kumar Kuldeep',
    title: 'Maritime & Personal Injury Law Contributor',
    credentials: 'BSc Nautical Science · Maritime law background, Law Elite Network',
    bio:
      'Deepak Kumar Kuldeep covers Law Elite Network’s personal injury and maritime law desk, drawing on a background in maritime law and a BSc in Nautical Science. ' +
      'He writes and reviews the network’s guides on personal injury claims, offshore and maritime injury law, cruise ship and passenger vessel accidents, and boating and car accident cases, along with its coverage of religious law and unusual state and local laws.',
    expertise: ['Personal Injury Law', 'Maritime & Offshore Injury Law', 'Cruise Ship & Passenger Vessel Accidents', 'Boating Accidents', 'Car Accidents', 'Religion, Law & Weird Laws'],
    avatarSeed: 'deepak-kumar-kuldeep',
    social: { linkedin: 'https://in.linkedin.com/in/allenkrewzz' },
  },
  {
    slug: 'waki-malik',
    name: 'Waki Malik',
    title: 'Lawyer & Legal Contributor',
    credentials: 'Lawyer · Certification in Dispute Resolution through Mediation, National Law School of India University',
    bio:
      'Waki Malik is a lawyer based in Kanpur, Uttar Pradesh, with experience across several areas of legal practice, including IT law, patent law, consumer law, property law, corporate law, immigration law, entertainment law, and labor and employment law. ' +
      'He has also completed certification in Dispute Resolution through Mediation from the National Law School of India University, and contributes to Law Elite Network’s coverage of business, technology, employment, property, and dispute-resolution topics.',
    expertise: ['Business & Corporate', 'Technology & IP', 'Employment & Labor', 'Property & Real Estate', 'Dispute Resolution'],
    avatarSeed: 'waki-malik',
    social: { linkedin: 'https://in.linkedin.com/in/wakimalik' },
  },
  {
    slug: 'aman-thakur',
    name: 'Aman Thakur',
    title: 'Advocate & Legal Contributor',
    credentials: 'Advocate · LL.B., Meerut College',
    bio:
      'Aman Thakur is an advocate with a professional background in family-law matters, including custody, guardianship, visitation rights, and Hindu family law. ' +
      'He contributes practical family and personal-law content to Law Elite Network, drawing on his legal-practice experience in these areas.',
    expertise: ['Family & Personal'],
    avatarSeed: 'aman-thakur',
    social: { linkedin: 'https://in.linkedin.com/in/aman-thakur-b30015247' },
  },
  {
    slug: 'maria-harizanova',
    name: 'Maria Harizanova',
    title: 'Employment Law Contributor',
    credentials: 'Master’s degree, Boston University School of Law · Admitted, New York State Bar · Member, Bulgarian Bar Association',
    bio:
      'Maria Harizanova is a lawyer with a background in employment law and international legal practice, including employment, whistleblowing, employee mobility, corporate, and regulatory matters. ' +
      'She contributes Law Elite Network’s employment and workplace-law content, along with related business-law coverage.',
    expertise: ['Employment & Labor', 'Business & Corporate'],
    avatarSeed: 'maria-harizanova',
    social: { linkedin: 'https://bg.linkedin.com/in/maria-harizanova-6b0329115' },
  },
  {
    slug: 'claire-hannon',
    name: 'Claire Hannon',
    title: 'Corporate & Tax Contributor',
    credentials: 'BSc · LLB (Hons) · Graduate Diploma in Applied Finance · GAICD · AGIA',
    bio:
      'Claire Hannon has a professional background combining legal, financial, and corporate governance experience, holding a Bachelor of Science, a Bachelor of Laws with Honours, a Graduate Diploma in Applied Finance, and GAICD and AGIA designations. ' +
      'She contributes Law Elite Network’s corporate governance, business, and tax and finance content.',
    expertise: ['Business & Corporate', 'Tax & Finance'],
    avatarSeed: 'claire-hannon',
    social: { linkedin: 'https://au.linkedin.com/in/claire-hannon' },
  },
  {
    slug: 'yessica-ruiz',
    name: 'Yessica Ruiz',
    title: 'Legal Administrative Contributor',
    credentials: 'Legal Administrative Assistant',
    bio:
      'Yessica Ruiz has a professional background in legal administration and legal support work. ' +
      'She contributes general legal-process and legal-education content to Law Elite Network — explaining how the U.S. legal system and lawmaking process work, and the network’s legal-history guides — rather than articles requiring attorney-level legal opinions.',
    expertise: ['Legal Education & History', 'U.S. Law & Constitution'],
    avatarSeed: 'yessica-ruiz',
    social: { linkedin: 'https://www.linkedin.com/in/yessica-ruiz-b277ba281' },
  },
  {
    slug: 'abinesh-raj',
    name: 'Abinesh Raj',
    title: 'Contributor',
    credentials: 'Contributor, Law Elite Network',
    bio: 'Abinesh Raj is a contributor to Law Elite Network. His specific professional background and area of expertise are pending confirmation, so he is not yet attributed to a practice-area category.',
    expertise: [],
    avatarSeed: 'abinesh-raj',
    social: { linkedin: 'https://in.linkedin.com/in/abinesh-raj-6718b2315' },
  },
  {
    slug: 'aishwarya-gorak',
    name: 'Aishwarya Gorak',
    title: 'Contributor',
    credentials: 'Contributor, Law Elite Network',
    bio: 'Aishwarya Gorak is a contributor to Law Elite Network. Her professional background is pending confirmation, so she is not yet attributed to a practice-area category.',
    expertise: [],
    avatarSeed: 'aishwarya-gorak',
    social: { linkedin: 'https://in.linkedin.com/in/aishwarya-gorak-766956139' },
  },
  {
    slug: 'diksha-singhal',
    name: 'Diksha Singhal',
    title: 'Contributor',
    credentials: 'Contributor, Law Elite Network',
    bio: 'Diksha Singhal is a contributor to Law Elite Network. Her professional background is pending confirmation, so she is not yet attributed to a practice-area category.',
    expertise: [],
    avatarSeed: 'diksha-singhal',
    social: { linkedin: 'https://www.linkedin.com/in/diksha-singhal-aa11b6192/' },
  },
  {
    slug: 'anna-solovieva',
    name: 'Anna Solovieva',
    title: 'Contributor',
    credentials: 'Contributor, Law Elite Network',
    bio: 'Anna Solovieva is a contributor to Law Elite Network, with a background including research, public relations, project management, and political consulting. Her legal or policy background is pending confirmation, so she is not yet attributed to a practice-area category.',
    expertise: [],
    avatarSeed: 'anna-solovieva',
    social: { linkedin: 'https://be.linkedin.com/in/anna-solovieva-049b7b60' },
  },
];

/**
 * Normalize a free-text byline ("Elena Rossi") to a profile slug ("elena-rossi").
 * Some CMS/API articles have no `author` field at all -- callers filter/find
 * across the whole article pool by slug (see /authors, /author/[slug]), so a
 * bare `undefined.trim()` there took down the entire page for every reader,
 * not just the byline-less article. Empty in, empty out; an empty slug never
 * matches a real author.
 */
export function authorNameToSlug(name: string | null | undefined): string {
  if (!name) return '';
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

/**
 * Distinguishes desk editors from contributors using the role that's
 * already encoded in every bundled `title` above (each one genuinely ends in
 * either "Editor" or "Contributor" -- confirmed across all 19 profiles).
 * Not a new/invented classification: it's the real editorial-role signal
 * that already exists in this data, just not previously surfaced as a
 * grouping. CMS-managed authors default to "contributor" unless their title
 * explicitly says otherwise, since a false "editor" claim is worse than an
 * under-claim here.
 */
export function isEditorRole(title: string | null | undefined): boolean {
  return /editor$/i.test((title || '').trim());
}

// Order matters -- first match wins, so specific areas (injury/maritime,
// family, criminal) are checked before broad ones sharing words like "commercial".
export const PRACTICE_AREAS = [
  'Personal Injury & Maritime',
  'Family & Personal',
  'Criminal Law',
  'Employment & Labor',
  'Technology & IP',
  'Dispute Resolution',
  'Tax & Finance',
  'Business & Corporate',
  'Constitutional & Legal Education',
  'General Practice',
] as const;

export type PracticeArea = (typeof PRACTICE_AREAS)[number];

const PRACTICE_AREA_RULES: [PracticeArea, RegExp][] = [
  // "maritime|cruise|boating" only -- deliberately excludes the bare phrase
  // "personal injury" here, since several international contributors carry
  // a title like "Personal Injury & Clinical Negligence" that is UK tort/
  // negligence litigation, not the maritime/injury desk this bucket names
  // (see Dispute Resolution's "negligence" match below for that title).
  ['Personal Injury & Maritime', /maritime|cruise|boating/],
  // Specific family-law phrases only -- a bare "family" or "estate" match
  // false-positives on real, unrelated expertise text ("family businesses"
  // in an M&A profile, "real estate" in a disputes profile).
  ['Family & Personal', /family law|child custody|matrimonial|divorce|estate planning|probate|inheritance|children.s law/],
  ['Criminal Law', /criminal|white-collar|fraud/],
  ['Employment & Labor', /employ|labour|labor/],
  ['Technology & IP', /intellectual property|\bip\b|technology|data protection|privacy|trademark|copyright|it law|entertainment/],
  ['Dispute Resolution', /litigation|arbitration|dispute|mediation|insurance|negligence|construction/],
  ['Tax & Finance', /\btax\b|banking|finance|insolvency|restructuring/],
  ['Business & Corporate', /merger|acquisition|corporate|commercial|m&a/],
  ['Constitutional & Legal Education', /constitutional|legal education|administrative|legal research|legal system/],
];

function matchPracticeArea(text: string): PracticeArea | null {
  const haystack = text.toLowerCase();
  for (const [area, pattern] of PRACTICE_AREA_RULES) {
    if (pattern.test(haystack)) return area;
  }
  return null;
}

// `title` is checked first (it *is* the assigned desk for the international
// roster); `expertise` is a fallback for generic titles like "Contributor".
export function classifyPracticeArea(author: Pick<LawAuthor, 'title' | 'expertise'>): PracticeArea {
  return (
    matchPracticeArea(author.title || '') ??
    matchPracticeArea((author.expertise || []).join(' ')) ??
    'General Practice'
  );
}
