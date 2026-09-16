'use strict';
/**
 * Trusted-trader programmes — PURE (Compression, Phase 6).
 *
 * Every other phase makes the platform faster. This one is the only lever that
 * changes what the AUTHORITY does, and it is therefore what converts sub-4-hour
 * paperwork into same-day release. Customs risk-scores the TRADER, not the
 * shipment: an accredited operator is selected for examination a fraction as
 * often, gets simplified procedures, and clears on arrival.
 *
 * What the platform can and cannot do here matters, and the code should not blur
 * it. Accreditation is GRANTED BY AN AUTHORITY after an audit. The platform's
 * job is to (a) measure readiness against the published criteria, (b) hold the
 * evidence an auditor will ask for, and (c) keep the record clean afterwards,
 * since accreditation is revocable. Nothing in this module grants anything.
 *
 * MUTUAL RECOGNITION is the multiplier. An EU AEOS is recognised by the US, the
 * UK, Japan, China and others, so one accreditation lowers selection risk across
 * several corridors at once. It is modelled explicitly because it decides which
 * programme a given trader should pursue FIRST.
 *
 * PURE: no DB, no clock beyond the injected `now`.
 */

const PROGRAMME_VERSION = '1.0.0';

const CRITERION = Object.freeze({
    COMPLIANCE_RECORD: 'compliance_record',
    RECORDS_MANAGEMENT: 'records_management',
    FINANCIAL_SOLVENCY: 'financial_solvency',
    PRACTICAL_COMPETENCE: 'practical_competence',
    SECURITY_PREMISES: 'security_premises',
    SECURITY_CARGO: 'security_cargo',
    SECURITY_PERSONNEL: 'security_personnel',
    SECURITY_PARTNERS: 'security_partners',
    INCIDENT_MANAGEMENT: 'incident_management',
});

/**
 * The published criteria, with what an auditor actually asks for.
 *
 * `evidence` is the operative field: a readiness percentage with no evidence
 * list tells a customer they are 60% ready and nothing about what to do next.
 * `platform_can_evidence` is the honest split — the platform can produce a
 * filing history; it cannot produce audited accounts or a fenced yard.
 */
const CRITERIA = Object.freeze({
    [CRITERION.COMPLIANCE_RECORD]: {
        label: 'Customs compliance record',
        weight: 20,
        description: 'No serious or repeated infringement of customs or tax rules, typically across the last three years.',
        evidence: ['filing history with outcomes', 'record of any penalties and their resolution', 'voluntary disclosure log'],
        platform_can_evidence: true,
    },
    [CRITERION.RECORDS_MANAGEMENT]: {
        label: 'Commercial and transport records management',
        weight: 15,
        description: 'An auditable accounting and logistics system letting customs trace any consignment end to end.',
        evidence: ['per-consignment audit trail', 'document retention policy', 'system access controls'],
        platform_can_evidence: true,
    },
    [CRITERION.FINANCIAL_SOLVENCY]: {
        label: 'Proven financial solvency',
        weight: 15,
        description: 'Sound financial standing over the last three years, sufficient to meet duty obligations.',
        evidence: ['audited accounts', 'no insolvency proceedings', 'duty account funding history'],
        platform_can_evidence: false,
    },
    [CRITERION.PRACTICAL_COMPETENCE]: {
        label: 'Practical standards of competence',
        weight: 10,
        description: 'Demonstrated professional competence in customs matters, by qualification or by track record.',
        evidence: ['named customs-competent staff', 'qualifications or three years of practice', 'written procedures'],
        platform_can_evidence: false,
    },
    [CRITERION.SECURITY_PREMISES]: {
        label: 'Premises security',
        weight: 10,
        description: 'Physical access control over buildings and cargo-handling areas.',
        evidence: ['site security assessment', 'access control log', 'CCTV and perimeter controls'],
        platform_can_evidence: false,
    },
    [CRITERION.SECURITY_CARGO]: {
        label: 'Cargo and container security',
        weight: 10,
        description: 'Controls over cargo integrity, including seal management and the seven-point container inspection.',
        evidence: ['seal control procedure', 'container inspection records', 'chain-of-custody log'],
        platform_can_evidence: true,
    },
    [CRITERION.SECURITY_PERSONNEL]: {
        label: 'Personnel security',
        weight: 5,
        description: 'Screening of staff in security-sensitive roles, and periodic re-screening.',
        evidence: ['background check policy', 'screening records for sensitive roles'],
        platform_can_evidence: false,
    },
    [CRITERION.SECURITY_PARTNERS]: {
        label: 'Business partner security',
        weight: 10,
        description: 'Documented security requirements on suppliers, carriers and agents, and evidence they are met.',
        evidence: ['counterparty KYC records', 'partner security declarations', 'carrier accreditation status'],
        platform_can_evidence: true,
    },
    [CRITERION.INCIDENT_MANAGEMENT]: {
        label: 'Incident and non-conformity management',
        weight: 5,
        description: 'A procedure for detecting, reporting and correcting security incidents and compliance failures.',
        evidence: ['incident register', 'corrective action records', 'reporting escalation path'],
        platform_can_evidence: true,
    },
});

