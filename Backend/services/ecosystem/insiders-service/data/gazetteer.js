'use strict';
/**
 * Turns the free-text `location` an admin types ("San Francisco, CA", "Bangalore, India",
 * "Singapore") into structured country / state / city with slugs, so the directory can be
 * browsed geographically.
 *
 * Why resolve on write rather than match text at read time: a row whose location reads
 * "Palo Alto, CA" contains the string "United States" nowhere, so a country page built by
 * text search would silently miss it — the same trap the jobs portal hit. Resolution happens
 * once, in a model hook, and every read is an indexed equality check on a slug.
 *
 * Known tables normalise ("CA" -> California, "USA" -> United States). An UNKNOWN middle
 * segment is still kept as a state, so "Bangalore, Karnataka, India" works without India's
 * states having to be enumerated here. Nothing is invented: a location that resolves to
 * nothing stays null and the row simply doesn't appear on a place page.
 */

const slugify = (s) => String(s || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

// name -> extra aliases. ISO-2 codes are added automatically from the key order below.
const COUNTRIES = [
    ['United States', ['usa', 'us', 'u.s.', 'u.s.a.', 'united states of america', 'america']],
    ['United Kingdom', ['uk', 'u.k.', 'great britain', 'britain', 'england', 'scotland', 'wales', 'northern ireland']],
    ['United Arab Emirates', ['uae', 'u.a.e.']],
    ['Canada', []], ['Australia', []], ['New Zealand', ['nz']],
    ['India', []], ['China', ['prc']], ['Hong Kong', ['hong kong sar']], ['Macau', ['macao']],
    ['Japan', []], ['South Korea', ['korea', 'republic of korea']], ['Singapore', []],
    ['Indonesia', []], ['Malaysia', []], ['Thailand', []], ['Vietnam', ['viet nam']],
    ['Philippines', []], ['Taiwan', []], ['Pakistan', []], ['Bangladesh', []], ['Sri Lanka', []],
    ['Germany', ['deutschland']], ['France', []], ['Spain', []], ['Portugal', []], ['Italy', []],
    ['Netherlands', ['holland', 'the netherlands']], ['Belgium', []], ['Luxembourg', []],
    ['Switzerland', []], ['Austria', []], ['Ireland', []], ['Denmark', []], ['Sweden', []],
    ['Norway', []], ['Finland', []], ['Iceland', []], ['Estonia', []], ['Latvia', []],
    ['Lithuania', []], ['Poland', []], ['Czech Republic', ['czechia']], ['Slovakia', []],
    ['Hungary', []], ['Romania', []], ['Bulgaria', []], ['Greece', []], ['Croatia', []],
    ['Slovenia', []], ['Serbia', []], ['Ukraine', []], ['Turkey', ['turkiye']], ['Russia', []],
    ['Israel', []], ['Saudi Arabia', ['ksa']], ['Qatar', []], ['Kuwait', []], ['Bahrain', []],
    ['Oman', []], ['Jordan', []], ['Lebanon', []], ['Egypt', []], ['Morocco', []], ['Tunisia', []],
    ['Nigeria', []], ['Ghana', []], ['Kenya', []], ['Uganda', []], ['Tanzania', []],
    ['Rwanda', []], ['Ethiopia', []], ['South Africa', ['rsa']], ['Senegal', []],
    ["Côte d'Ivoire", ['ivory coast', 'cote d ivoire']], ['Cameroon', []], ['Zambia', []],
    ['Zimbabwe', []], ['Botswana', []], ['Mauritius', []],
    ['Mexico', []], ['Brazil', ['brasil']], ['Argentina', []], ['Chile', []], ['Colombia', []],
    ['Peru', []], ['Uruguay', []], ['Ecuador', []], ['Panama', []], ['Costa Rica', []],
    ['Guatemala', []], ['Dominican Republic', []], ['Jamaica', []], ['Trinidad and Tobago', []],
    ['Bermuda', []], ['Cayman Islands', []], ['British Virgin Islands', ['bvi']],
    ['Kazakhstan', []], ['Uzbekistan', []], ['Georgia (country)', ['republic of georgia']],
    ['Armenia', []], ['Azerbaijan', []], ['Nepal', []], ['Myanmar', ['burma']], ['Cambodia', []],
    ['Malta', []], ['Cyprus', []], ['Monaco', []], ['Liechtenstein', []], ['Andorra', []],
];

const ISO2 = {
    'United States': 'US', 'United Kingdom': 'GB', 'United Arab Emirates': 'AE', Canada: 'CA',
    Australia: 'AU', India: 'IN', China: 'CN', 'Hong Kong': 'HK', Japan: 'JP', Singapore: 'SG',
    Germany: 'DE', France: 'FR', Spain: 'ES', Italy: 'IT', Netherlands: 'NL', Switzerland: 'CH',
    Ireland: 'IE', Sweden: 'SE', Norway: 'NO', Denmark: 'DK', Finland: 'FI', Poland: 'PL',
    Portugal: 'PT', Israel: 'IL', Brazil: 'BR', Mexico: 'MX', Nigeria: 'NG', Kenya: 'KE',
    'South Africa': 'ZA', Egypt: 'EG', Turkey: 'TR', Indonesia: 'ID', Vietnam: 'VN',
};

// Two maps, deliberately kept apart. Bare ISO-2 codes are ambiguous against state
// abbreviations — "CA" is California far more often than Canada, "IN" Indiana more often
// than India — so names and spelled-out aliases ("USA", "UK", "UAE") are matched first and
// ISO-2 only as a last resort, after the state tables have had their turn.
const COUNTRY_NAMES = new Map();
for (const [name, aliases] of COUNTRIES) {
    COUNTRY_NAMES.set(name.toLowerCase(), name);
    COUNTRY_NAMES.set(slugify(name), name);
    for (const a of aliases) { COUNTRY_NAMES.set(a.toLowerCase(), name); COUNTRY_NAMES.set(slugify(a), name); }
}
const COUNTRY_ISO2 = new Map(Object.entries(ISO2).map(([name, code]) => [code.toLowerCase(), name]));
const COUNTRY_LOOKUP = new Map([...COUNTRY_ISO2, ...COUNTRY_NAMES]);

// A city that is also its own country — "Singapore" alone must fill both, or it disappears
// from city browsing entirely.
const CITY_STATES = new Set(['Singapore', 'Hong Kong', 'Macau', 'Monaco', 'Luxembourg', 'Malta', 'Bermuda', 'Qatar', 'Bahrain']);

const STATES = {
    'United States': {
        AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
        CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
        IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
        ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
        MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
        NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
        ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
        RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
        UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
        WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
    },
    Canada: {
        AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
        NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
        NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
        SK: 'Saskatchewan', YT: 'Yukon',
    },
    Australia: {
        ACT: 'Australian Capital Territory', NSW: 'New South Wales', NT: 'Northern Territory',
        QLD: 'Queensland', SA: 'South Australia', TAS: 'Tasmania', VIC: 'Victoria',
        WA: 'Western Australia',
    },
    India: {
        AP: 'Andhra Pradesh', AS: 'Assam', BR: 'Bihar', CG: 'Chhattisgarh', DL: 'Delhi',
        GA: 'Goa', GJ: 'Gujarat', HR: 'Haryana', HP: 'Himachal Pradesh', JH: 'Jharkhand',
        KA: 'Karnataka', KL: 'Kerala', MP: 'Madhya Pradesh', MH: 'Maharashtra', OD: 'Odisha',
        PB: 'Punjab', RJ: 'Rajasthan', TN: 'Tamil Nadu', TS: 'Telangana', UP: 'Uttar Pradesh',
        UK: 'Uttarakhand', WB: 'West Bengal',
    },
    'United Kingdom': { ENG: 'England', SCT: 'Scotland', WLS: 'Wales', NIR: 'Northern Ireland' },
};

// Cities famous enough that people write them without a country. Only used as a last resort,
// and only where the mapping is unambiguous.
const BARE_CITIES = {
    'san francisco': ['United States', 'California'], 'new york': ['United States', 'New York'],
    'nyc': ['United States', 'New York'], 'boston': ['United States', 'Massachusetts'],
    'los angeles': ['United States', 'California'], 'palo alto': ['United States', 'California'],
    'menlo park': ['United States', 'California'], 'mountain view': ['United States', 'California'],
    'austin': ['United States', 'Texas'], 'seattle': ['United States', 'Washington'],
    'chicago': ['United States', 'Illinois'], 'miami': ['United States', 'Florida'],
    london: ['United Kingdom', 'England'], berlin: ['Germany', null], paris: ['France', null],
    amsterdam: ['Netherlands', null], stockholm: ['Sweden', null], zurich: ['Switzerland', null],
    dublin: ['Ireland', null], lisbon: ['Portugal', null], madrid: ['Spain', null],
    milan: ['Italy', null], munich: ['Germany', null], dubai: ['United Arab Emirates', null],
    'abu dhabi': ['United Arab Emirates', null], 'tel aviv': ['Israel', null],
    bangalore: ['India', 'Karnataka'], bengaluru: ['India', 'Karnataka'],
    mumbai: ['India', 'Maharashtra'], delhi: ['India', 'Delhi'], 'new delhi': ['India', 'Delhi'],
    gurgaon: ['India', 'Haryana'], gurugram: ['India', 'Haryana'], pune: ['India', 'Maharashtra'],
    hyderabad: ['India', 'Telangana'], chennai: ['India', 'Tamil Nadu'],
    toronto: ['Canada', 'Ontario'], vancouver: ['Canada', 'British Columbia'],
    montreal: ['Canada', 'Quebec'], sydney: ['Australia', 'New South Wales'],
    melbourne: ['Australia', 'Victoria'], tokyo: ['Japan', null], seoul: ['South Korea', null],
    shanghai: ['China', null], beijing: ['China', null], shenzhen: ['China', null],
    jakarta: ['Indonesia', null], manila: ['Philippines', null], bangkok: ['Thailand', null],
    lagos: ['Nigeria', null], nairobi: ['Kenya', null], accra: ['Ghana', null],
    'cape town': ['South Africa', null], johannesburg: ['South Africa', null],
    cairo: ['Egypt', null], 'sao paulo': ['Brazil', null], 'são paulo': ['Brazil', null],
    'mexico city': ['Mexico', null], 'buenos aires': ['Argentina', null], bogota: ['Colombia', null],
    santiago: ['Chile', null],
};

const norm = (p) => String(p || '').toLowerCase().trim();
// Spelled-out name or alias only — never a bare ISO-2 code.
const matchCountryName = (part) => COUNTRY_NAMES.get(norm(part)) || null;
// Any form, used for the caller's country hint where there is nothing to be ambiguous with.
const matchCountry = (part) => COUNTRY_LOOKUP.get(norm(part)) || null;

// Searches every known state table for an abbreviation or full name; returns [country, state].
function matchStateAnywhere(part) {
    const raw = String(part || '').trim();
    if (!raw) return null;
    const upper = raw.toUpperCase().replace(/\./g, '');
    for (const [country, table] of Object.entries(STATES)) {
        if (table[upper]) return [country, table[upper]];
    }
    for (const [country, table] of Object.entries(STATES)) {
        const full = Object.values(table).find((v) => v.toLowerCase() === norm(raw));
        if (full) return [country, full];
    }
    return null;
}

// Resolves a state within a country: full name, or the postal abbreviation.
const matchState = (part, country) => {
    const table = STATES[country];
    const raw = String(part || '').trim();
    if (!raw) return null;
    if (!table) return raw;                                   // unknown country: keep as typed
    const upper = raw.toUpperCase().replace(/\./g, '');
    if (table[upper]) return table[upper];
    const full = Object.values(table).find((v) => v.toLowerCase() === raw.toLowerCase());
    return full || raw;
};

/**
 * @param {string} text  free-text location, e.g. "Palo Alto, CA" or "Bangalore, Karnataka, India"
 * @param {string} [fallbackCountry] a `region`/country hint used only when the text has no country
 * @returns {{country,country_slug,state,state_slug,city,city_slug}} nulls where nothing resolved
 */
function resolvePlace(text, fallbackCountry) {
    const empty = { country: null, country_slug: null, state: null, state_slug: null, city: null, city_slug: null };
    const parts = String(text || '').split(',').map((p) => p.trim()).filter(Boolean);
    if (!parts.length) {
        const c = matchCountry(fallbackCountry);
        return c ? { ...empty, country: c, country_slug: slugify(c) } : empty;
    }

    let country = null, state = null, city = null;
    let countryFromState = false;

    // 1. Trailing segment as a spelled-out country ("…, United States", "…, UK").
    if (parts.length > 1 && matchCountryName(parts[parts.length - 1])) {
        country = matchCountryName(parts.pop());
    } else if (parts.length === 1 && matchCountryName(parts[0])) {
        country = matchCountryName(parts[0]);
        if (CITY_STATES.has(country)) city = country;
        parts.pop();
    }

    // 2. Otherwise a state abbreviation or name, which also tells us the country
    //    ("San Francisco, CA" -> California, United States).
    if (!country && parts.length > 1) {
        const hit = matchStateAnywhere(parts[parts.length - 1]);
        if (hit) { [country, state] = hit; countryFromState = true; parts.pop(); }
    }

    // 3. Last resort: a bare ISO-2 code that matched no state.
    if (!country && parts.length > 1 && COUNTRY_ISO2.get(norm(parts[parts.length - 1]))) {
        country = COUNTRY_ISO2.get(norm(parts.pop()));
    }

    if (!state && parts.length > 1) state = matchState(parts.pop(), country);
    if (!city && parts.length) city = parts.join(', ');

    // "Berlin, DE" resolves to Delaware by abbreviation; the city name says otherwise. A city
    // we know by name outranks a country inferred purely from a two-letter state guess.
    if (countryFromState && city) {
        const known = BARE_CITIES[norm(city)];
        if (known && known[0] !== country) { country = known[0]; state = known[1]; }
    }

    // Still no country: a well-known city name can supply it, otherwise the caller's hint.
    if (!country && city) {
        const known = BARE_CITIES[city.toLowerCase()];
        if (known) { country = known[0]; state = state || known[1]; }
    }
    if (!country) country = matchCountry(fallbackCountry);
    if (country && !state && city) {
        const known = BARE_CITIES[city.toLowerCase()];
        if (known && known[0] === country) state = known[1];
    }

    return {
        country: country || null,
        country_slug: country ? slugify(country) : null,
        state: state || null,
        state_slug: state ? slugify(state) : null,
        city: city || null,
        city_slug: city ? slugify(city) : null,
    };
}

module.exports = { resolvePlace, slugify, COUNTRIES, STATES, ISO2 };
