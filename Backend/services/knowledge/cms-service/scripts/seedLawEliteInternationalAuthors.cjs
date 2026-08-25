'use strict';
/**
 * Bulk-creates the 80 international legal-professional author profiles from
 * "Law Elite Network — 80 Global Legal Professional Author Profiles"
 * (extended editorial edition, 8 countries) into the central CMS so every
 * profile is editable/publishable from admin.baalvion.com → Website →
 * law-elite-network → Authors.
 *
 * Fields the source doc marks as given (Country, Organisation, Primary
 * category, Expertise, and any real LinkedIn URL) are used as-is. Fields the
 * doc explicitly marks "REQUIRES AUTHORITATIVE VERIFICATION" / "NOT PUBLICLY
 * FOUND — DO NOT INFER" for every single entry — credentials/bar admissions,
 * education, certifications, photo, and X/Facebook/Instagram — are left
 * blank rather than guessed, per this codebase's standing rule of never
 * fabricating bios/credentials.
 *
 * bio / seoMetadata.title / seoMetadata.description / seoMetadata.keywords
 * are generated from name/org/country/category/expertise using the exact
 * formula the source doc itself used for every one of the 80 entries (with
 * a couple of stray "M&A;" punctuation artifacts in the source normalized).
 *
 * Every author is created with status 'active': shown on the public site.
 * The underlying credentials/education/certifications/photo fields remain
 * blank (never fabricated) since the source doc marks those
 * "NOT PUBLICLY FOUND — DO NOT INFER" for every entry — only the
 * publicly-documented name/organisation/country/expertise are published.
 *
 * Idempotent: pre-fetches existing slugs and skips creation for any that
 * already exist (also treats a 409 from POST as a skip); the status-sync
 * pass re-applies 'active' to every author in this list on every run.
 *
 * USAGE
 *   # Preview the exact payloads with no network calls:
 *   node scripts/seedLawEliteInternationalAuthors.cjs --dry-run
 *
 *   # Local dev CMS (login flow):
 *   AUTH_URL=http://localhost:3001/v1/auth CMS_URL=http://localhost:3011/api/v1 \
 *   SUPERADMIN_EMAIL=superadmin@baalvion.com SUPERADMIN_PASSWORD=*** \
 *   node scripts/seedLawEliteInternationalAuthors.cjs
 *
 *   # Production (bearer token, e.g. copied from a DevTools /cms/ request
 *   # while logged into admin.baalvion.com as super_admin):
 *   TARGET_CMS_BASE=https://admin.baalvion.com/api-bff/knowledge/cms/api/v1 \
 *   CMS_TOKEN=<bearer> node scripts/seedLawEliteInternationalAuthors.cjs
 */

const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3011/api/v1';
const TARGET_CMS_BASE = process.env.TARGET_CMS_BASE || null;
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
const CMS_TOKEN = process.env.CMS_TOKEN || null;
const SITE = process.env.WEBSITE_SLUG || 'law-elite-network';

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');

const CMS_BASE = TARGET_CMS_BASE || CMS;
const BASE = `${CMS_BASE.replace(/\/+$/, '')}/cms/websites/${encodeURIComponent(SITE)}`;

