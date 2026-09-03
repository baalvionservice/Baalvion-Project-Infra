'use strict';
/**
 * Where people actually search from.
 *
 * Someone looking for work types the name of their own suburb — "frontend developer in
 * Virar", not "in Mumbai Metropolitan Region". This gazetteer maps those local names to
 * the metro they belong to, so a search for a suburb finds the roles posted there AND
 * the ones a commute away, and so a role posted in Andheri is reachable from a search
 * for Mumbai.
 *
 * This is geography, not marketing copy: every entry is a real place with the name
 * people use for it. `aliases` carry the older or alternate spellings that are still
 * what gets typed (Bombay, Bangalore, Gurgaon).
 *
 * Coverage is deliberately deepest where the hiring is. A place NOT listed here still
 * works everywhere — jobs store the city exactly as the recruiter typed it, and search
 * falls back to matching that text. The gazetteer only adds the extra reach of knowing
 * that Nalasopara is Mumbai.
 */

// A metro is a city plus the towns that commute into it.
const METROS = [
    {
        slug: 'mumbai',
        name: 'Mumbai',
        state: 'Maharashtra',
        countryId: 'country_in',
        aliases: ['bombay', 'mumbai metropolitan region', 'mmr', 'greater mumbai'],
        localities: [
            { name: 'Andheri', aliases: ['andheri east', 'andheri west'] },
            { name: 'Bandra', aliases: ['bandra east', 'bandra west', 'bkc', 'bandra kurla complex'] },
            { name: 'Borivali' },
            { name: 'Chembur' },
            { name: 'Colaba' },
            { name: 'Dadar' },
            { name: 'Goregaon' },
            { name: 'Jogeshwari' },
            { name: 'Juhu' },
            { name: 'Kandivali' },
            { name: 'Kurla' },
            { name: 'Lower Parel' },
            { name: 'Malad' },
            { name: 'Mulund' },
            { name: 'Powai' },
            { name: 'Santacruz' },
            { name: 'Vikhroli' },
            { name: 'Worli' },
            // The wider region — these are separate municipalities, and people there
            // absolutely search for work "in Virar" rather than "in Mumbai".
            { name: 'Navi Mumbai', aliases: ['new bombay'] },
            { name: 'Vashi' },
            { name: 'Belapur', aliases: ['cbd belapur'] },
            { name: 'Airoli' },
            { name: 'Panvel' },
            { name: 'Thane' },
            { name: 'Mira Road' },
            { name: 'Bhayandar' },
            { name: 'Vasai' },
            { name: 'Virar' },
            { name: 'Nalasopara', aliases: ['nala sopara'] },
            { name: 'Kalyan' },
            { name: 'Dombivli', aliases: ['dombivali'] },
            { name: 'Ulhasnagar' },
            { name: 'Ambernath' },
            { name: 'Badlapur' },
        ],
    },
    {
        slug: 'delhi-ncr',
        name: 'Delhi NCR',
        state: 'Delhi',
        countryId: 'country_in',
        aliases: ['delhi', 'new delhi', 'ncr', 'national capital region'],
        localities: [
            { name: 'Connaught Place', aliases: ['cp'] },
            { name: 'Saket' },
            { name: 'Dwarka' },
            { name: 'Rohini' },
            { name: 'Nehru Place' },
            { name: 'Okhla' },
            { name: 'Gurugram', aliases: ['gurgaon', 'cyber city', 'cyberhub'] },
            { name: 'Noida' },
            { name: 'Greater Noida' },
            { name: 'Ghaziabad' },
            { name: 'Faridabad' },
            { name: 'Sonipat' },
        ],
    },
    {
        slug: 'bengaluru',
        name: 'Bengaluru',
        state: 'Karnataka',
        countryId: 'country_in',
        aliases: ['bangalore', 'bengaluru urban'],
        localities: [
            { name: 'Whitefield' },
            { name: 'Koramangala' },
            { name: 'Indiranagar' },
            { name: 'Electronic City' },
            { name: 'HSR Layout', aliases: ['hsr'] },
            { name: 'Marathahalli' },
            { name: 'Bellandur' },
            { name: 'Sarjapur Road', aliases: ['sarjapur'] },
            { name: 'Hebbal' },
            { name: 'Yelahanka' },
            { name: 'Jayanagar' },
            { name: 'JP Nagar' },
            { name: 'Rajajinagar' },
            { name: 'Malleshwaram' },
            { name: 'Banashankari' },
            { name: 'Manyata Tech Park', aliases: ['manyata'] },
        ],
    },
    {
        slug: 'pune',
        name: 'Pune',
        state: 'Maharashtra',
        countryId: 'country_in',
        aliases: ['poona', 'pimpri chinchwad', 'pcmc'],
        localities: [
            { name: 'Hinjewadi', aliases: ['hinjawadi', 'rajiv gandhi infotech park'] },
            { name: 'Kharadi' },
            { name: 'Magarpatta' },
            { name: 'Baner' },
            { name: 'Aundh' },
            { name: 'Viman Nagar' },
            { name: 'Wakad' },
            { name: 'Hadapsar' },
            { name: 'Kothrud' },
            { name: 'Pimpri' },
            { name: 'Chinchwad' },
            { name: 'Talegaon' },
        ],
    },
    {
        slug: 'hyderabad',
        name: 'Hyderabad',
        state: 'Telangana',
        countryId: 'country_in',
        aliases: ['secunderabad', 'cyberabad'],
        localities: [
            { name: 'HITEC City', aliases: ['hitech city', 'hitec'] },
            { name: 'Gachibowli' },
            { name: 'Madhapur' },
            { name: 'Kondapur' },
            { name: 'Kukatpally' },
            { name: 'Banjara Hills' },
            { name: 'Jubilee Hills' },
            { name: 'Begumpet' },
            { name: 'Uppal' },
            { name: 'Shamshabad' },
        ],
    },
    {
        slug: 'chennai',
        name: 'Chennai',
        state: 'Tamil Nadu',
        countryId: 'country_in',
        aliases: ['madras'],
        localities: [
            { name: 'OMR', aliases: ['old mahabalipuram road', 'rajiv gandhi salai'] },
            { name: 'Guindy' },
            { name: 'Velachery' },
            { name: 'Adyar' },
            { name: 'T Nagar', aliases: ['thyagaraya nagar'] },
            { name: 'Porur' },
            { name: 'Sholinganallur' },
            { name: 'Ambattur' },
            { name: 'Tambaram' },
            { name: 'Siruseri' },
        ],
    },
    {
        slug: 'kolkata',
        name: 'Kolkata',
        state: 'West Bengal',
        countryId: 'country_in',
        aliases: ['calcutta'],
        localities: [
            { name: 'Salt Lake', aliases: ['bidhannagar', 'sector v', 'sector 5'] },
            { name: 'New Town', aliases: ['rajarhat'] },
            { name: 'Howrah' },
            { name: 'Behala' },
            { name: 'Ballygunge' },
            { name: 'Park Street' },
        ],
    },
    {
        slug: 'ahmedabad',
        name: 'Ahmedabad',
        state: 'Gujarat',
        countryId: 'country_in',
        aliases: ['amdavad'],
        localities: [
            { name: 'SG Highway', aliases: ['sarkhej gandhinagar highway'] },
            { name: 'Prahlad Nagar' },
            { name: 'Satellite' },
            { name: 'Bopal' },
            { name: 'Gandhinagar' },
            { name: 'GIFT City', aliases: ['gift'] },
        ],
    },
    {
        // Trade corridors. Mundra, Nhava Sheva and Kandla are where India's containers
        // actually move; people working there search by the port town, not the state.
        slug: 'kandla',
        name: 'Kandla',
        state: 'Gujarat',
        countryId: 'country_in',
        aliases: ['deendayal port', 'kutch'],
        localities: [
            { name: 'Mundra' },
            { name: 'Gandhidham' },
            { name: 'Adipur' },
            { name: 'Anjar' },
        ],
    },
    {
        slug: 'nhava-sheva',
        name: 'Nhava Sheva',
        state: 'Maharashtra',
        countryId: 'country_in',
        aliases: ['jnpt', 'jawaharlal nehru port', 'uran'],
        localities: [
            { name: 'Uran' },
            { name: 'Dronagiri' },
            { name: 'Sheva' },
        ],
    },
    {
        slug: 'kochi',
        name: 'Kochi',
        state: 'Kerala',
        countryId: 'country_in',
        aliases: ['cochin', 'ernakulam'],
        localities: [
            { name: 'Infopark', aliases: ['kakkanad'] },
            { name: 'Fort Kochi' },
            { name: 'Edappally' },
            { name: 'Aluva' },
        ],
    },
    // Mining belts. These are working towns, not metros — a haul truck driver in Barbil
    // searches for "Barbil", and the nearest big city is hours away. Each is grouped with
    // the district and neighbouring townships people actually commute between.
    {
        slug: 'keonjhar',
        name: 'Keonjhar',
        state: 'Odisha',
        countryId: 'country_in',
        aliases: ['kendujhar', 'keonjhar district'],
        localities: [
            { name: 'Barbil' },
            { name: 'Joda' },
            { name: 'Bolani' },
            { name: 'Champua' },
            { name: 'Daitari', aliases: ['daitari mines'] },
        ],
    },
    {
        // The Koraput belt: bauxite on the hills, alumina refining below them, and a
        // string of working towns along the ghat road. People here search by their own
        // town — "jobs in Damanjodi" — and the nearest metro is hours away.
        slug: 'koraput',
        name: 'Koraput',
        state: 'Odisha',
        countryId: 'country_in',
        aliases: ['koraput district', 'jeypore koraput'],
        localities: [
            { name: 'Damanjodi', aliases: ['damonjodi'] },
            { name: 'Semiliguda', aliases: ['semiliguda block', 'sunki'] },
            { name: 'Sunabeda' },
            { name: 'Jeypore', aliases: ['jaipur odisha'] },
            { name: 'Kotpad' },
            { name: 'Pottangi' },
            { name: 'Laxmipur' },
            { name: 'Boipariguda' },
            { name: 'Nandapur' },
            { name: 'Panchpatmali', aliases: ['panchapatmali'] },
            { name: 'Rayagada' },
            { name: 'Kashipur' },
        ],
    },
    {
        slug: 'ballari',
        name: 'Ballari',
        state: 'Karnataka',
        countryId: 'country_in',
        aliases: ['bellary'],
        localities: [
            { name: 'Sandur' },
            { name: 'Hospet', aliases: ['hosapete'] },
            { name: 'Donimalai' },
            { name: 'Kudligi' },
        ],
    },
    {
        slug: 'dhanbad',
        name: 'Dhanbad',
        state: 'Jharkhand',
        countryId: 'country_in',
        aliases: ['coal capital'],
        localities: [
            { name: 'Jharia' },
            { name: 'Katras' },
            { name: 'Sindri' },
            { name: 'Bokaro' },
            { name: 'Chirkunda' },
        ],
    },
    {
        slug: 'korba',
        name: 'Korba',
        state: 'Chhattisgarh',
        countryId: 'country_in',
        aliases: [],
        localities: [
            { name: 'Gevra' },
            { name: 'Dipka' },
            { name: 'Kusmunda' },
            { name: 'Katghora' },
        ],
    },
    {
        slug: 'dantewada',
        name: 'Dantewada',
        state: 'Chhattisgarh',
        countryId: 'country_in',
        aliases: ['bastar'],
        localities: [
            { name: 'Bailadila' },
            { name: 'Kirandul' },
            { name: 'Bacheli' },
            { name: 'Geedam' },
        ],
    },
    {
        slug: 'singrauli',
        name: 'Singrauli',
        state: 'Madhya Pradesh',
        countryId: 'country_in',
        aliases: [],
        localities: [{ name: 'Waidhan' }, { name: 'Jayant' }, { name: 'Nigahi' }, { name: 'Amlohri' }],
    },
    {
        slug: 'udaipur',
        name: 'Udaipur',
        state: 'Rajasthan',
        countryId: 'country_in',
        aliases: [],
        localities: [{ name: 'Zawar' }, { name: 'Debari' }, { name: 'Rajsamand' }, { name: 'Chittorgarh' }],
    },
    {
        slug: 'ramagundam',
        name: 'Ramagundam',
        state: 'Telangana',
        countryId: 'country_in',
        aliases: ['godavarikhani'],
        localities: [{ name: 'Godavarikhani' }, { name: 'Mancherial' }, { name: 'Bellampalli' }],
    },
    {
        slug: 'goa',
        name: 'Goa',
        state: 'Goa',
        countryId: 'country_in',
        aliases: ['panaji', 'panjim'],
        localities: [{ name: 'Panaji' }, { name: 'Margao' }, { name: 'Vasco da Gama', aliases: ['vasco'] }, { name: 'Sanguem' }, { name: 'Bicholim' }],
    },
    {
        slug: 'nagpur-mining',
        name: 'Nagpur Region',
        state: 'Maharashtra',
        countryId: 'country_in',
        aliases: ['vidarbha'],
        localities: [{ name: 'Chandrapur' }, { name: 'Gondia' }, { name: 'Wani' }, { name: 'Ballarpur' }],
    },
    {
        slug: 'jaipur',
        name: 'Jaipur',
        state: 'Rajasthan',
        countryId: 'country_in',
        aliases: [],
        localities: [{ name: 'Malviya Nagar' }, { name: 'Mansarovar' }, { name: 'Vaishali Nagar' }, { name: 'Sitapura' }],
    },
    {
        slug: 'coimbatore',
        name: 'Coimbatore',
        state: 'Tamil Nadu',
        countryId: 'country_in',
        aliases: ['kovai'],
        localities: [{ name: 'Peelamedu' }, { name: 'Saravanampatti' }, { name: 'RS Puram' }, { name: 'Singanallur' }],
    },
    {
        slug: 'indore',
        name: 'Indore',
        state: 'Madhya Pradesh',
        countryId: 'country_in',
        aliases: [],
        localities: [{ name: 'Vijay Nagar' }, { name: 'Rau' }, { name: 'Palasia' }],
    },
    {
        slug: 'chandigarh',
        name: 'Chandigarh',
        state: 'Chandigarh',
        countryId: 'country_in',
        aliases: ['tricity', 'mohali', 'panchkula'],
        localities: [{ name: 'Mohali' }, { name: 'Panchkula' }, { name: 'Zirakpur' }, { name: 'IT Park' }],
    },
    {
        slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', countryId: 'country_in',
        aliases: [], localities: [{ name: 'Gomti Nagar' }, { name: 'Hazratganj' }, { name: 'Aliganj' }],
    },
    {
        slug: 'nagpur', name: 'Nagpur', state: 'Maharashtra', countryId: 'country_in',
        aliases: [], localities: [{ name: 'MIHAN' }, { name: 'Dharampeth' }, { name: 'Civil Lines' }],
    },
    {
        slug: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', countryId: 'country_in',
        aliases: [], localities: [{ name: 'Patia' }, { name: 'Chandrasekharpur' }, { name: 'Infocity' }],
    },
    {
        slug: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala', countryId: 'country_in',
        aliases: ['trivandrum'], localities: [{ name: 'Technopark' }, { name: 'Kazhakoottam' }],
    },
    {
        slug: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', countryId: 'country_in',
        aliases: ['vizag'], localities: [{ name: 'Madhurawada' }, { name: 'Gajuwaka' }, { name: 'Rushikonda' }],
    },
    {
        slug: 'surat', name: 'Surat', state: 'Gujarat', countryId: 'country_in',
        aliases: [], localities: [{ name: 'Adajan' }, { name: 'Vesu' }, { name: 'Piplod' }],
    },
    {
        slug: 'vadodara', name: 'Vadodara', state: 'Gujarat', countryId: 'country_in',
        aliases: ['baroda'], localities: [{ name: 'Alkapuri' }, { name: 'Gotri' }, { name: 'Makarpura' }],
    },
    {
        slug: 'mysuru', name: 'Mysuru', state: 'Karnataka', countryId: 'country_in',
        aliases: ['mysore'], localities: [{ name: 'Hebbal Industrial Area' }, { name: 'Vijayanagar' }],
    },
    {
        slug: 'mangaluru', name: 'Mangaluru', state: 'Karnataka', countryId: 'country_in',
        aliases: ['mangalore'], localities: [{ name: 'Kottara' }, { name: 'Bejai' }],
    },
    // ── Outside India ──────────────────────────────────────────────────────────
    // The company's other hiring hubs and trade corridors. Same treatment as the Indian
    // metros: the city plus the places people actually commute from.
    { slug: 'toronto', name: 'Toronto', state: 'Ontario', countryId: 'country_ca', aliases: ['gta', 'greater toronto'],
      localities: [{ name: 'Mississauga' }, { name: 'Scarborough' }, { name: 'North York' }, { name: 'Brampton' }, { name: 'Markham' }] },
    { slug: 'warsaw', name: 'Warsaw', state: 'Mazovia', countryId: 'country_pl', aliases: ['warszawa'],
      localities: [{ name: 'Mokotów', aliases: ['mokotow'] }, { name: 'Wola' }, { name: 'Śródmieście', aliases: ['srodmiescie'] }, { name: 'Praga' }] },
    { slug: 'krakow', name: 'Kraków', state: 'Lesser Poland', countryId: 'country_pl', aliases: ['krakow', 'cracow'],
      localities: [{ name: 'Kazimierz' }, { name: 'Podgórze', aliases: ['podgorze'] }, { name: 'Nowa Huta' }] },
    { slug: 'sydney', name: 'Sydney', state: 'New South Wales', countryId: 'country_au', aliases: ['nsw'],
      localities: [{ name: 'Parramatta' }, { name: 'North Sydney' }, { name: 'Chatswood' }, { name: 'Surry Hills' }] },
    { slug: 'melbourne', name: 'Melbourne', state: 'Victoria', countryId: 'country_au', aliases: ['vic'],
      localities: [{ name: 'Docklands' }, { name: 'Southbank' }, { name: 'Richmond' }, { name: 'Geelong' }] },
    { slug: 'ho-chi-minh-city', name: 'Ho Chi Minh City', state: 'Ho Chi Minh', countryId: 'country_vn', aliases: ['saigon', 'hcmc', 'ho chi minh'],
      localities: [{ name: 'District 1' }, { name: 'District 7' }, { name: 'Thu Duc' }, { name: 'Binh Thanh' }] },
    { slug: 'da-nang', name: 'Da Nang', state: 'Da Nang', countryId: 'country_vn', aliases: ['danang'],
      localities: [{ name: 'Hai Chau' }, { name: 'Son Tra' }] },
    { slug: 'manila', name: 'Manila', state: 'Metro Manila', countryId: 'country_ph', aliases: ['metro manila', 'ncr philippines'],
      localities: [{ name: 'Makati' }, { name: 'Bonifacio Global City', aliases: ['bgc', 'taguig'] }, { name: 'Ortigas' }, { name: 'Quezon City' }, { name: 'Pasig' }] },
    { slug: 'cebu', name: 'Cebu', state: 'Cebu', countryId: 'country_ph', aliases: ['cebu city'],
      localities: [{ name: 'IT Park' }, { name: 'Mandaue' }, { name: 'Lapu-Lapu' }] },
    { slug: 'kyiv', name: 'Kyiv', state: 'Kyiv', countryId: 'country_ua', aliases: ['kiev'],
      localities: [{ name: 'Podil' }, { name: 'Pechersk' }, { name: 'Obolon' }] },
    { slug: 'lviv', name: 'Lviv', state: 'Lviv', countryId: 'country_ua', aliases: ['lwow'],
      localities: [{ name: 'Halytskyi' }, { name: 'Sykhiv' }] },
    { slug: 'dubai', name: 'Dubai', state: 'Dubai', countryId: 'country_ae', aliases: ['dxb'],
      localities: [{ name: 'Jebel Ali' }, { name: 'DMCC', aliases: ['jlt', 'jumeirah lakes towers'] }, { name: 'Deira' }, { name: 'Business Bay' }] },
    { slug: 'singapore-city', name: 'Singapore', state: 'Singapore', countryId: 'country_sg', aliases: ['sg'],
      localities: [{ name: 'Tanjong Pagar' }, { name: 'Raffles Place' }, { name: 'Jurong' }, { name: 'Changi' }] },
    { slug: 'rotterdam', name: 'Rotterdam', state: 'South Holland', countryId: 'country_nl', aliases: ['port of rotterdam'],
      localities: [{ name: 'Maasvlakte' }, { name: 'Waalhaven' }, { name: 'Botlek' }] },
];

