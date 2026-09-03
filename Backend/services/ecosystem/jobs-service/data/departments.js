'use strict';
/**
 * Every function a company actually runs.
 *
 * The old list had eleven entries and folded whole disciplines together — Sales sat
 * with Marketing, Design was one row with a single supported country, and there was
 * nowhere at all to file Security, Data, QA, Procurement, Facilities or the executive
 * office. A job board can only be as well organised as its taxonomy: a role filed under
 * a department that doesn't describe it is invisible to anyone browsing by function.
 *
 * `businessUnit` groups departments for navigation and reporting. `supportedCountryIds`
 * records where a function already has people — it is a hint for the posting form, not
 * a restriction: referenceController falls back to the full list for any country not
 * named, so a recruiter opening a function somewhere new is never blocked.
 *
 * Old ids are kept exactly as they were (dept_eng_it, dept_sales, …) so existing
 * postings keep their department.
 */

// Where the company already has an established presence — used as the default hint on
// functions that exist everywhere.
const CORE = ['country_in', 'country_us', 'country_gb', 'country_ca', 'country_pl', 'country_au', 'country_vn', 'country_ph', 'country_ua'];
const INDIA_FIRST = ['country_in', 'country_us', 'country_gb'];

module.exports = [
  // ── Technology ─────────────────────────────────────────────────────────────
  { id: 'dept_eng_it',      name: 'Engineering / IT / Software',      businessUnit: 'Technology', supportedCountryIds: CORE, isActive: true, displayOrder: 1 },
  { id: 'dept_prod',        name: 'Product Management',               businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_us', 'country_gb'], isActive: true, displayOrder: 2 },
  { id: 'dept_design',      name: 'Design & User Research',           businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_us', 'country_gb', 'country_ua'], isActive: true, displayOrder: 3 },
  { id: 'dept_data',        name: 'Data & Analytics',                 businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_us', 'country_pl'], isActive: true, displayOrder: 4 },
  { id: 'dept_qa',          name: 'Quality Engineering',              businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_vn', 'country_ph'], isActive: true, displayOrder: 5 },
  { id: 'dept_devops',      name: 'Infrastructure & DevOps',          businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_us', 'country_pl'], isActive: true, displayOrder: 6 },
  { id: 'dept_security',    name: 'Security & Risk',                  businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_us', 'country_gb'], isActive: true, displayOrder: 7 },
  { id: 'dept_it_support',  name: 'IT & Workplace Technology',        businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_ph'], isActive: true, displayOrder: 8 },
  { id: 'dept_rd',          name: 'R&D / Innovation Labs',            businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_pl', 'country_ua'], isActive: true, displayOrder: 9 },

  { id: 'dept_ai',          name: 'AI & Machine Learning',             businessUnit: 'Technology', supportedCountryIds: ['country_in', 'country_us', 'country_pl'], isActive: true, displayOrder: 10 },

  // ── Brand & Media ──────────────────────────────────────────────────────────
  // Production is its own function, not a corner of marketing: a videographer, an
  // editor and a live operator have different craft, kit and career ladders, and
  // filing them under "Marketing" makes every one of them unfindable.
  { id: 'dept_media',       name: 'Media & Creative Production',       businessUnit: 'Brand & Media', supportedCountryIds: ['country_in', 'country_us'], isActive: true, displayOrder: 15 },
  { id: 'dept_social',      name: 'Social Media & Community',          businessUnit: 'Brand & Media', supportedCountryIds: ['country_in', 'country_us', 'country_gb'], isActive: true, displayOrder: 16 },

  // ── Growth ─────────────────────────────────────────────────────────────────
  { id: 'dept_sales',       name: 'Sales',                            businessUnit: 'Growth', supportedCountryIds: ['country_in', 'country_us', 'country_gb', 'country_ca', 'country_au'], isActive: true, displayOrder: 20 },
  { id: 'dept_sales_eng',   name: 'Solutions & Sales Engineering',    businessUnit: 'Growth', supportedCountryIds: ['country_in', 'country_us', 'country_gb'], isActive: true, displayOrder: 21 },
  { id: 'dept_mktg',        name: 'Marketing & Communications',       businessUnit: 'Growth', supportedCountryIds: ['country_in', 'country_us', 'country_gb'], isActive: true, displayOrder: 22 },
  { id: 'dept_partnerships', name: 'Partnerships & Alliances',        businessUnit: 'Growth', supportedCountryIds: ['country_in', 'country_us', 'country_gb'], isActive: true, displayOrder: 23 },

  // ── Trust ──────────────────────────────────────────────────────────────────
  // A jobs platform is a target: fake recruiters, advance-fee scams, forged
  // certificates, stolen identities. Somebody has to own that, and it is neither
  // security engineering nor customer support.
  { id: 'dept_trust',       name: 'Trust & Safety',                    businessUnit: 'Customer', supportedCountryIds: ['country_in', 'country_ph'], isActive: true, displayOrder: 32 },
  { id: 'dept_loc',         name: 'Localisation & Language',           businessUnit: 'Customer', supportedCountryIds: ['country_in', 'country_vn', 'country_ph'], isActive: true, displayOrder: 33 },

  // ── Customer ───────────────────────────────────────────────────────────────
  { id: 'dept_support',     name: 'Customer Success & Support',       businessUnit: 'Customer', supportedCountryIds: CORE, isActive: true, displayOrder: 30 },
  { id: 'dept_impl',        name: 'Implementation & Onboarding',      businessUnit: 'Customer', supportedCountryIds: ['country_in', 'country_us', 'country_ph'], isActive: true, displayOrder: 31 },

  // ── Operations ─────────────────────────────────────────────────────────────
  { id: 'dept_ops',         name: 'Business Operations',              businessUnit: 'Operations', supportedCountryIds: CORE, isActive: true, displayOrder: 40 },
  { id: 'dept_supply',      name: 'Supply Chain & Logistics',         businessUnit: 'Operations', supportedCountryIds: ['country_in', 'country_ca', 'country_au'], isActive: true, displayOrder: 41 },
  { id: 'dept_procurement', name: 'Procurement & Vendor Management',  businessUnit: 'Operations', supportedCountryIds: INDIA_FIRST, isActive: true, displayOrder: 42 },
  { id: 'dept_facilities',  name: 'Facilities & Workplace',           businessUnit: 'Operations', supportedCountryIds: ['country_in'], isActive: true, displayOrder: 43 },
  // The people who keep the building and the day running. They are staff like anyone
  // else and belong on the careers site with a real posting, not in a footnote.
  { id: 'dept_admin',       name: 'Administration & Support Services', businessUnit: 'Operations', supportedCountryIds: ['country_in'], isActive: true, displayOrder: 44 },

  // ── Mining ─────────────────────────────────────────────────────────────────
  // A working mine is its own organisation with its own statutory structure. Under the
  // Mines Act several of these posts are legally designated — a Mine Manager, Surveyor,
  // Overman or Mining Mate must hold a specific certificate of competency — so they
  // cannot be filed under generic "Operations" without losing what the role actually is.
  { id: 'dept_mine_ops',    name: 'Mine Operations',                   businessUnit: 'Mining', supportedCountryIds: ['country_in'], isActive: true, displayOrder: 70 },
  { id: 'dept_mine_geo',    name: 'Geology & Mine Survey',             businessUnit: 'Mining', supportedCountryIds: ['country_in'], isActive: true, displayOrder: 71 },
  { id: 'dept_mine_maint',  name: 'Mine Maintenance & HEMM',           businessUnit: 'Mining', supportedCountryIds: ['country_in'], isActive: true, displayOrder: 72 },
  { id: 'dept_mine_proc',   name: 'Mineral Processing & Quality',      businessUnit: 'Mining', supportedCountryIds: ['country_in'], isActive: true, displayOrder: 73 },
  { id: 'dept_mine_hse',    name: 'Mine Safety, Health & Environment', businessUnit: 'Mining', supportedCountryIds: ['country_in'], isActive: true, displayOrder: 74 },
  { id: 'dept_mine_admin',  name: 'Mine Administration & Community',   businessUnit: 'Mining', supportedCountryIds: ['country_in'], isActive: true, displayOrder: 75 },

  // ── Trade ──────────────────────────────────────────────────────────────────
  // Global trade infrastructure: the goods move, the documents move, the money moves,
  // and each of those is a different discipline with its own regulators. A freight
  // forwarder, a letters-of-credit specialist and a payment-gateway engineer share a
  // shipment and nothing else — filing them together would make all three unfindable.
  { id: 'dept_trade_ops',   name: 'Trade Operations & Documentation',   businessUnit: 'Trade', supportedCountryIds: ['country_in', 'country_ae', 'country_sg'], isActive: true, displayOrder: 80 },
  { id: 'dept_shipping',    name: 'Shipping, Freight & Customs',        businessUnit: 'Trade', supportedCountryIds: ['country_in', 'country_ae', 'country_sg', 'country_nl'], isActive: true, displayOrder: 81 },
  { id: 'dept_trade_fin',   name: 'Trade Finance & Insurance',          businessUnit: 'Trade', supportedCountryIds: ['country_in', 'country_ae', 'country_gb', 'country_sg'], isActive: true, displayOrder: 82 },
  { id: 'dept_payments',    name: 'Payments & Gateway Engineering',     businessUnit: 'Trade', supportedCountryIds: ['country_in', 'country_sg', 'country_gb'], isActive: true, displayOrder: 83 },
  { id: 'dept_marketplace', name: 'Marketplace & Buyer-Seller Platform', businessUnit: 'Trade', supportedCountryIds: ['country_in', 'country_ae', 'country_sg'], isActive: true, displayOrder: 84 },

  // ── Corporate ──────────────────────────────────────────────────────────────
  { id: 'dept_finance',     name: 'Finance & Accounting',             businessUnit: 'Corporate', supportedCountryIds: ['country_in', 'country_us', 'country_gb', 'country_pl', 'country_ph'], isActive: true, displayOrder: 50 },
  { id: 'dept_legal',       name: 'Legal & Compliance',               businessUnit: 'Corporate', supportedCountryIds: INDIA_FIRST, isActive: true, displayOrder: 51 },
  { id: 'dept_strategy',    name: 'Strategy & Corporate Development', businessUnit: 'Corporate', supportedCountryIds: ['country_in', 'country_us'], isActive: true, displayOrder: 52 },
  { id: 'dept_exec',        name: 'Executive & Chief of Staff',       businessUnit: 'Corporate', supportedCountryIds: ['country_in', 'country_us'], isActive: true, displayOrder: 53 },

  // ── People ─────────────────────────────────────────────────────────────────
  { id: 'dept_hr',          name: 'People & HR',                      businessUnit: 'People', supportedCountryIds: CORE, isActive: true, displayOrder: 60 },
  { id: 'dept_ta',          name: 'Talent Acquisition',               businessUnit: 'People', supportedCountryIds: ['country_in', 'country_us', 'country_gb', 'country_ph'], isActive: true, displayOrder: 61 },
  { id: 'dept_l_and_d',     name: 'Learning & Development',           businessUnit: 'People', supportedCountryIds: ['country_in', 'country_us'], isActive: true, displayOrder: 62 },
];