// [slug, name, country, organisation, primaryCategory, expertise[], linkedinUrlOrNull]
const RAW = [
  ['ari-b-blaut', 'Ari B Blaut', 'United States', 'Sullivan & Cromwell LLP', 'Banking & Finance', ['Banking & Finance', 'private credit', 'restructuring', 'capital markets', 'private equity'], null],
  ['mark-c-kanaly', 'Mark C Kanaly', 'United States', 'Alston & Bird LLP', 'Financial Services Regulation', ['Banking & Finance', 'financial-services regulation', 'financial-institution M&A'], null],
  ['edwin-e-smith', 'Edwin E Smith', 'United States', 'Morgan, Lewis & Bockius LLP', 'Banking & Finance', ['Banking & Finance', 'debt/structured finance', 'workouts', 'bankruptcy/restructuring'], null],
  ['eric-dittmann', 'Eric Dittmann', 'United States', 'Paul Hastings LLP', 'Intellectual Property', ['Intellectual property', 'patent litigation', 'biotech/pharma/medical-device disputes'], 'https://www.linkedin.com/in/eric-dittmann-27a72b13'],
  ['dennis-dunne', 'Dennis Dunne', 'United States', 'Milbank LLP', 'Insolvency & Restructuring', ['Bankruptcy & restructuring', 'complex distressed situations'], null],
  ['richard-m-pachulski', 'Richard M Pachulski', 'United States', 'Pachulski Stang Ziehl & Jones LLP', 'Insolvency & Restructuring', ['Bankruptcy & restructuring', 'corporate reorganisations'], null],
  ['jeffrey-ross', 'Jeffrey Ross', 'United States', 'Sidley Austin LLP', 'Banking & Finance', ['Banking & Finance', 'leveraged finance', 'acquisition finance', 'high-yield debt'], null],
  ['robin-l-cohen', 'Robin L Cohen', 'United States', 'Cohen Ziffer Frenchman & McKenna LLP', 'Insurance', ['Insurance disputes', 'policyholder litigation', 'high-stakes commercial disputes'], null],
  ['keith-moskowitz', 'Keith Moskowitz', 'United States', 'Dentons', 'Insurance', ['Insurance disputes', 'insurance litigation and arbitration'], null],
  ['jeffrey-nagle', 'Jeffrey Nagle', 'United States', 'Cadwalader, Wickersham & Taft LLP', 'Banking & Finance', ['Banking & Finance', 'securitisation', 'asset-based lending', 'project/acquisition finance'], null],

  ['edward-barnett', 'Edward Barnett', 'United Kingdom', 'Latham & Watkins', 'Mergers & Acquisitions', ['Corporate/M&A', 'corporate finance', 'cross-border transactions', 'technology/media/pharma'], null],
  ['claire-wills', 'Claire Wills', 'United Kingdom', 'Freshfields', 'Mergers & Acquisitions', ['Corporate/M&A', 'public/private M&A', 'board/shareholder defence', 'governance'], null],
  ['keith-syson', 'Keith Syson', 'United Kingdom', 'Stevens & Bolton LLP', 'Mergers & Acquisitions', ['M&A', 'private equity', 'finance', 'joint ventures', 'demergers'], null],
  ['david-kendall', 'David Kendall', 'United Kingdom', 'Penningtons Manches Cooper LLP', 'Mergers & Acquisitions', ['Corporate transactions', 'M&A', 'private equity', 'reorganisations', 'insolvency transactions'], 'https://uk.linkedin.com/in/davidckendall'],
  ['robert-buckley', 'Robert Buckley', 'United Kingdom', 'Kuits Solicitors', 'Mergers & Acquisitions', ['M&A', 'investment', 'joint ventures', 'sport and media'], null],
  ['simon-clark', 'Simon Clark', 'United Kingdom', 'Bristows LLP', 'Intellectual Property', ['IP', 'copyright', 'designs', 'trade marks', 'online/IP disputes'], 'https://uk.linkedin.com/in/simonnclark'],
  ['mark-shillito', 'Mark Shillito', 'United Kingdom', 'CMS', 'Technology & IT', ['Intellectual property', 'technology', 'media', 'life sciences', 'complex disputes'], null],
  ['anthea-christie', 'Anthea Christie', 'United Kingdom', 'Penningtons Manches Cooper LLP', 'Employment & Labour', ['Employment', 'discrimination', 'whistleblowing', 'employment disputes'], 'https://uk.linkedin.com/in/anthea-christie-80b69629'],
  ['giles-pratt', 'Giles Pratt', 'United Kingdom', 'Freshfields', 'Data Protection & Privacy', ['IP', 'data protection/privacy', 'cybersecurity', 'technology regulation', 'e-commerce'], 'https://uk.linkedin.com/in/gilespratt'],
  ['kathleen-healy', 'Kathleen Healy', 'United Kingdom', 'Freshfields', 'Employment & Labour', ['Employment', 'people & reward', 'employer litigation', 'employment governance'], 'https://uk.linkedin.com/in/kathleen-healy-7532226'],

  ['guy-alexander', 'Guy Alexander', 'Australia', 'Allens', 'Mergers & Acquisitions', ['Corporate/M&A', 'public takeovers', 'major transactions'], null],
  ['tom-story', 'Tom Story', 'Australia', 'Allens', 'Mergers & Acquisitions', ['Corporate/M&A', 'private equity', 'infrastructure transactions'], 'https://au.linkedin.com/in/tom-story-54a10733'],
  ['costas-condoleon', 'Costas Condoleon', 'Australia', 'Gilbert + Tobin', 'Mergers & Acquisitions', ['M&A', 'securities', 'corporate governance'], null],
  ['karen-evans-cullen', 'Karen Evans-Cullen', 'Australia', 'Gilbert + Tobin', 'Mergers & Acquisitions', ['M&A', 'corporate governance', 'takeovers', 'schemes', 'capital raisings'], null],
  ['vijay-cugati', 'Vijay Cugati', 'Australia', 'Allens', 'Mergers & Acquisitions', ['M&A', 'takeovers', 'distressed M&A', 'restructurings', 'capital management'], 'https://au.linkedin.com/in/vijay-cugati-53a873b1'],
  ['christopher-blane', 'Christopher Blane', 'Australia', 'Allens', 'Corporate & Commercial', ['M&A', 'corporate advisory', 'governance', 'infrastructure/property/financial services'], null],
  ['ross-mcinnes', 'Ross McInnes', 'Australia', 'Clayton Utz', 'Commercial Litigation', ['Disputes', 'class actions', 'consumer remediation', 'financial-services regulation'], null],
  ['colin-loveday', 'Colin Loveday', 'Australia', 'Clayton Utz', 'Personal Injury & Clinical Negligence', ['Disputes', 'product liability', 'class actions', 'life sciences'], null],
  ['damian-grave', 'Damian Grave', 'Australia', 'Herbert Smith Freehills Kramer', 'Commercial Litigation', ['Commercial litigation', 'class actions', 'financial-services disputes', 'regulatory disputes'], null],
  ['andrew-maynes', 'Andrew Maynes', 'Australia', 'King & Wood Mallesons', 'Banking & Finance', ['Banking & Finance', 'corporate finance', 'acquisition finance', 'syndicated lending'], null],

  ['steve-j-tenai', 'Steve J Tenai', 'Canada', 'Aird & Berlis LLP', 'Commercial Litigation', ['Commercial litigation', 'class actions', 'regulatory proceedings'], null],
  ['iris-antonios', 'Iris Antonios', 'Canada', 'Blake, Cassels & Graydon LLP', 'Arbitration', ['Commercial disputes', 'international commercial and investor-state arbitration'], null],
  ['alan-d-silva', "Alan D'Silva", 'Canada', 'Stikeman Elliott LLP', 'Professional Negligence', ['Commercial litigation', 'class actions', 'securities', 'insurance', 'professional negligence'], 'https://ca.linkedin.com/in/alan-dsilva'],
  ['angus-m-gunn-kc', 'Angus M. Gunn KC', 'Canada', 'Eyford Partners LLP', 'Arbitration', ['Commercial arbitration', 'ad hoc and ICDR proceedings'], null],
  ['stephen-drymer', 'Stephen Drymer', 'Canada', 'Woods LLP', 'Arbitration', ['International arbitration', 'dispute resolution'], 'https://ca.linkedin.com/in/stephen-l-drymer-41929620'],
  ['rachel-howie', 'Rachel Howie', 'Canada', 'Dentons Canada LLP', 'Arbitration', ['International/domestic arbitration', 'litigation', 'energy/mining/natural resources'], 'https://ca.linkedin.com/in/rachelhowie'],
  ['craig-chiasson', 'Craig Chiasson', 'Canada', 'Borden Ladner Gervais LLP', 'Arbitration', ['International arbitration', 'commercial arbitration', 'energy/construction/contract disputes'], 'https://ca.linkedin.com/in/craigchiasson'],
  ['robert-wisner', 'Robert Wisner', 'Canada', 'McMillan LLP', 'Arbitration', ['International arbitration', 'corporate litigation', 'cross-border disputes'], null],
  ['ari-n-kaplan', 'Ari N. Kaplan', 'Canada', 'Kaplan Law', 'Mediation', ['Mediation', 'pensions and benefits disputes'], null],
  ['scott-kugler', 'Scott Kugler', 'Canada', 'Gowling WLG', 'Commercial Litigation', ['Class-action defence', 'commercial litigation', 'securities', 'competition', 'shareholder disputes'], null],

  ['ajay-bahl', 'Ajay Bahl', 'India', 'AZB & Partners', 'Tax', ['Tax', 'Corporate/M&A', 'private equity'], null],
  ['amar-gupta', 'Amar Gupta', 'India', 'JSA', 'Commercial Litigation', ['Commercial litigation', 'arbitration', 'regulatory/finance disputes', 'insolvency'], null],
  ['rajendra-barot', 'Rajendra Barot', 'India', 'AZB & Partners', 'Arbitration', ['Domestic/international arbitration', 'litigation'], 'https://in.linkedin.com/in/rajendra-barot-70b2a912'],
  ['rajat-taimni', 'Rajat Taimni', 'India', 'Tuli & Co', 'Dispute Resolution', ['Litigation', 'arbitration', 'commercial disputes', 'real estate', 'media', 'aviation', 'insurance/reinsurance'], 'https://www.linkedin.com/in/rajat-taimni-6239741'],
  ['ruby-singh-ahuja', 'Ruby Singh Ahuja', 'India', 'Karanjawala & Co', 'Constitutional & Human Rights', ['Litigation', 'shareholder/insolvency disputes', 'constitutional matters'], 'https://in.linkedin.com/in/ruby-singh-ahuja-4a2a7486'],
  ['ritu-bhalla', 'Ritu Bhalla', 'India', 'Luthra and Luthra Law Offices India', 'Dispute Resolution', ['Corporate/commercial disputes', 'arbitration', 'banking & finance', 'insolvency', 'regulatory', 'infrastructure', 'white-collar'], null],
  ['saikrishna-rajagopal', 'Saikrishna Rajagopal', 'India', 'Saikrishna & Associates', 'Intellectual Property', ['IP litigation', 'copyright/trade marks', 'TMT', 'media & entertainment'], null],
  ['aseem-chawla', 'Aseem Chawla', 'India', 'Chambers of Dr. Aseem Chawla', 'Tax', ['Tax', 'tax disputes', 'tax policy/administration'], null],
  ['rohit-jain', 'Rohit Jain', 'India', 'Economic Laws Practice', 'Tax', ['Tax', 'customs', 'export controls', 'government/regulatory', 'tax litigation'], null],
  ['shailendra-bhandare', 'Shailendra Bhandare', 'India', 'Khaitan & Co', 'Intellectual Property', ['Intellectual property', 'prosecution', 'enforcement', 'contentious and transactional IP'], null],

  ['sandy-foo', 'Sandy Foo', 'Singapore', 'Rajah & Tann Singapore LLP', 'Mergers & Acquisitions', ['Corporate/M&A', 'corporate finance', 'private equity', 'finance'], null],
  ['perry-yuen', 'Perry Yuen', 'Singapore', 'Shook Lin & Bok LLP', 'Mergers & Acquisitions', ['M&A', 'corporate finance', 'equity capital markets', 'restructurings'], null],
  ['terence-foo', 'Terence Foo', 'Singapore', 'Clifford Chance', 'Mergers & Acquisitions', ['Cross-border M&A', 'joint ventures', 'China/SEA investments'], 'https://sg.linkedin.com/in/terencefoocliffordchance'],
  ['andrew-m-lim', 'Andrew M Lim', 'Singapore', 'Allen & Gledhill LLP', 'Mergers & Acquisitions', ['M&A', 'private equity', 'corporate regulatory & compliance'], null],
  ['eng-leng-ng', 'Eng Leng Ng', 'Singapore', 'Dentons Rodyk & Davidson LLP', 'Mergers & Acquisitions', ['M&A', 'corporate finance', 'restructurings', 'securities', 'private equity'], 'https://sg.linkedin.com/in/ngengleng'],
  ['daryl-chew', 'Daryl Chew', 'Singapore', 'Three Crowns LLP', 'Arbitration', ['International arbitration', 'energy', 'construction', 'M&A/JV disputes'], null],
  ['lawrence-boo', 'Lawrence Boo', 'Singapore', 'The Arbitration Chambers', 'Arbitration', ['International arbitration', 'mediation', 'cross-border disputes'], null],
  ['daryll-ng', 'Daryll Ng', 'Singapore', 'Virtus Law LLP', 'Dispute Resolution', ['Marine/commercial dispute resolution', 'litigation', 'arbitration', 'mediation'], null],
  ['daniel-gaw', 'Daniel Gaw', 'Singapore', 'WongPartnership LLP', 'Arbitration', ['International arbitration', 'commercial litigation', 'shipping/trade/commodities', 'construction'], null],
  ['oommen-mathew', 'Oommen Mathew', 'Singapore', 'Omni Law LLC', 'Dispute Resolution', ['Arbitration and litigation', 'commercial disputes'], null],

  ['pervez-akhtar', 'Pervez Akhtar', 'United Arab Emirates', 'Freshfields', 'Mergers & Acquisitions', ['Cross-border M&A', 'private equity', 'joint ventures', 'financial services', 'energy', 'healthcare', 'media'], 'https://ae.linkedin.com/in/pervezakhtar'],
  ['lynn-ammar', 'Lynn Ammar', 'United Arab Emirates', 'Clifford Chance', 'Mergers & Acquisitions', ['M&A', 'private equity', 'technology', 'healthcare', 'consumer', 'energy/renewables'], null],
  ['naji-hawayek', 'Naji Hawayek', 'United Arab Emirates', 'Addleshaw Goddard', 'Mergers & Acquisitions', ['Cross-border M&A', 'JVs', 'private equity', 'investment funds', 'restructuring', 'FDI'], null],
  ['zeid-hanania', 'Zeid Hanania', 'United Arab Emirates', 'Eversheds Sutherland', 'Mergers & Acquisitions', ['Cross-border M&A', 'private equity', 'JVs', 'inbound investment'], null],
  ['abeer-jarrar', 'Abeer Jarrar', 'United Arab Emirates', 'Baker McKenzie', 'Corporate & Commercial', ['M&A', 'corporate matters', 'digital', 'energy', 'healthcare'], 'https://ae.linkedin.com/in/abeer-jarrar-85a4b07'],
  ['sherif-hikal', 'Sherif Hikal', 'United Arab Emirates', 'OGH Legal', 'Commercial Litigation', ['Domestic UAE litigation', 'commercial disputes', 'court advocacy'], 'https://ae.linkedin.com/in/sherif-hikal-426bb042'],
  ['keith-hutchison', 'Keith Hutchison', 'United Arab Emirates', 'Clyde & Co', 'Commercial Litigation', ['Commercial litigation', 'DIFC Courts', 'trade credit insurance', 'arbitration'], 'https://ae.linkedin.com/in/keith-hutchison-0546b018'],
  ['nicholas-sharratt', 'Nicholas Sharratt', 'United Arab Emirates', 'Norton Rose Fulbright', 'Arbitration', ['International arbitration', 'litigation', 'investigations'], null],
  ['zarghona-fazal', 'Zarghona Fazal', 'United Arab Emirates', 'Hadef & Partners', 'Dispute Resolution', ['Dispute resolution', 'arbitration', 'DIFC/ADGM litigation'], null],
  ['hasan-el-shafiey', 'Hasan El Shafiey', 'United Arab Emirates', 'Galadari Advocates & Legal Consultants', 'Construction', ['Construction disputes', 'arbitration', 'mediation', 'energy', 'real estate', 'IP/commercial disputes'], null],

  ['norbert-rieger', 'Norbert Rieger', 'Germany', 'Milbank LLP', 'Mergers & Acquisitions', ['Corporate/M&A', 'private equity', 'public takeovers', 'corporate transactions'], 'https://de.linkedin.com/in/dr-norbert-rieger-99a048239'],
  ['rainer-traugott', 'Rainer Traugott', 'Germany', 'Latham & Watkins', 'Mergers & Acquisitions', ['Corporate/M&A', 'private equity', 'complex cross-border transactions'], null],
  ['stephan-waldhausen', 'Stephan Waldhausen', 'Germany', 'Freshfields', 'Mergers & Acquisitions', ['Public/private M&A', 'splits/spin-offs', 'JVs', 'carve-outs'], 'https://de.linkedin.com/in/stephan-h-waldhausen-521093175'],
  ['christoph-seibt', 'Christoph Seibt', 'Germany', 'Freshfields', 'Mergers & Acquisitions', ['M&A', 'capital markets', 'corporate/financial restructurings', 'governance'], null],
  ['sonja-ruttmann', 'Sonja Ruttmann', 'Germany', 'Gibson, Dunn & Crutcher', 'Mergers & Acquisitions', ['M&A', 'restructuring/reorganisation', 'private equity', 'capital markets'], 'https://de.linkedin.com/in/sonjaruttmann'],
  ['annika-clauss', 'Annika Clauss', 'Germany', 'Hengeler Mueller', 'Mergers & Acquisitions', ['M&A', 'corporate law', 'private equity', 'family businesses', 'carve-outs/JVs'], 'https://de.linkedin.com/in/annikaclauss'],
  ['stephanie-hundertmark', 'Stephanie Hundertmark', 'Germany', 'Freshfields', 'Mergers & Acquisitions', ['M&A', 'private equity', 'life sciences', 'carve-outs', 'JVs'], null],
  ['dirk-besse', 'Dirk Besse', 'Germany', 'Morrison Foerster', 'Corporate & Commercial', ['M&A', 'private equity', 'venture capital', 'public-company compliance', 'financial services'], 'https://de.linkedin.com/in/dirk-besse-72a100159'],
  ['constantin-lauterwein', 'Constantin Lauterwein', 'Germany', 'Hengeler Mueller', 'Fraud & White-Collar Crime', ['White-collar crime', 'corporate compliance', 'administrative offences'], 'https://de.linkedin.com/in/constantin-lauterwein'],
  ['markus-adick', 'Markus Adick', 'Germany', 'ADICK LINKE Rechtsanwälte', 'Criminal Defence', ['Criminal/tax proceedings', 'white-collar defence', 'sensitive investigations'], 'https://de.linkedin.com/in/markusadick/en'],
];