const slugify = (value) =>
    String(value)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

/**
 * Flat list of every searchable place: metros and their localities alike, each carrying
 * the metro it belongs to. A locality's `parentSlug` is what lets a Virar search widen
 * to Mumbai.
 */
const PLACES = [];
for (const metro of METROS) {
    PLACES.push({
        slug: metro.slug,
        name: metro.name,
        type: 'metro',
        state: metro.state,
        countryId: metro.countryId,
        parentSlug: null,
        aliases: metro.aliases,
        localitySlugs: metro.localities.map((l) => slugify(l.name)),
    });
    for (const locality of metro.localities) {
        PLACES.push({
            slug: slugify(locality.name),
            name: locality.name,
            type: 'locality',
            state: metro.state,
            countryId: metro.countryId,
            parentSlug: metro.slug,
            parentName: metro.name,
            aliases: locality.aliases || [],
            localitySlugs: [],
        });
    }
}

// States. People search "jobs in Odisha" at least as often as they search a town, and a
// state is not a place in the metro/locality sense — it contains them. Each is built
// from the metros already listed, so a state only exists here if we know somewhere in it.
const STATES = [];
{
    const byState = new Map();
    for (const metro of METROS) {
        if (!metro.state) continue;
        if (!byState.has(metro.state)) byState.set(metro.state, { countryId: metro.countryId, metros: [] });
        byState.get(metro.state).metros.push(metro.slug);
    }
    for (const [name, { countryId, metros }] of byState) {
        STATES.push({
            slug: slugify(name),
            name,
            type: 'state',
            state: name,
            countryId,
            parentSlug: null,
            aliases: [],
            metroSlugs: metros,
            localitySlugs: [],
        });
    }
}

