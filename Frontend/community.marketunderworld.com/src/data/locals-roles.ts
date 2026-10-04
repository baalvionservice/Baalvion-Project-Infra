// ─── LOCALS HUB — 100 EVENT STAFFING ROLES ─────────────────────────────────
// Organized into 6 primary categories.
// Admins pick ONE primary category and then select multiple RoleRequirements
// with per-role quantity, gender, and age range (many-to-many).

export type RoleCategory =
  | "Hospitality, Hosting & Front of House"
  | "Corporate, MICE & Promotions"
  | "Production, Technical & Backstage Crew"
  | "Media, Creative & Digital"
  | "Food, Beverage & Catering Support"
  | "Security, Logistics & Safety";

export interface RoleDefinition {
  id: string;
  name: string;
  category: RoleCategory;
}

// Per-role requirement block (what admin fills per role in a listing)
export interface RoleRequirement {
  roleId: string;       // references RoleDefinition.id
  roleName: string;     // denormalized for display
  qty: number;          // number of people needed
  gender: "Male" | "Female" | "Any";
  minAge?: number;
  maxAge?: number;
  note?: string;        // e.g. "Must speak Hindi"
}

export const ROLE_CATEGORIES: RoleCategory[] = [
  "Hospitality, Hosting & Front of House",
  "Corporate, MICE & Promotions",
  "Production, Technical & Backstage Crew",
  "Media, Creative & Digital",
  "Food, Beverage & Catering Support",
  "Security, Logistics & Safety",
];

export const CATEGORY_EMOJI: Record<RoleCategory, string> = {
  "Hospitality, Hosting & Front of House": "🎤",
  "Corporate, MICE & Promotions": "👔",
  "Production, Technical & Backstage Crew": "🛠️",
  "Media, Creative & Digital": "📸",
  "Food, Beverage & Catering Support": "🍽️",
  "Security, Logistics & Safety": "🛑",
};