function toPayload([slug, name, country, org, category, expertise], index) {
  const expertiseJoined = expertise.join('; ');
  const payload = {
    name,
    slug,
    title: `Legal Professional — ${category}`,
    credentials: `${org} · ${country}`,
    bio: `${name} is a publicly documented legal professional associated with ${org} in ${country}, with a professional profile centred on ${expertiseJoined}.`,
    expertise,
    editorialRole: 'contributor',
    seoMetadata: {
      title: `${name} | ${category} | Law Elite Network`,
      description: `Professional profile of ${name}, associated with ${org}, with publicly documented expertise in ${expertiseJoined}.`,
      keywords: [name, org, country, category, 'lawyer', 'legal professional', 'Law Elite Network'],
    },
    sortOrder: index + 1,
    // education / certifications / avatarUrl intentionally omitted — the source
    // doc marks these "NOT PUBLICLY FOUND — DO NOT INFER" for every entry.
  };
  const linkedin = RAW_LINKEDIN.get(slug);
  if (linkedin) payload.social = { linkedin };
  return payload;
}

const RAW_LINKEDIN = new Map(RAW.map((r) => [r[0], r[6]]));
const AUTHORS = RAW.map(toPayload);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, url, token, body, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json().catch(() => ({}));
      if (r.status >= 500 && i < attempts - 1) { await sleep(400 * (i + 1)); continue; }
      return { status: r.status, data };
    } catch (e) {
      lastErr = e;
      await sleep(400 * (i + 1));
    }
  }
  throw lastErr || new Error('request failed after retries');
}