const CUSTOMS_CRITERIA = Object.freeze([
    CRITERION.COMPLIANCE_RECORD,
    CRITERION.RECORDS_MANAGEMENT,
    CRITERION.FINANCIAL_SOLVENCY,
    CRITERION.PRACTICAL_COMPETENCE,
]);

const SECURITY_CRITERIA = Object.freeze([
    CRITERION.COMPLIANCE_RECORD,
    CRITERION.RECORDS_MANAGEMENT,
    CRITERION.FINANCIAL_SOLVENCY,
    CRITERION.SECURITY_PREMISES,
    CRITERION.SECURITY_CARGO,
    CRITERION.SECURITY_PERSONNEL,
    CRITERION.SECURITY_PARTNERS,
    CRITERION.INCIDENT_MANAGEMENT,
]);

/**
 * Programmes.
 *
 * `exam_rate_multiplier` is the honest core of the whole phase: it is the factor
 * by which examination selection is reduced relative to an unaccredited trader.
 * It is an ESTIMATE derived from published programme benefits, not a guarantee —
 * no authority commits to a selection rate, and the code says so wherever the
 * number is used.
 */
const PROGRAMMES = Object.freeze({
    EU_AEOC: {
        code: 'EU_AEOC',
        label: 'EU AEO — Customs Simplifications (AEOC)',
        authority: 'European Union member state customs',
        jurisdictions: ['EU'],
        criteria: CUSTOMS_CRITERIA,
        benefits: ['Fewer documentary controls', 'Priority treatment when selected', 'Simplified procedures and deferred declarations'],
        exam_rate_multiplier: 0.5,
        typical_lead_time_days: 120,
        mutual_recognition: [],
        note: 'AEOC lowers documentary control frequency but does NOT carry security benefits — AEOS or AEOF is what reduces physical exam selection.',
    },
    EU_AEOS: {
        code: 'EU_AEOS',
        label: 'EU AEO — Security and Safety (AEOS)',
        authority: 'European Union member state customs',
        jurisdictions: ['EU'],
        criteria: SECURITY_CRITERIA,
        benefits: ['Reduced physical and documentary controls', 'Priority when selected', 'Recognised by mutual-recognition partners'],
        exam_rate_multiplier: 0.25,
        typical_lead_time_days: 180,
        mutual_recognition: ['US', 'GB', 'JP', 'CN', 'CH', 'NO'],
    },
    EU_AEOF: {
        code: 'EU_AEOF',
        label: 'EU AEO — Full (AEOC + AEOS)',
        authority: 'European Union member state customs',
        jurisdictions: ['EU'],
        criteria: Object.keys(CRITERIA),
        benefits: ['Every AEOC and AEOS benefit combined'],
        exam_rate_multiplier: 0.2,
        typical_lead_time_days: 210,
        mutual_recognition: ['US', 'GB', 'JP', 'CN', 'CH', 'NO'],
    },
    US_CTPAT: {
        code: 'US_CTPAT',
        label: 'US CTPAT (Customs-Trade Partnership Against Terrorism)',
        authority: 'US Customs and Border Protection',
        jurisdictions: ['US'],
        criteria: SECURITY_CRITERIA,
        benefits: ['Reduced exam rate', 'Front-of-line treatment when examined', 'Access to FAST lanes'],
        exam_rate_multiplier: 0.3,
        typical_lead_time_days: 120,
        mutual_recognition: ['EU', 'JP', 'CN', 'KR', 'CA', 'MX'],
    },
    US_ISA: {
        code: 'US_ISA',
        label: 'US Importer Self-Assessment',
        authority: 'US Customs and Border Protection',
        jurisdictions: ['US'],
        criteria: CUSTOMS_CRITERIA,
        benefits: ['Removal from routine audit pools', 'Self-directed compliance testing'],
        exam_rate_multiplier: 0.6,
        typical_lead_time_days: 180,
        mutual_recognition: [],
        prerequisites: ['US_CTPAT'],
    },
    IN_AEO_T1: {
        code: 'IN_AEO_T1',
        label: 'India AEO Tier 1',
        authority: 'Central Board of Indirect Taxes and Customs',
        jurisdictions: ['IN'],
        criteria: CUSTOMS_CRITERIA,
        benefits: ['Reduced bank guarantee', 'Faster disbursal of drawback', 'Fewer examinations'],
        exam_rate_multiplier: 0.6,
        typical_lead_time_days: 30,
        mutual_recognition: [],
    },
    IN_AEO_T2: {
        code: 'IN_AEO_T2',
        label: 'India AEO Tier 2',
        authority: 'Central Board of Indirect Taxes and Customs',
        jurisdictions: ['IN'],
        criteria: SECURITY_CRITERIA,
        benefits: ['Further reduced guarantee', 'Direct port delivery / direct port entry', 'Deferred duty payment'],
        exam_rate_multiplier: 0.35,
        typical_lead_time_days: 90,
        mutual_recognition: ['KR', 'HK', 'TW', 'AE'],
        prerequisites: ['IN_AEO_T1'],
    },
    IN_AEO_T3: {
        code: 'IN_AEO_T3',
        label: 'India AEO Tier 3',
        authority: 'Central Board of Indirect Taxes and Customs',
        jurisdictions: ['IN'],
        criteria: Object.keys(CRITERIA),
        benefits: ['Highest facilitation tier', 'Client relationship manager', 'Minimal examination'],
        exam_rate_multiplier: 0.15,
        typical_lead_time_days: 150,
        mutual_recognition: ['KR', 'HK', 'TW', 'AE'],
        prerequisites: ['IN_AEO_T2'],
    },
    AE_AEO: {
        code: 'AE_AEO',
        label: 'UAE Authorised Economic Operator',
        authority: 'Federal Customs Authority / Dubai Customs',
        jurisdictions: ['AE'],
        criteria: SECURITY_CRITERIA,
        benefits: ['Priority clearance', 'Reduced inspection', 'Deferred payment'],
        exam_rate_multiplier: 0.35,
        typical_lead_time_days: 90,
        mutual_recognition: ['IN', 'CN'],
    },
    CN_AEO: {
        code: 'CN_AEO',
        label: 'China Advanced Certified Enterprise',
        authority: 'General Administration of Customs of China',
        jurisdictions: ['CN'],
        criteria: SECURITY_CRITERIA,
        benefits: ['Lower inspection rate', 'Priority clearance', 'Reduced documentary checks'],
        exam_rate_multiplier: 0.3,
        typical_lead_time_days: 120,
        mutual_recognition: ['EU', 'US', 'GB', 'JP', 'KR', 'SG', 'AE'],
    },
});

