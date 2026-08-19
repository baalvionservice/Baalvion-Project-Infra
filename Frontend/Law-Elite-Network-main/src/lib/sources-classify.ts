import type { PrimarySource } from '@/components/knowledge/PrimarySources';

/**
 * Buckets an article's real, editor-entered `primarySources` citations (see
 * the no-fabrication doc comment on `LawArticle.primarySources`) into the
 * four categories the public Sources section shows -- Primary legislation,
 * Court decisions, Government sources, Official regulators -- using only
 * signals already present in the real label/URL (domain, citation shape,
 * known regulator names). This never invents a category for a source that
 * doesn't confidently match one: anything ambiguous lands in `other` rather
 * than being mis-filed, since a wrong label is worse than an honest catch-all
 * (e.g. "LCIA Arbitration Rules 2020, Article 16" cites a private arbitral
 * institution's rules, not government legislation, even though it reads a
 * little like a statute citation).
 */

export interface ClassifiedSources {
  primaryLegislation: PrimarySource[];
  courtDecisions: PrimarySource[];
  governmentSources: PrimarySource[];
  regulators: PrimarySource[];
  other: PrimarySource[];
}

function hostOf(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function pathOf(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

const LEGISLATION_DOMAINS = [
  'legislation.gov.uk',
  'law.cornell.edu',
  'congress.gov',
  'nysenate.gov',
  'eur-lex.europa.eu',
  // Canada's federal and provincial statute-hosting domains -- these serve
  // the actual text of an Act/Regulation, the same role law.cornell.edu and
  // legislation.gov.uk play for the US/UK, so a citation pointing here is
  // legislation, not just "a government source."
  'laws-lois.justice.gc.ca',
  'bclaws.gov.bc.ca',
  // German federal statute text, published by the Federal Ministry of Justice.
  'gesetze-im-internet.de',
  // Delaware's official state code host -- like law.cornell.edu/legislation.gov.uk,
  // this serves actual statute text, not administrative guidance.
  'delcode.delaware.gov',
  // UNCITRAL and the Hague Conference are single-purpose treaty-text hosts --
  // every citation to them in this corpus is the actual convention/model-law
  // text (New York Convention, Model Law, Hague Conventions), not general
  // intergovernmental-organization guidance, so unlike wipo.int (which also
  // hosts non-treaty how-to-file pages) these are safe to classify wholesale.
  'uncitral.un.org',
  'hcch.net',
  // Québec's official legislation portal (the name literally means "Legis
  // Québec") -- hosts the actual Civil Code text. Uses the French "gouv"
  // label, which the generic government-domain check below doesn't catch.
  'legisquebec.gouv.qc.ca',
];

const CASE_LAW_DOMAINS = ['supreme.justia.com', 'courtlistener.com', 'bailii.org', 'casetext.com'];

// law.justia.com hosts both case law (/cases/...) and state statutory codes
// (/codes/...) under the same domain -- unlike the single-purpose domains
// above, it needs the same path-based split as austlii.edu.au below.
const JUSTIA_LAW_DOMAIN = 'law.justia.com';

// Named regulators/standard-setters -- bodies whose central function is
// licensing/enforcement oversight over an industry, as distinct from a
// general tax authority or justice department (bucketed as `government`
// below). Intentionally a short, high-confidence list rather than every
// possible acronym, matching the "other" escape hatch's own reasoning.
const REGULATOR_PATTERN =
  /\b(SEC|FTC|FCA|CFPB|FINRA|FDA|EEOC|OSHA|ICO|CMA|FATF|Fair Work Commission|Financial Conduct Authority|Securities and Exchange Commission|Federal Trade Commission|Equal Employment Opportunity Commission)\b/;

const REGULATOR_DOMAINS = ['eeoc.gov', 'fwc.gov.au', 'sec.gov', 'ftc.gov', 'fca.org.uk', 'cfpb.gov', 'finra.org', 'fda.gov'];

// A "gov" label can sit anywhere in the hostname, not just right before the
// final TLD (bclaws.gov.bc.ca, business.gov.au) -- checking dot-separated
// labels catches those a suffix-only regex (`/\.gov$/`, `/\.gov\.[a-z]{2}$/`)
// would miss. A few real government domains don't spell "gov" at all
// (Canada's federal .gc.ca convention, and canada.ca/ontario.ca portals),
// so those are matched as explicit suffixes alongside the label check.
const GOVERNMENT_DOMAIN_SUFFIXES = ['.gc.ca', 'canada.ca', 'ontario.ca'];
function isGovernmentDomain(host: string): boolean {
  if (!host) return false;
  if (host.split('.').includes('gov')) return true;
  return GOVERNMENT_DOMAIN_SUFFIXES.some((suffix) => host === suffix.replace(/^\./, '') || host.endsWith(suffix));
}

// "Bail Act 1976", "Foreign Corrupt Practices Act of 1977", "Fair Work Act 2009",
// "Canadian Charter of Rights and Freedoms" -- a named Act/Charter/Constitution,
// not any use of the word "act". Deliberately does not match institutional
// rules documents like "Arbitration Rules 2020".
const ACT_WITH_YEAR = /\bAct\s+(?:of\s+)?\d{4}\b/i;
// "Sanhita"/"Adhiniyam" are the real naming convention for India's 2023
// codified statutes (Bharatiya Nyaya Sanhita, Bharatiya Nagarik Suraksha
// Sanhita, Bharatiya Sakshya Adhiniyam -- the replacements for the IPC/CrPC/
// Evidence Act), which recur across this corpus's India citations and
// otherwise had no legislation signal to match on (no "Act <year>", no "§").
const STATUTE_CITATION = /U\.S\.C\.|§|\bCode\s+Annotated\b|\bCharter\s+of\s+Rights\b|\bConstitution\b|\bSanhita\b|\bAdhiniyam\b/i;

// "Miranda v. Arizona", "White v White", "R v Cowan" -- a case-name shape.
const CASE_NAME_SHAPE = /\b[A-Z][\w.&'-]*(?:\s+[A-Z][\w.&'-]*)*\s+v\.?\s+[A-Z][\w.&'-]*/;
// Paired with an actual citation marker so an unrelated "X v Y" mention in
// prose (there isn't one in practice here, since these are already curated
// citation labels, but keep the check meaningful) isn't mistaken for a case.
// The trailing `(19|20)\d{2}\s+[A-Z]{2,6}` clause catches unbracketed
// "YEAR REPORTER" cites (e.g. "R v Suberu, 2009 SCC 33") without matching
// prose like "Rules 2020, Article 16", where the word after the year isn't
// an all-caps reporter abbreviation.
// `CanLII` is mixed-case (not `[A-Z]{2,6}`), so the generic "YEAR REPORTER"
// clause above misses citations like "1960 CanLII 294" -- matched explicitly.
const CITATION_MARKER = /\(\d{4}\)|\[\d{4}\]|\bU\.S\.\b|\bF\.\s?\d?d\b|UKHL|UKSC|\bQB\b|Cr App R|\bCanLII\b|\b(?:19|20)\d{2}\s+[A-Z]{2,6}\b/;

// Real government bodies/publications that show up in citation labels with
// no URL attached (so the domain checks above never get a chance to run).
const GOVERNMENT_KEYWORD_PATTERN =
  /\b(IRS|HMRC|Internal Revenue Service|Canada Revenue Agency|Companies House)\b/;

function classifyOne(source: PrimarySource): keyof ClassifiedSources {
  const host = hostOf(source.url);
  const path = pathOf(source.url);
  const label = source.label;

  // Domain checks first: a URL belongs to exactly one real host, so these
  // can't conflict with each other regardless of order.
  if (REGULATOR_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return 'regulators';
  if (CASE_LAW_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return 'courtDecisions';
  if (host.endsWith('austlii.edu.au') && path.includes('/cases/')) return 'courtDecisions';
  if (host === JUSTIA_LAW_DOMAIN && path.includes('/cases/')) return 'courtDecisions';
  if (LEGISLATION_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return 'primaryLegislation';
  if (host.endsWith('austlii.edu.au') && (path.includes('/legis/') || path.includes('consol_act'))) {
    return 'primaryLegislation';
  }
  if (host === JUSTIA_LAW_DOMAIN && path.includes('/codes/')) return 'primaryLegislation';

  // Among the text-based checks below, the case-name-plus-citation shape
  // runs first because it's the most structurally specific signal (two
  // independent conditions must both match) -- a citation's own label
  // often *mentions* a regulator or statute in passing while describing
  // what the case held (e.g. "Ryan LLC v. FTC, N.D. Tex. (2024) -- vacatur
  // of the FTC non-compete rule", or "Vega v. Tekoh, 597 U.S. 134 (2022) --
  // no § 1983 claim for a Miranda violation alone"), and those weaker,
  // single-keyword regulator/statute signals must not outrank an actual
  // case citation just because the name or code section shows up in it.
  if (CASE_NAME_SHAPE.test(label) && CITATION_MARKER.test(label)) return 'courtDecisions';

  if (REGULATOR_PATTERN.test(label)) return 'regulators';
  if (ACT_WITH_YEAR.test(label) || STATUTE_CITATION.test(label)) return 'primaryLegislation';

  if (isGovernmentDomain(host)) return 'governmentSources';
  if (GOVERNMENT_KEYWORD_PATTERN.test(label)) return 'governmentSources';

  return 'other';
}

export function classifySources(sources: PrimarySource[] | undefined | null): ClassifiedSources {
  const result: ClassifiedSources = {
    primaryLegislation: [],
    courtDecisions: [],
    governmentSources: [],
    regulators: [],
    other: [],
  };
  (sources ?? []).forEach((source) => {
    result[classifyOne(source)].push(source);
  });
  return result;
}