export const ALL_ROLES: RoleDefinition[] = [
  // 🎤 Hospitality, Hosting & Front of House (20)
  { id: "h-01", name: "Female Hostess",                           category: "Hospitality, Hosting & Front of House" },
  { id: "h-02", name: "Male Host",                                category: "Hospitality, Hosting & Front of House" },
  { id: "h-03", name: "VIP Guest Handler",                        category: "Hospitality, Hosting & Front of House" },
  { id: "h-04", name: "Reception Desk Executive",                 category: "Hospitality, Hosting & Front of House" },
  { id: "h-05", name: "Registration Desk Assistant",              category: "Hospitality, Hosting & Front of House" },
  { id: "h-06", name: "Badge Printing Operator",                  category: "Hospitality, Hosting & Front of House" },
  { id: "h-07", name: "RSVP Calling Executive",                   category: "Hospitality, Hosting & Front of House" },
  { id: "h-08", name: "Help Desk Coordinator",                    category: "Hospitality, Hosting & Front of House" },
  { id: "h-09", name: "Ticketing & Token Counter Staff",          category: "Hospitality, Hosting & Front of House" },
  { id: "h-10", name: "Event Anchor / Emcee (MC)",                category: "Hospitality, Hosting & Front of House" },
  { id: "h-11", name: "Flash Mob / Crowd Dancer",                 category: "Hospitality, Hosting & Front of House" },
  { id: "h-12", name: "Table Usher",                              category: "Hospitality, Hosting & Front of House" },
  { id: "h-13", name: "Directional Usher / Wayfinder",           category: "Hospitality, Hosting & Front of House" },
  { id: "h-14", name: "Main Gate Welcomer",                       category: "Hospitality, Hosting & Front of House" },
  { id: "h-15", name: "Varmala / Bridal Entry Coordinator",       category: "Hospitality, Hosting & Front of House" },
  { id: "h-16", name: "International Model",                      category: "Hospitality, Hosting & Front of House" },
  { id: "h-17", name: "Indian Print Model",                       category: "Hospitality, Hosting & Front of House" },
  { id: "h-18", name: "Kids Zone Attendant",                      category: "Hospitality, Hosting & Front of House" },
  { id: "h-19", name: "Game Coordinator / Anchor Assistant",      category: "Hospitality, Hosting & Front of House" },
  { id: "h-20", name: "Certificate / Award Distribution Asst.",  category: "Hospitality, Hosting & Front of House" },

  // 👔 Corporate, MICE & Promotions (20)
  { id: "c-01", name: "Corporate Fabricator",                     category: "Corporate, MICE & Promotions" },
  { id: "c-02", name: "Product Promoter",                         category: "Corporate, MICE & Promotions" },
  { id: "c-03", name: "Mall Activation Crew",                     category: "Corporate, MICE & Promotions" },
  { id: "c-04", name: "Leaflet / Brochure Distributor",           category: "Corporate, MICE & Promotions" },
  { id: "c-05", name: "Survey / Feedback Collection Executive",   category: "Corporate, MICE & Promotions" },
  { id: "c-06", name: "Data Entry Operator (On-site)",            category: "Corporate, MICE & Promotions" },
  { id: "c-07", name: "B2B Matchmaking Coordinator",              category: "Corporate, MICE & Promotions" },
  { id: "c-08", name: "Stall Attendant / Booth Staff",            category: "Corporate, MICE & Promotions" },
  { id: "c-09", name: "Mascot Costume Artist",                    category: "Corporate, MICE & Promotions" },
  { id: "c-10", name: "Mystery Shopping Auditor",                 category: "Corporate, MICE & Promotions" },
  { id: "c-11", name: "QR Code Scanner / Check-in Crew",         category: "Corporate, MICE & Promotions" },
  { id: "c-12", name: "Flash Sale Hype Agent",                    category: "Corporate, MICE & Promotions" },
  { id: "c-13", name: "Brand Ambassador",                         category: "Corporate, MICE & Promotions" },
  { id: "c-14", name: "Canvassing / Outbound Crew",               category: "Corporate, MICE & Promotions" },
  { id: "c-15", name: "Seminar Hall In-charge",                   category: "Corporate, MICE & Promotions" },
  { id: "c-16", name: "VIP Lounge Attendant",                     category: "Corporate, MICE & Promotions" },
  { id: "c-17", name: "Corporate Gift Packing Crew",              category: "Corporate, MICE & Promotions" },
  { id: "c-18", name: "Certificate Printer / Writer",             category: "Corporate, MICE & Promotions" },
  { id: "c-19", name: "Presentation Advance Operator (Clicker)", category: "Corporate, MICE & Promotions" },
  { id: "c-20", name: "Merchandise Sales Executive",              category: "Corporate, MICE & Promotions" },

  // 🛠️ Production, Technical & Backstage Crew (20)
  { id: "p-01", name: "Stagehand",                                category: "Production, Technical & Backstage Crew" },
  { id: "p-02", name: "Sound Engineer",                           category: "Production, Technical & Backstage Crew" },
  { id: "p-03", name: "Audio Technician Assistant",               category: "Production, Technical & Backstage Crew" },
  { id: "p-04", name: "Lighting Technician",                      category: "Production, Technical & Backstage Crew" },
  { id: "p-05", name: "Console Operator",                         category: "Production, Technical & Backstage Crew" },
  { id: "p-06", name: "LED Wall Technician",                      category: "Production, Technical & Backstage Crew" },
  { id: "p-07", name: "Carpenter (Event Set-up)",                 category: "Production, Technical & Backstage Crew" },
  { id: "p-08", name: "Backstage Fabricator",                     category: "Production, Technical & Backstage Crew" },
  { id: "p-09", name: "Scenic Painter / Touch-up Artist",         category: "Production, Technical & Backstage Crew" },
  { id: "p-10", name: "Rigging Crew (Trussing & Truss Setup)",    category: "Production, Technical & Backstage Crew" },
  { id: "p-11", name: "Heavy Loading/Unloading Crew (Hamali)",    category: "Production, Technical & Backstage Crew" },
  { id: "p-12", name: "AV Cable Wrangler",                        category: "Production, Technical & Backstage Crew" },
  { id: "p-13", name: "Generator (DG Set) Operator",              category: "Production, Technical & Backstage Crew" },
  { id: "p-14", name: "Backstage Runner",                         category: "Production, Technical & Backstage Crew" },
  { id: "p-15", name: "Props & Decor Assembler",                  category: "Production, Technical & Backstage Crew" },
  { id: "p-16", name: "Fabric Draping & Flower Decorator",        category: "Production, Technical & Backstage Crew" },
  { id: "p-17", name: "Stage Entry Manager",                      category: "Production, Technical & Backstage Crew" },
  { id: "p-18", name: "Artist Greenroom Coordinator",             category: "Production, Technical & Backstage Crew" },
  { id: "p-19", name: "Technical Floor Assistant",                category: "Production, Technical & Backstage Crew" },
  { id: "p-20", name: "Pyrotechnics / Cold Fire Operator",        category: "Production, Technical & Backstage Crew" },

  // 📸 Media, Creative & Digital (15)
  { id: "m-01", name: "Event Videographer",                       category: "Media, Creative & Digital" },
  { id: "m-02", name: "Candid Wedding Photographer",              category: "Media, Creative & Digital" },
  { id: "m-03", name: "Traditional Photographer",                 category: "Media, Creative & Digital" },
  { id: "m-04", name: "Drone Operator / Pilot",                   category: "Media, Creative & Digital" },
  { id: "m-05", name: "Spot-Boy (Media Crew)",                    category: "Media, Creative & Digital" },
  { id: "m-06", name: "On-site Video Editor (Reels / Quick Edits)", category: "Media, Creative & Digital" },
  { id: "m-07", name: "Live Stream / Webcast Technician",         category: "Media, Creative & Digital" },
  { id: "m-08", name: "Behind-the-Scenes (BTS) Content Creator", category: "Media, Creative & Digital" },
  { id: "m-09", name: "Sound Recorder / Boom Mic Operator",       category: "Media, Creative & Digital" },
  { id: "m-10", name: "360 Selfie Booth Operator",                category: "Media, Creative & Digital" },
  { id: "m-11", name: "Instant Photo Print Technician",           category: "Media, Creative & Digital" },
  { id: "m-12", name: "Lighting Grip Assistant",                  category: "Media, Creative & Digital" },
  { id: "m-13", name: "Event Graphic Designer (On-call)",         category: "Media, Creative & Digital" },
  { id: "m-14", name: "Social Media Live Manager",                category: "Media, Creative & Digital" },
  { id: "m-15", name: "Teleprompter Operator",                    category: "Media, Creative & Digital" },

  // 🍽️ Food, Beverage & Catering Support (15)
  { id: "f-01", name: "Banquet Server",                           category: "Food, Beverage & Catering Support" },
  { id: "f-02", name: "VIP Buffet Attendant",                     category: "Food, Beverage & Catering Support" },
  { id: "f-03", name: "Live Food Counter Helper",                 category: "Food, Beverage & Catering Support" },
  { id: "f-04", name: "Event Bartender",                          category: "Food, Beverage & Catering Support" },
  { id: "f-05", name: "Barback (Bartender Assistant)",            category: "Food, Beverage & Catering Support" },
  { id: "f-06", name: "Flair Bartender (Performance Bartending)", category: "Food, Beverage & Catering Support" },
  { id: "f-07", name: "Kitchen Utility Helper",                   category: "Food, Beverage & Catering Support" },
  { id: "f-08", name: "Food Runner",                              category: "Food, Beverage & Catering Support" },
  { id: "f-09", name: "Crockery Counter In-charge",               category: "Food, Beverage & Catering Support" },
  { id: "f-10", name: "Table Cleanser / Busser",                  category: "Food, Beverage & Catering Support" },
  { id: "f-11", name: "Welcome Drink Server",                     category: "Food, Beverage & Catering Support" },
  { id: "f-12", name: "Shisha / Hookah Maker",                    category: "Food, Beverage & Catering Support" },
  { id: "f-13", name: "Catering Coordinator",                     category: "Food, Beverage & Catering Support" },
  { id: "f-14", name: "Inventory Storekeeper (F&B)",              category: "Food, Beverage & Catering Support" },
  { id: "f-15", name: "Ice & Raw Materials Runner",               category: "Food, Beverage & Catering Support" },

  // 🛑 Security, Logistics & Safety (10)
  { id: "s-01", name: "Event Security Guard",                     category: "Security, Logistics & Safety" },
  { id: "s-02", name: "Female Security Bouncer",                  category: "Security, Logistics & Safety" },
  { id: "s-03", name: "Male Security Bouncer",                    category: "Security, Logistics & Safety" },
  { id: "s-04", name: "Crowd Control Marshal",                    category: "Security, Logistics & Safety" },
  { id: "s-05", name: "Valet Parking Driver",                     category: "Security, Logistics & Safety" },
  { id: "s-06", name: "Parking Lot Traffic Director",             category: "Security, Logistics & Safety" },
  { id: "s-07", name: "Walkie-Talkie Coordinator / Dispatcher",   category: "Security, Logistics & Safety" },
  { id: "s-08", name: "First Aid / On-site Nurse",                category: "Security, Logistics & Safety" },
  { id: "s-09", name: "Fire Safety Marshal",                      category: "Security, Logistics & Safety" },
  { id: "s-10", name: "Lost & Found Desk In-charge",              category: "Security, Logistics & Safety" },
];

/** Get all roles for a given category */
export function getRolesByCategory(category: RoleCategory): RoleDefinition[] {
  return ALL_ROLES.filter((r) => r.category === category);
}

/** Get a role definition by id */
export function getRoleById(id: string): RoleDefinition | undefined {
  return ALL_ROLES.find((r) => r.id === id);
}
