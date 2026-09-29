import type { LawAuthor } from '@/data/authors';

/**
 * What a profile actually documents about an author's qualifications.
 *
 *  - 'supplied': the profile lists a degree, licence, designation or years of
 *    experience (from the bundled roster or a CMS profile). Law Elite Network
 *    has not independently verified it.
 *  - 'none': only an editorial role/desk line; no qualification is documented.
 *
 * There is deliberately no 'verified' state: no field in the bundled roster or
 * the CMS records independent verification, so the site never claims it.
 */
export type CredentialStatus = 'supplied' | 'none';

// A qualification word or an experience figure. Kept broad on purpose: missing a
// supplied credential prints "none on file" beside a credential, which is the
// contradiction this replaces (the old check missed LL.M., J.D. and "years").
const CREDENTIAL_TOKEN = new RegExp(
  [
    String.raw`(?<![A-Za-z])LL\.?\s?[BM]\.?(?![A-Za-z])`,
    String.raw`(?<![A-Za-z])J\.?\s?D\.?(?![A-Za-z])`,
    String.raw`(?<![A-Za-z])(?:B|M)\.?\s?(?:Sc|A|Com|Eng)\.?(?![A-Za-z])`,
    String.raw`(?<![A-Za-z])Ph\.?\s?D\.?(?![A-Za-z])`,
    String.raw`\b(?:degree|diploma|certificat\w*|certified|licen[cs]\w*|admitted|bar|advocate|attorney|solicitor|barrister|lawyer|paralegal|GAICD|AGIA|CFP|CPA)\b`,
    String.raw`\d+\+?\s*years?`,
  ].join('|'),
  'i',
);

export function credentialStatus(
  author: Pick<LawAuthor, 'credentials' | 'education' | 'certifications'>,
): CredentialStatus {
  if (author.education?.length || author.certifications?.length) return 'supplied';
  return CREDENTIAL_TOKEN.test(author.credentials || '') ? 'supplied' : 'none';
}

/** Wording shown on the author page for each state. */
export function credentialNotice(status: CredentialStatus): string {
  return status === 'supplied'
    ? 'Qualifications listed on this profile were supplied to Law Elite Network and have not been independently verified.'
    : 'Not documented: no degrees, licences, bar admissions or professional memberships are on file for this contributor. This profile does not indicate that the author is a licensed lawyer.';
}
