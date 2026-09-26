export const leadershipTeam = [
  {
    name: "Deepak Kumar Kuldeep",
    title: "Founder & Chief Visionary Officer",
    bio: "Deepak is the driving force behind Baalvion, bringing over two decades of experience in global trade and technology. His vision is to build a transparent and efficient ecosystem for B2B commerce worldwide.",
    imageId: "founder-photo",
  },
  {
    name: "Tamanna shaikh",
    title: "Chief Executive Officer",
    bio: "Tamanna leads Baalvion's strategic execution and day-to-day operations. With a background in corporate strategy and finance, he is focused on scaling the company and delivering value to our stakeholders.",
    imageId: "tamanna-photo",
  },
  {
    name: "Dilip Kumar Kuldeep",
    title: "Director",
    bio: "Prathamesh Pawer leads Baalvion's strategic execution and day-to-day operations. With a background in corporate strategy and finance, he is focused on scaling the company and delivering value to our stakeholders.",
    imageId: "dilip-photo",
  },
  {
    name: "Adarsh Patra",
    title: "Chief Technology Officer",
    bio: "Adarsh leads Baalvion's strategic execution and day-to-day operations. With a background in corporate strategy and finance, he is focused on scaling the company and delivering value to our stakeholders.",
    imageId: "executive-1-photo",
  },
];
export const globalLeaders = [
  {
    name: "Parthamesh Pawer",
    title: "Head of Strategic Partnerships",
    imageId: "prathamesh-photo",
    bio: "Parthamesh Pawer leads Baalvion's partner ecosystem and strategic alliances. With a background in corporate strategy and finance, he is focused on building the relationships that extend Baalvion's platform and reach.",
  },
  {
    name: "Laxman Singh Champia",
    title: "Co-Head of Product Engineering",
    imageId: "laxman-photo",
    bio: "Laxman Singh Champia oversees the development of Baalvion's core technology platform. With extensive experience in software engineering and product management, he ensures our solutions are innovative, reliable, and scalable.",
  },
  {
    name: "Rashmika Singh",
    title: "Co-Head of Product Engineering",
    imageId: "rashmika-photo",
    bio: "Rashmika Singh oversees the development of Baalvion's core technology platform. With extensive experience in software engineering and product management, she ensures our solutions are innovative, reliable, and scalable.",
  },
  {
    name: "Preeti snigdha Mallick",
    title: "Deputy General Counsel",
    imageId: "preeti-photo",
    bio: "Preeti Snigdha Mallick leads Baalvion's legal strategy and compliance efforts. With a strong background in corporate law and regulatory affairs, she ensures our operations adhere to the highest standards of integrity and governance.",
  },
  { name: "Sophia L. Marchetti", title: "Head of Asia Pacific",
    bio: "Sophia L. Marchetti leads Baalvion's strategy, operations and growth across the Asia Pacific region, one of the world's most dynamic and fast-growing markets.",
   },
  { name: "Daniel K. Mercer", title: "Global Head of Client Solutions",
    bio: "Daniel K. Mercer leads the teams that help clients adopt, integrate and realise value from Baalvion's platform, strengthening trust and partnership across the company's global client base.",
   },
  { name: "Marcus T. Hale", title: "Global Head of Platform & Technology",
    bio: "Marcus T. Hale leads Baalvion's engineering, data and platform organisation, ensuring the company's technology foundation is robust, secure and built to scale with the business.",
   },
  { name: "Olivia R. Bennett", title: "Global Head of Market Development",
    bio: "Olivia R. Bennett leads Baalvion's market development initiatives, expanding the company's presence across markets and deepening relationships with clients and partners.",
   },
];
export const VicePersidents = [
  {
    name: "Sasmita Gemel",
    title: "Vice President",
    position: "Marketing Communications",
    imageId: "sasmita-photo",
    bio: "Sasmita Gemel leads Baalvion's marketing communications strategy, crafting compelling narratives that resonate with our global audience. With a background in brand management and digital marketing, she drives our efforts to build a strong and recognizable brand in the global trade ecosystem.",
  },
  {
    name: "Vishal Kumar Pingua",
    title: "Vice President",
    imageId: "bishal-photo",
    position: "Corporate Development",
    bio: "Vishal Kumar Pingua heads Baalvion's corporate development initiatives, focusing on strategic partnerships, mergers and acquisitions, and growth opportunities. With extensive experience in business strategy and financial analysis, he plays a critical role in shaping our company's future trajectory.",
  },
  {
    name: "Biswajeet Patra",
    title: "Vice President",
    imageId: "biswajeet-photo",
    position: "Corporate Counsel",
    bio: "Biswajeet Patra leads Baalvion's legal affairs, ensuring compliance with global regulations and managing legal risks. With a strong background in corporate law and international business, he provides essential guidance to support our global operations and strategic initiatives.",
  },
  {
    name: "Jaid Alam",
    title: "Vice President",
    imageId: "jaid-photo",
    position: "Worldwide Sales",
    bio: "Jaid Alam oversees Baalvion's worldwide sales operations, driving revenue growth and client acquisition across global markets. With a proven track record in sales leadership and a deep understanding of the B2B commerce landscape, he is instrumental in expanding our customer base and strengthening our market position.",
  },
];

/**
 * Real directors only.
 *
 * Seven invented directors sat here — "Jonathan R. Whitfield, Non-Executive Chairman of
 * the Board", "Margaret A. Sinclair, Lead Independent Director" and five more — each with
 * a governance bio naming Baalvion Industries Private Limited and claiming independent
 * oversight of management. None are directors of the company. cmsGetBoard() falls back to
 * this list whenever the CMS returns no board, so they rendered on the public
 * /governance/board-of-directors page.
 *
 * Board composition is a statutory fact about a company and a representation to investors;
 * independent-director claims carry governance meaning. This is not a place for
 * placeholders. Leave empty until the real directors are entered in the CMS — the page
 * says the roster is not published yet rather than showing invented names.
 */
export const boardOfDirectors: never[] = [];

/**
 * Everything below this point was invented and has been removed.
 *
 * It is dead code — cms.ts imports only the four rosters above — which is the only reason
 * it was not caught with the fabricated people. That makes it more dangerous, not less: the
 * moment a documents or performance section is wired up, an investor sees it as real.
 *
 *   newsArticles / pressReleases  an acquisition ("VeriTrade"), a partnership ("PortLink
 *                                 Logistics"), a Davos appearance by a founder named
 *                                 "Alexandros Vasilias" who does not exist, "150% YoY
 *                                 Growth", and "Full Year 2025 Diluted EPS of $35.31".
 *                                 The same items were published to the CMS and have now
 *                                 been purged from it.
 *
 *   documents                     "Independent Audited Financials (FY 2023).pdf" and
 *                                 "Q2 2024 Unaudited Financials.pdf" — reporting periods
 *                                 that predate the company, which was incorporated on
 *                                 2025-03-11 — plus a Series A pitch deck, financial model,
 *                                 subscription agreement, shareholder agreement and risk
 *                                 disclosure, none of which exist.
 *
 *   investorData                  a holding of $750,000 at 1.87% for "Series A Preferred",
 *                                 a certificate id, KYC marked Passed, and a cap table.
 *                                 Fabricated holdings are a representation to whoever is
 *                                 shown them.
 *
 * Real editorial belongs in the CMS. Real investor positions belong in ir-service, which
 * owns them. Neither belongs in a bundled fixture.
 */
