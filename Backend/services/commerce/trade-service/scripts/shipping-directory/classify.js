'use strict';
/**
 * Wikidata ship class -> tradeops.vessels.vessel_type, and company class -> commercial
 * vs. state operator.
 *
 * Rules are ordered and match on the resolved English label rather than a fixed QID
 * list. Wikidata types ships through hundreds of subclasses ("Panamax bulk carrier",
 * "products tanker", "ro-pax ferry"), so an exhaustive QID map would silently dump most
 * of the fleet into 'other'; a QID map only covers the handful of classes whose labels
 * are ambiguous. Order matters — 'chemical tanker' must be tested before 'tanker', and
 * 'container' before the generic 'cargo'.
 */

// Labels that a keyword rule would misread. Checked first.
const BY_QID = {
    Q17210: 'container',      // container ship
    Q11446: 'other',          // bare "ship" — no type information at all
    Q2055880: 'passenger',    // passenger ship
    Q25653: 'ferry',
};

const RULES = [
    [/\bcontainer\b|\bfeeder ship\b/, 'container'],
    [/\bcruise\b/, 'cruise'],
    [/\bchemical\s+tanker\b|\bproducts?\s+tanker\b/, 'chemical_tanker'],
    [/\blng\b|liquefied natural gas/, 'lng_carrier'],
    [/\blpg\b|liquefied petroleum|gas carrier/, 'lpg_carrier'],
    [/\boil\s+tanker\b|crude (oil )?(carrier|tanker)|\bvlcc\b|\bulcc\b/, 'oil_tanker'],
    [/\btanker\b/, 'tanker'],
    [/\bbulk\s*carrier\b|\bbulker\b|\bore carrier\b|\bcolliers?\b/, 'bulk_carrier'],
    [/\bcar carrier\b|vehicle carrier|\bpctc\b|\bpcc\b/, 'car_carrier'],
    [/roll-?on|\bro-?ro\b|\bro-?pax\b/, 'roro'],
    [/\breefer\b|refrigerated cargo/, 'reefer'],
    [/heavy[- ]lift/, 'heavy_lift'],
    [/multi-?purpose/, 'multi_purpose'],
    [/\bferry\b|ferryboat/, 'ferry'],
    [/\bcruise\b|\bocean liner\b/, 'cruise'],
    [/passenger/, 'passenger'],
    [/\btug\b|tugboat|\btowboat\b|pusher/, 'tug'],
    [/platform supply|offshore (supply|support)|\bahts\b|\bosv\b/, 'offshore_supply'],
    [/\bfishing\b|trawler|seiner|longliner|whaler|factory ship/, 'fishing'],
    [/research (vessel|ship)|survey (vessel|ship)|oceanographic|icebreaker/, 'research'],
    [/dredger|dredging|hopper/, 'dredger'],
    [/\bbarge\b|\blighter\b/, 'barge'],
    [/\brig\b|drillship|jackup|jack-up|semi-submersible|drilling (unit|platform)/, 'rig'],
    [/\bnaval\b|warship|frigate|destroyer|corvette|patrol (vessel|boat)|minesweeper|submarine|aircraft carrier|landing (ship|craft)|auxiliary ship|cutter/, 'naval'],
    [/general cargo|\bfreighter\b|coastal trading ship/, 'general_cargo'],
    [/\bcargo\b/, 'general_cargo'],

    // Long tail, taken from the classes that actually turned up in the ingest rather than
    // guessed at. Each maps to the type the vessel genuinely is: a cement carrier is a
    // bulk carrier, a bunker vessel is a fuel tanker, an FPSO is an offshore unit.
    [/cement carrier|ore-bulk-oil|self-unloader|\bcolliery\b/, 'bulk_carrier'],
    [/bunker (vessel|barge|tanker)|\bbunkering\b/, 'tanker'],
    [/crane (vessel|ship)|sheerlegs|floating crane/, 'heavy_lift'],
    [/pipe-?laying|cable (layer|ship|vessel)|dive support|well intervention/, 'offshore_supply'],
    [/oil platform|floating production|\bfpso\b|\bfsru\b|production platform/, 'rig'],
    [/replenishment oiler|buoy tender|\bicebreaking tug\b|hospital ship|troopship/, 'naval'],
    [/\byacht\b|superyacht|megayacht/, 'yacht'],
    [/live fish carrier|well ?boat/, 'fishing'],

    // Deliberately NOT mapped: "motor ship", "steamship", "catamaran", "schooner",
    // "sailing ship". Those describe propulsion or hull form, not what the ship carries,
    // so inferring a cargo type from them would be inventing information.
];