async function getToken() {
  if (CMS_TOKEN) return CMS_TOKEN;
  if (!PW) throw new Error('Set CMS_TOKEN (prod bearer) or SUPERADMIN_PASSWORD (local login) — see script header for usage.');
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));
  return token;
}

async function main() {
  if (DRY_RUN) {
    console.log(JSON.stringify({ ok: true, dryRun: true, site: SITE, base: BASE, count: AUTHORS.length, payloads: AUTHORS }, null, 2));
    return;
  }

  const token = await getToken();

  const existingRes = await req('GET', `${BASE}/authors`, token);
  const existingList = existingRes.data?.data || [];
  const idBySlug = new Map(existingList.map((a) => [a.slug, a.id]));

  let created = 0, skipped = 0, failed = 0;
  for (const payload of AUTHORS) {
    if (idBySlug.has(payload.slug)) { skipped++; continue; }
    const res = await req('POST', `${BASE}/authors`, token, payload);
    if (res.status === 201 || res.status === 200) {
      created++;
      const newId = res.data?.data?.id;
      if (newId) idBySlug.set(payload.slug, newId);
    } else if (res.status === 409) {
      skipped++;
    } else {
      failed++;
      console.error(`author ${payload.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 300));
    }
    await sleep(150);
  }

  // Force every author in this dataset to active so they show on the public site.
  let setActive = 0, statusFailed = 0;
  for (const payload of AUTHORS) {
    const id = idBySlug.get(payload.slug);
    if (!id) continue;
    const res = await req('PATCH', `${BASE}/authors/${id}`, token, { status: 'active' });
    if (res.status === 200) setActive++;
    else { statusFailed++; console.error(`status sync ${payload.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200)); }
    await sleep(100);
  }

  console.log(JSON.stringify({ ok: true, site: SITE, base: BASE, created, skipped, failed, setActive, statusFailed, total: AUTHORS.length }, null, 2));
}

main().catch((e) => { console.error('law elite international author seed failed:', e.message); process.exit(1); });
