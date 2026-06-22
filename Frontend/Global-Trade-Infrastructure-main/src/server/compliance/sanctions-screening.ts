/**
 * @file server/compliance/sanctions-screening.ts
 * @description Pure sanctions & restricted-party screening. Screens the parties
 * and the origin/destination countries of a transaction against a supplied
 * sanctions context (embargoed countries, high-risk countries, denied parties,
 * PEPs). The lists are passed in — sourced by the service from GCKB country
 * records plus a baseline — so this stays a pure, exhaustively testable function.
 */

export type SanctionsSeverity = 'REVIEW' | 'BLOCK';
export type SanctionsMatchType = 'COUNTRY_EMBARGO' | 'HIGH_RISK_COUNTRY' | 'DENIED_PARTY' | 'PEP';

export interface SanctionsParty {
  name?: string | null;
  country?: string | null;
  role?: string | null; // buyer | seller | shipper | consignee | ...
}

export interface SanctionsInput {
  parties?: SanctionsParty[];
  originCountry?: string | null;
  destinationCountry?: string | null;
}

export interface SanctionsContext {
  sanctionedCountries: string[]; // ISO-2 codes (embargoed)
  highRiskCountries?: string[];
  deniedParties?: string[]; // organisation/person names
  pepNames?: string[];
}

export interface SanctionsMatch {
  type: SanctionsMatchType;
  severity: SanctionsSeverity;
  value: string; // the offending country/party
  detail: string;
}

export interface SanctionsResult {
  hit: boolean; // a BLOCK-level match (embargo / denied party)
  requiresReview: boolean; // a REVIEW-level match (high-risk country / PEP)
  matches: SanctionsMatch[];
  reasons: string[];
}

const norm = (v: string | null | undefined): string => String(v ?? '').trim().toLowerCase();
const code = (v: string | null | undefined): string => String(v ?? '').trim().toUpperCase();

/** Screen a transaction's parties and countries against the sanctions context. */
export function screenSanctions(input: SanctionsInput, context: SanctionsContext): SanctionsResult {
  const sanctioned = new Set(context.sanctionedCountries.map(code));
  const highRisk = new Set((context.highRiskCountries ?? []).map(code));
  const denied = new Set((context.deniedParties ?? []).map(norm));
  const peps = new Set((context.pepNames ?? []).map(norm));
  const matches: SanctionsMatch[] = [];

  const countries: Array<{ value: string; label: string }> = [
    { value: code(input.originCountry), label: 'origin' },
    { value: code(input.destinationCountry), label: 'destination' },
  ];
  for (const party of input.parties ?? []) {
    countries.push({ value: code(party.country), label: `party:${party.role ?? 'unknown'}` });
  }

  for (const c of countries) {
    if (!c.value) continue;
    if (sanctioned.has(c.value)) {
      matches.push({ type: 'COUNTRY_EMBARGO', severity: 'BLOCK', value: c.value, detail: `${c.label} country ${c.value} is under embargo` });
    } else if (highRisk.has(c.value)) {
      matches.push({ type: 'HIGH_RISK_COUNTRY', severity: 'REVIEW', value: c.value, detail: `${c.label} country ${c.value} is high-risk` });
    }
  }

  for (const party of input.parties ?? []) {
    const name = norm(party.name);
    if (!name) continue;
    if (denied.has(name)) {
      matches.push({ type: 'DENIED_PARTY', severity: 'BLOCK', value: party.name as string, detail: `party "${party.name}" is on a denied-party list` });
    } else if (peps.has(name)) {
      matches.push({ type: 'PEP', severity: 'REVIEW', value: party.name as string, detail: `party "${party.name}" is a politically-exposed person` });
    }
  }

  const hit = matches.some((m) => m.severity === 'BLOCK');
  const requiresReview = !hit && matches.some((m) => m.severity === 'REVIEW');
  return { hit, requiresReview, matches, reasons: matches.map((m) => m.detail) };
}