/**
 * @param {string[]} typeQids  P31 values for the vessel
 * @param {(q:string)=>string|null} labelOf
 * @returns {string} a value permitted by chk_vessels_type
 */
function classifyVessel(typeQids, labelOf) {
    const labels = [];
    for (const q of typeQids || []) {
        // A specific class beats the generic "ship" fallback, so collect before deciding.
        if (BY_QID[q] && BY_QID[q] !== 'other') return BY_QID[q];
        const l = labelOf(q);
        if (l) labels.push(l.toLowerCase());
    }
    for (const [re, type] of RULES) {
        if (labels.some((l) => re.test(l))) return type;
    }
    return 'other';
}

const STATE_OPERATOR = /\bnavy\b|naval|coast ?guard|armed forces|ministry|government agency|military|air force|army\b/;

/**
 * Entities that operate a ship but are NOT shipping companies.
 *
 * The company set is built partly from "whoever a vessel names as its operator or owner"
 * (see fetch-companies.js), and Wikidata answers that question with whatever is true —
 * which for a state ferry is a country, for a municipal fireboat is a city, and for a
 * private yacht is a named individual. Those all arrived in the directory typed
 * 'commercial', so the list of the world's shipping companies opened with Russia, Norway,
 * New York City and a private yacht owner.
 *
 * They are RECLASSIFIED, not deleted: the vessel-to-owner link is genuine reference data
 * and the ship pages depend on it. Reclassifying keeps the attribution and takes the
 * entity out of a list it was never a member of.
 */
const NOT_A_COMPANY = {
    // A human being. 71 of these were listed as commercial shipping companies.
    human: /^human$|^person$/,
    // A place. Countries and cities own ferries, dredgers and research vessels.
    place: /^country$|sovereign state|^city\b|^town\b|municipality|^state of|^province|federal state|^island (country|nation)|constituent (state|country)|city-state|^capital\b|metropolis|urban (municipality|area)/,
};

/**
 * @returns {'company'|'human'|'place'} what the entity actually is.
 */
function classifyEntityKind(typeQids, labelOf) {
    const labels = (typeQids || []).map(labelOf).filter(Boolean).map((l) => l.toLowerCase());
    if (!labels.length) return 'company';
    // An entity typed BOTH as a person and as a business is a business (one-person
    // shipowning firms are typed loosely); the company reading wins.
    const looksLikeOrg = labels.some((l) => /company|business|enterprise|corporation|organi[sz]ation|line\b|firm|agency|conglomerate|group\b|subsidiary|cooperative|partnership/.test(l));
    if (looksLikeOrg) return 'company';
    for (const [kind, re] of Object.entries(NOT_A_COMPANY)) {
        if (labels.some((l) => re.test(l))) return kind;
    }
    return 'company';
}

/**
 * Commercial shipping company, a state fleet (navy, coast guard, or a country operating
 * ships in its own name), or an entity that is not a company at all.
 *
 * @returns {'commercial'|'state'|'private_owner'}
 */
function classifyCompany(typeQids, labelOf, name) {
    const kind = classifyEntityKind(typeQids, labelOf);
    // A country or city operating a vessel is a state operator, which the directory
    // already has a category for.
    if (kind === 'place') return 'state';
    // A named individual is a private owner. Not a navy, and not a shipping line.
    if (kind === 'human') return 'private_owner';

    const labels = (typeQids || []).map(labelOf).filter(Boolean).map((l) => l.toLowerCase());
    if (labels.some((l) => STATE_OPERATOR.test(l))) return 'state';
    if (name && STATE_OPERATOR.test(name.toLowerCase())) return 'state';
    return 'commercial';
}

module.exports = { classifyVessel, classifyCompany, classifyEntityKind, RULES, BY_QID };