// name + every alias → place, for resolving whatever a person actually typed. Places
// are registered before states so a town wins a name clash (Goa is both).
const BY_TERM = new Map();
for (const place of [...PLACES, ...STATES]) {
    const terms = [place.name, place.slug, ...(place.aliases || [])];
    for (const term of terms) {
        const key = String(term).toLowerCase().trim();
        // First writer wins: a metro is registered before its localities, so an ambiguous
        // term resolves to the bigger place rather than a neighbourhood inside it.
        if (!BY_TERM.has(key)) BY_TERM.set(key, place);
    }
}

const BY_SLUG = new Map([...PLACES, ...STATES].map((p) => [p.slug, p]));

/** Resolve a typed location ("virar", "Bombay", "HSR Layout") to a known place. */
function resolvePlace(term) {
    if (!term) return null;
    const key = String(term).toLowerCase().trim();
    return BY_TERM.get(key) || BY_SLUG.get(slugify(key)) || null;
}

/**
 * Every name worth matching a job's location text against for a given place.
 *
 * Searching a locality returns that locality's own terms plus its metro's — someone in
 * Virar wants the Virar roles first, but a Mumbai-wide role is still relevant to them.
 * Searching a metro returns the metro plus all of its localities, so "Mumbai" finds the
 * job posted in Andheri.
 */