const EU_MEMBERS = Object.freeze([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
    'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

/** Normalize a country to the jurisdiction key programmes are indexed by. */
function jurisdictionOf(country) {
    const c = String(country || '').toUpperCase();
    return EU_MEMBERS.includes(c) ? 'EU' : c;
}

/** Programmes available in a jurisdiction. */
function programmesFor(country) {
    const j = jurisdictionOf(country);
    return Object.values(PROGRAMMES).filter((p) => p.jurisdictions.includes(j));
}

/**
 * Does an accreditation help in this destination — directly, or through mutual
 * recognition? This is what makes one accreditation worth more than another for
 * a given trade pattern.
 */
function recognitionIn(programmeCode, destinationCountry) {
    const programme = PROGRAMMES[programmeCode];
    if (!programme) return { recognised: false, basis: null };
    const j = jurisdictionOf(destinationCountry);
    if (programme.jurisdictions.includes(j)) return { recognised: true, basis: 'domestic' };
    if ((programme.mutual_recognition || []).includes(j)) return { recognised: true, basis: 'mutual_recognition' };
    return { recognised: false, basis: null };
}

/**
 * Which programme should this trader pursue first, given where they actually
 * ship? Ranked by how much of their volume it covers once mutual recognition is
 * taken into account, then by how fast it can be obtained.
 *
 * @param {string} homeCountry            where the trader is established
 * @param {object} destinationVolumes     { US: 40, DE: 30, ... } shipment counts or percentages
 */
function recommend(homeCountry, destinationVolumes = {}) {
    const candidates = programmesFor(homeCountry);
    const totalVolume = Object.values(destinationVolumes).reduce((a, b) => a + Number(b || 0), 0);

    const scored = candidates.map((p) => {
        let covered = 0;
        const coveredDestinations = [];
        for (const [dest, vol] of Object.entries(destinationVolumes)) {
            const r = recognitionIn(p.code, dest);
            if (r.recognised) {
                covered += Number(vol || 0);
                coveredDestinations.push({ destination: dest, basis: r.basis });
            }
        }
        const coverage = totalVolume > 0 ? covered / totalVolume : 0;
        return {
            programme: p.code,
            label: p.label,
            coverage_pct: Math.round(coverage * 1000) / 10,
            covered_destinations: coveredDestinations,
            exam_rate_multiplier: p.exam_rate_multiplier,
            typical_lead_time_days: p.typical_lead_time_days,
            prerequisites: p.prerequisites || [],
            // Coverage first, then how much it reduces exams, then how quickly it
            // can be had. A programme covering 10% of volume is not the place to
            // spend six months.
            score: Math.round((coverage * 100 * (1 - p.exam_rate_multiplier)) * 100) / 100,
        };
    });

    return scored.sort((a, b) => b.score - a.score || a.typical_lead_time_days - b.typical_lead_time_days);
}

module.exports = {
    PROGRAMME_VERSION,
    CRITERION,
    CRITERIA,
    CUSTOMS_CRITERIA,
    SECURITY_CRITERIA,
    PROGRAMMES,
    EU_MEMBERS,
    jurisdictionOf,
    programmesFor,
    recognitionIn,
    recommend,
};
