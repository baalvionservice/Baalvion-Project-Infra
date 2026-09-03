/**
 * What it is actually like to work in each place.
 *
 * A job page that says "Bengaluru, India" and stops has told a candidate nothing they
 * did not already know. What they want is the specific: what we do there, how people
 * get to work, what the place is like to live in.
 *
 * This is also the content that makes a location page rank. Somebody searching "jobs in
 * Barbil" is looking for local knowledge, and a page that has it is the one that gets
 * cited — by a search engine and by an answer engine alike.
 *
 * Everything here is geography and operational fact. Nothing is a claim about being the
 * best employer in the region, and nothing needs a citation to defend.
 */
export type LocationContext = {
  /** What Baalvion does in this place. */
  presence: string;
  /** Getting there, living there — the practical facts a candidate weighs. */
  living: string;
  /** Optional: what makes work here specifically different. */
  note?: string;
};

export const LOCATION_CONTEXT: Record<string, LocationContext> = {
  // ── Technology hubs ────────────────────────────────────────────────────────
  bengaluru: {
    presence:
      'Bengaluru is our largest site and where most of engineering, product, design, data and AI sit. The office is in the eastern corridor, and the majority of these roles are remote-friendly with the team meeting in person a few days a week.',
    living:
      'The city has the deepest technology labour market in India, which cuts both ways: the work is here, and so is everyone else commuting to it. Teams are deliberate about core hours because a cross-city commute in the evening peak can take longer than the meeting it was for.',
  },
  mumbai: {
    presence:
      'Mumbai carries finance, trade, legal, media production and the commercial teams. It is where the studio is, where trade finance and shipping sit, and where anything involving a bank or a regulator happens.',
    living:
      'Roles here are largely office-based because the work is — a shoot, a bank meeting, a document set that has to be signed. The local train network is what makes the city work, which is why we treat suburbs from Virar to Kalyan as part of the same labour market rather than as somewhere else.',
  },
  pune: {
    presence:
      'Pune hosts backend engineering, data and part of the trade operations team, alongside a share of supply-chain work.',
    living:
      'A shorter commute and a lower cost of living than Mumbai, with the same access to the western trade corridor. Many people here work with teams in Bengaluru and Mumbai rather than only locally.',
  },
  hyderabad: {
    presence:
      'Hyderabad covers mobile engineering, business intelligence, support and the data annotation team.',
    living:
      'Good infrastructure and a shorter commute than the other large hubs. Support roles here run to a shift pattern that covers the APAC working day.',
  },
  chennai: {
    presence: 'Chennai is where quality engineering sits, along with part of the regional content team.',
    living:
      'A well-established technology corridor along OMR, and a considerably calmer commute than Bengaluru for comparable work.',
  },

  // ── Mining belts ───────────────────────────────────────────────────────────
  keonjhar: {
    presence:
      'Keonjhar district is iron-ore country, and Barbil and Joda are where our operations, plant and maintenance teams are based. Mining, processing, HEMM maintenance, safety and site administration all sit here.',
    living:
      'These are working towns, not city suburbs — the nearest airport is at Bhubaneswar, several hours away. Site transport runs to the working areas, and company accommodation is available for roles that need it. Monsoon runs June to September and dictates a great deal about how the year goes.',
    note:
      'Several posts here are statutory under the Mines Act and require a certificate of competency. We sponsor those tickets for people already on the team, which is the usual route from operator to mate to overman.',
  },
  koraput: {
    presence:
      'The Koraput belt covers bauxite mining on the Panchpatmali plateau and alumina refining at Damanjodi, with supporting teams at Semiliguda, Sunabeda and Jeypore.',
    living:
      'Hill country, and genuinely remote — Visakhapatnam is the nearest major city and it is a long drive. Shift buses run between Semiliguda, Damanjodi, Sunabeda and the site gates, and township housing applies to many roles. The ghat road up to the plateau is a real factor in the working day, especially in monsoon.',
    note:
      'This is a scheduled area with a substantial tribal population. Local recruitment from the surrounding blocks is a priority rather than a policy line, and several roles here need Odia rather than only English.',
  },
  dhanbad: {
    presence: 'Dhanbad and Jharia cover our underground coal operations, including ventilation, winding and mines rescue.',
    living:
      'Long-established coalfield towns with the infrastructure that comes from a century of mining. Underground work carries its own statutory medical and training requirements, all sponsored.',
    note:
      'Underground posts require gas testing certification and, for winding engine drivers, a maintained medical fitness certificate. These are legal requirements, not preferences.',
  },
  korba: {
    presence: 'Korba covers opencast coal operations at Gevra, Dipka and Kusmunda — haulage, dozing and the maintenance behind a large HEMM fleet.',
    living:
      'A working industrial district with company transport to the pits. Shift patterns cover the mine around the clock.',
  },
  dantewada: {
    presence: 'Bailadila, Kirandul and Bacheli are our iron-ore operations in the Bastar region.',
    living:
      'Remote hill terrain with company townships and transport. Roles here are site-based and the working week reflects that.',
  },
  ballari: {
    presence: 'Sandur, Hospet and Donimalai cover our Karnataka iron-ore operations and the plant work alongside them.',
    living:
      'Ballari is the nearest sizeable town, with Hubballi and Bengaluru within reach for a weekend. Site transport runs from the surrounding towns.',
  },
  udaipur: {
    presence: 'Zawar covers zinc operations and the metallurgical work attached to them.',
    living:
      'Udaipur is close enough to be genuinely liveable, which makes this an unusually comfortable posting for site-based mining work.',
  },

  // ── Trade corridors ────────────────────────────────────────────────────────
  'nhava-sheva': {
    presence:
      'Nhava Sheva is where our container operations, customs clearance and freight forwarding sit — the port most of India\'s containerised trade moves through.',
    living:
      'Port-side work with the hours that come with it: cut-offs, gate-in deadlines and examinations that do not respect a calendar. Navi Mumbai is the practical place to live, and the commute to the port area is straightforward.',
  },
  kandla: {
    presence: 'Mundra and Gandhidham cover our western-corridor operations — EXIM documentation, port operations and container control.',
    living:
      'Gandhidham is the town most people live in, with Bhuj nearby. It is a genuine trade town rather than a city, and the working culture reflects that.',
  },
  dubai: {
    presence:
      'Dubai runs the MENA trade corridor: trade finance, freight forwarding through Jebel Ali, and regional trade operations.',
    living:
      'Jebel Ali is the free zone most of the physical work happens in; the commercial team sits closer to the city. Roles are office-based and require UAE work eligibility.',
  },
  'singapore-city': {
    presence: 'Singapore covers APAC payments engineering and trade credit underwriting for the region.',
    living: 'Central to the Asian trade and payments markets, with the regulatory access that comes with it.',
  },
  rotterdam: {
    presence: 'Rotterdam is our European gateway — inbound logistics, EU customs compliance and onward distribution.',
    living: 'Port-side work at the largest port in Europe, with straightforward access to the rest of the union.',
  },

  // ── International hubs ─────────────────────────────────────────────────────
  toronto: {
    presence: 'Toronto covers North American engineering, customer success and regional operations.',
    living:
      'Work here runs asynchronously with the Bengaluru team, which is eleven and a half hours ahead. Written communication carries more weight than it would in a co-located team, and meetings cluster at the edges of the day.',
  },
  warsaw: {
    presence: 'Warsaw covers European infrastructure engineering and the finance function for the EU entities.',
    living: 'A short overlap with the Indian working day and a full one with the rest of Europe.',
  },
  krakow: {
    presence: 'Kraków hosts backend and data engineering for the European platform.',
    living: 'An established engineering city with a lower cost of living than Warsaw and the same access to the European team.',
  },
  sydney: {
    presence: 'Sydney covers APAC sales and regional operations.',
    living: 'Office-based commercial roles, with the region\'s time zone working well against both India and the US west coast.',
  },
  melbourne: { presence: 'Melbourne covers customer success for the APAC region.', living: 'Largely remote, with the Sydney team a short flight away.' },
  'ho-chi-minh-city': {
    presence: 'Ho Chi Minh City hosts product engineering and quality engineering.',
    living: 'A substantial and growing engineering market, with a working day that overlaps well with both India and the rest of APAC.',
  },
  'da-nang': { presence: 'Da Nang covers APAC technical support.', living: 'A calmer base than Ho Chi Minh City with the same connectivity.' },
  manila: {
    presence: 'Manila is our largest support site, covering candidate and recruiter support across the region, alongside finance operations.',
    living:
      'Support roles run to a shift pattern covering the APAC working day. Makati and BGC are the practical places to be based.',
  },
  cebu: { presence: 'Cebu covers implementation and onboarding for APAC customers.', living: 'IT Park is the centre of the technology industry here, and the commute is far easier than Manila.' },
  kyiv: { presence: 'Kyiv covers product design and applied research.', living: 'Roles are remote-first, and the team works closely with engineering in Kraków and Bengaluru.' },
  lviv: { presence: 'Lviv hosts frontend engineering for the candidate-facing product.', living: 'Remote-first, with a strong local engineering community and a good overlap with the European working day.' },

  // ── Odisha: Koraput belt ───────────────────────────────────────────────────
  damanjodi: {
    presence:
      'Damanjodi is the alumina refinery — the largest single site we operate. Process operations, the laboratory, mechanical and electrical maintenance, instrumentation, safety, environment and the site support functions are all based here, alongside the township.',
    living:
      'A refinery township in the Koraput hills, with housing, a school and a health centre on site. Visakhapatnam is the nearest major city and it is a long drive. Shift buses run between the township, Semiliguda and the plant gates.',
    note:
      'Work here is with caustic liquor at temperature and pressure. The protective equipment requirements and the permit system are absolute rather than advisory, and induction covers them before anybody enters the plant.',
  },
  panchpatmali: {
    presence:
      'Panchpatmali is the bauxite plateau above Damanjodi — the mine that feeds the refinery. Mining operations, HEMM maintenance, survey, geology and the conveyor system are based here.',
    living:
      'Genuinely on top of a hill, reached by a ghat road that is a real factor in the working day and more so in monsoon. Most people live at Damanjodi or Semiliguda and travel up on the shift bus.',
    note:
      'The deposit is a blanket rather than a seam, so most of the working is ripping and dozing rather than drill-and-blast. The conveyor down to the refinery is what the whole operation is timed around.',
  },
  semiliguda: {
    presence:
      'Semiliguda supports the Koraput operations — HEMM maintenance, workshops, stores, the weighbridge and part of the site administration.',
    living:
      'A working town on the road between Sunabeda and Damanjodi, and where a good share of the site workforce lives. Company transport runs to the plant and the plateau.',
  },
  sunabeda: {
    presence: 'Sunabeda covers site security, township facilities and part of the administration for the Koraput operations.',
    living:
      'An established township town with more amenities than the surrounding area, which makes it a common choice for people posted to the Koraput sites. Shift transport runs to Damanjodi and the plateau.',
  },
  jeypore: {
    presence: 'Jeypore handles dispatch operations and part of the commercial and administrative work for the Koraput belt.',
    living:
      'The largest town in the district and the practical centre for anything that needs a bank, a hospital or a market. The road to the sites is straightforward.',
  },

  // ── Odisha: Keonjhar belt ──────────────────────────────────────────────────
  barbil: {
    presence:
      'Barbil is at the centre of the Keonjhar iron-ore belt — mining operations, beneficiation, HEMM maintenance and the site functions around them.',
    living:
      'A mining town in the proper sense, with everything the industry needs and not a great deal else. Bhubaneswar is several hours away. Monsoon runs June to September and dictates a great deal about the working year.',
    note: 'Several posts here are statutory under the Mines Act and require a certificate of competency. We sponsor those tickets for people already on the team.',
  },
  joda: {
    presence: 'Joda covers mining operations, dispatch and the plant work alongside the Barbil sites.',
    living: 'A working town adjacent to Barbil, with site transport to the working areas and company accommodation for roles that need it.',
  },
  bolani: {
    presence: 'Bolani covers iron-ore mining and the processing attached to it in the Keonjhar district.',
    living: 'Site-based work with company transport from the surrounding towns. Barbil is the nearest place of any size.',
  },

  // ── Other mining locations ─────────────────────────────────────────────────
  bailadila: {
    presence:
      'Bailadila is the iron-ore range in the Bastar region — mining operations, blasting, HEMM and the plant work that goes with them, across the Kirandul and Bacheli sectors.',
    living:
      'Remote hill terrain with company townships and site transport. This is a posting rather than a commute: people live where they work, and the townships are built for that.',
  },
  kirandul: {
    presence: 'Kirandul is one of the two main Bailadila operations, covering mining, crushing and dispatch.',
    living: 'A company township in the Bastar hills with housing, schooling and medical cover on site. Jagdalpur is the nearest larger town.',
  },
  jharia: {
    presence: 'Jharia covers underground coal operations — ventilation, winding, support work and mines rescue.',
    living:
      'A coalfield with more than a century of mining behind it and the infrastructure that comes with that. Dhanbad is adjacent and is where most people live.',
    note:
      'Underground posts carry statutory medical and training requirements, all sponsored. Gas testing certification is required for several roles, and winding engine drivers must hold a maintained medical fitness certificate — that is a legal requirement, not a preference.',
  },
  gevra: {
    presence: 'Gevra is one of the large opencast coal operations in the Korba district — haulage, dozing, drilling and the maintenance behind a substantial HEMM fleet.',
    living: 'An industrial district with company transport to the pits and shift patterns covering the mine around the clock. Korba is the nearest town of size.',
  },
  kusmunda: {
    presence: 'Kusmunda covers opencast coal mining and the material handling attached to it.',
    living: 'Site-based work in the Korba coalfield, with transport from the surrounding towns and townships.',
  },
  jayant: {
    presence: 'Jayant covers opencast coal operations in the Singrauli belt — mining, haulage and plant maintenance.',
    living: 'An established coal and power district. Site transport runs from the surrounding townships, and the working week is shift-based.',
  },
  sandur: {
    presence: 'Sandur covers iron-ore mining and beneficiation in the Ballari district.',
    living:
      'A valley town in the Sandur hills, quieter than Hospet or Ballari and closer to the working areas. Hubballi and Bengaluru are within reach for a weekend.',
  },
  donimalai: {
    presence: 'Donimalai covers iron-ore mining and the processing plant alongside it.',
    living: 'A hill township with company housing and transport, in the same belt as Sandur and Hospet.',
  },
  hospet: {
    presence: 'Hospet handles dispatch, logistics and part of the administration for the Karnataka iron-ore operations.',
    living:
      'A working town on the rail and road corridor that most of the region\'s ore moves through, with Hampi close by. Better connected than the mine sites themselves.',
  },
  zawar: {
    presence: 'Zawar covers zinc mining and the metallurgical work attached to it, south of Udaipur.',
    living:
      'Close enough to Udaipur to be genuinely liveable, which makes this an unusually comfortable posting for site-based mining work. Company transport runs from the city.',
  },

  // ── Ports and trade corridors ──────────────────────────────────────────────
  mundra: {
    presence: 'Mundra covers port operations, container control and EXIM documentation on the western corridor.',
    living:
      'Port-side work in Kutch, with Gandhidham and Bhuj as the practical places to live. A genuine trade town rather than a city, and the working culture reflects that.',
  },
  gandhidham: {
    presence: 'Gandhidham handles freight forwarding, customs clearance and trade documentation for the Kandla and Mundra ports.',
    living:
      'The town most people working the western corridor live in, built around trade and logistics. Bhuj is nearby for anything Gandhidham does not have.',
  },
  'jebel-ali': {
    presence:
      'Jebel Ali is where our MENA freight forwarding and free-zone operations sit — transhipment, re-export and the documentation the free zone regime requires.',
    living:
      'The free zone is where the physical work happens; most people live closer to Dubai and commute out. Roles here require UAE work eligibility.',
  },

  // ── Mumbai metropolitan region ─────────────────────────────────────────────
  thane: {
    presence: 'Thane covers part of the trade operations and back-office functions for the Mumbai region.',
    living:
      'Far better value than south Mumbai and well connected on the central line. For work that does not need to be in the city every day, it is the sensible base.',
  },
  virar: {
    presence: 'Roles posted at Virar sit within the Mumbai labour market and are covered by the same teams as the city.',
    living:
      'The far end of the western line, and a long commute into the city — which is exactly why we post roles here rather than expecting people to travel. The local train network is what makes this work.',
  },
  andheri: {
    presence: 'Andheri covers media production, part of the commercial team and the studio operations.',
    living:
      'The centre of the media industry in Mumbai, and where most production crew and freelancers are already based. Well connected on both the western line and the metro.',
  },

  // ── Odisha: capital ────────────────────────────────────────────────────────
  bhubaneswar: {
    presence:
      'Bhubaneswar is the regional centre for the Odisha operations — recruitment, regional content, commercial support and the liaison work with the state authorities.',
    living:
      'A well-planned city with an airport, good hospitals and a growing technology sector, and the practical base for anyone whose work covers the Keonjhar and Koraput sites without being permanently at them.',
  },
};

export function locationContext(slug?: string | null): LocationContext | undefined {
  return slug ? LOCATION_CONTEXT[slug] : undefined;
}