function expandPlaceTerms(place) {
    if (!place) return [];
    const terms = new Set([place.name, ...(place.aliases || [])]);
    if (place.type === 'state') {
        for (const slug of place.metroSlugs) {
            const metro = BY_SLUG.get(slug);
            if (!metro) continue;
            terms.add(metro.name);
            for (const alias of metro.aliases || []) terms.add(alias);
        }
        return [...terms];
    }
    if (place.type === 'metro') {
        for (const slug of place.localitySlugs) {
            const child = BY_SLUG.get(slug);
            if (child) {
                terms.add(child.name);
                for (const alias of child.aliases || []) terms.add(alias);
            }
        }
    } else if (place.parentSlug) {
        const parent = BY_SLUG.get(place.parentSlug);
        if (parent) {
            terms.add(parent.name);
            for (const alias of parent.aliases || []) terms.add(alias);
        }
    }
    return [...terms];
}

/** The metro a place sits in — itself, if it is one. */
function metroFor(place) {
    if (!place) return null;
    return place.type === 'metro' ? place : BY_SLUG.get(place.parentSlug) || null;
}

module.exports = {
    METROS,
    PLACES,
    STATES,
    slugify,
    resolvePlace,
    expandPlaceTerms,
    metroFor,
    getPlaceBySlug: (slug) => BY_SLUG.get(String(slug).toLowerCase()) || null,
};
