import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySources } from './sources-classify';

test('classifies real citation examples into the right bucket', () => {
  const result = classifySources([
    { label: '26 U.S.C. § 1361 — S corporation defined (Cornell Legal Information Institute)', url: 'https://www.law.cornell.edu/uscode/text/26/1361' },
    { label: 'Bail Act 1976 (UK)', url: 'https://www.legislation.gov.uk/ukpga/1976/63' },
    { label: 'Miranda v. Arizona, 384 U.S. 436 (1966)', url: 'https://supreme.justia.com/cases/federal/us/384/436/' },
    { label: 'White v White [2000] UKHL 54 — "yardstick of equality"', url: 'https://www.bailii.org/uk/cases/UKHL/2000/54.html' },
    { label: 'R v Cowan [1996] QB 373 — jury direction limits on drawing inferences' },
    { label: 'IRS Publication 523, Selling Your Home', url: 'https://www.irs.gov/publications/p523' },
    { label: 'U.S. Equal Employment Opportunity Commission — federal anti-discrimination and anti-retaliation protections', url: 'https://www.eeoc.gov/' },
    { label: 'Fair Work Commission — unfair dismissal guidance and current high income threshold', url: 'https://www.fwc.gov.au/unfair-dismissals' },
    { label: 'International Arbitration Centre (IAC), 190 Fleet Street, London — official site', url: 'https://www.iac-london.com/' },
    { label: 'LCIA Arbitration Rules 2020, Article 16 (distinguishing the legal seat from the physical hearing venue)', url: 'https://www.lcia.org/Dispute_Resolution_Services/lcia-arbitration-rules-2020.aspx' },
  ]);

  assert.equal(result.primaryLegislation.length, 2);
  assert.deepEqual(result.primaryLegislation.map((s) => s.label.slice(0, 12)), ['26 U.S.C. § ', 'Bail Act 197']);

  assert.equal(result.courtDecisions.length, 3);

  assert.equal(result.governmentSources.length, 1);
  assert.equal(result.governmentSources[0].label.startsWith('IRS Publication'), true);

  assert.equal(result.regulators.length, 2);

  // A private arbitral institution's own venue/rules pages are not
  // government legislation, even though "Rules 2020, Article 16" reads a
  // little like a statute citation -- must land in `other`, not be misfiled.
  assert.equal(result.other.length, 2);
});

test('a case citation that mentions a statute or regulator in passing is not misfiled', () => {
  const result = classifySources([
    { label: 'Vega v. Tekoh, 597 U.S. 134 (2022) — no § 1983 claim for a Miranda violation alone', url: 'https://supreme.justia.com/cases/federal/us/597/21-499/' },
    { label: 'Ryan LLC v. FTC, N.D. Tex. (2024) — vacatur of the FTC non-compete rule' },
  ]);
  assert.equal(result.courtDecisions.length, 2);
  assert.equal(result.primaryLegislation.length, 0);
  assert.equal(result.regulators.length, 0);
});

test('law.justia.com hosts both case law and state codes under one domain -- split by path', () => {
  const result = classifySources([
    { label: 'Montana Code Annotated § 39-2-904 — elements of wrongful discharge', url: 'https://law.justia.com/codes/montana/title-39/chapter-2/part-9/section-39-2-904/' },
    { label: 'Some federal district court opinion', url: 'https://law.justia.com/cases/federal/district-courts/texas/txndce/3:2024cv00986/389064/211/' },
  ]);
  assert.equal(result.primaryLegislation.length, 1);
  assert.equal(result.courtDecisions.length, 1);
});

test('India\'s 2023 Sanhita/Adhiniyam statute names are recognized as legislation even with no URL', () => {
  const result = classifySources([
    { label: 'India, Bharatiya Nyaya Sanhita 2023 — offence classification' },
    { label: 'India, Bharatiya Sakshya Adhiniyam 2023 — evidence provisions' },
  ]);
  assert.equal(result.primaryLegislation.length, 2);
  assert.equal(result.other.length, 0);
});

test('UNCITRAL and Hague Conference treaty-text hosts classify as legislation', () => {
  const result = classifySources([
    { label: 'UNCITRAL Model Law on International Commercial Arbitration', url: 'https://uncitral.un.org/en/texts/arbitration/modellaw/commercial_arbitration' },
    { label: 'Hague Convention on the Civil Aspects of International Child Abduction (1980)', url: 'https://www.hcch.net/en/instruments/conventions/full-text/?cid=24' },
    { label: 'Civil Code of Québec, articles 2089 and 2095', url: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/ccq-1991' },
  ]);
  assert.equal(result.primaryLegislation.length, 3);
});

test('a CanLII-style neutral citation (mixed-case reporter) is recognized as a court decision', () => {
  const result = classifySources([
    { label: 'Bardal v. Globe & Mail Ltd., 1960 CanLII 294 (ON SC)', url: 'https://www.canlii.org/en/on/onsc/doc/1960/1960canlii294/1960canlii294.html' },
  ]);
  assert.equal(result.courtDecisions.length, 1);
});

test('empty/undefined input yields all-empty buckets', () => {
  const empty = { primaryLegislation: [], courtDecisions: [], governmentSources: [], regulators: [], other: [] };
  assert.deepEqual(classifySources(undefined), empty);
  assert.deepEqual(classifySources(null), empty);
  assert.deepEqual(classifySources([]), empty);
});
