// ─── NIGHTLIFE PLATFORM — SHARED DATA & TYPES ──────────────────────────────

export type UserType = "candidate" | "employer";

export const MUMBAI_ZONES = [
  "Lower Parel", "Bandra (W)", "Bandra (E)", "Juhu", "Andheri (W)",
  "Andheri (E)", "Powai", "Worli", "Colaba", "BKC (Bandra Kurla Complex)",
  "Dadar", "Borivali", "Malad", "Goregaon", "Navi Mumbai",
];
export const OTHER_ZONES = [
  "Delhi — Connaught Place", "Delhi — Hauz Khas", "Delhi — Aerocity",
  "Goa — North", "Goa — South",
];
export const ALL_ZONES = [...MUMBAI_ZONES, ...OTHER_ZONES];

export const CANDIDATE_ROLES = [
  "Paid Party Hostess",
  "Male Host / Promoter",
  "Event Emcee / MC",
  "Crowd Dancer / Flash Mob",
  "Brand Ambassador",
  "Guest List Promoter",
  "Table Greeter",
  "Entry Gate Host",
  "Vibe Host (Insta Check-in)",
  "VIP Escort / Butler",
  "Bartender (Flair / Regular)",
  "Mixologist Assistant",
  "DJ Assistant / Runner",
];

export const CANDIDATE_SERVICES = [
  "Table Seating Assistance",
  "Insta Check-in / Content Creation",
  "Vibe Hype & Crowd Energy",
  "Guest List Management",
  "VIP Bottle Service",
  "Brand Promotion On-floor",
  "Entry & Queue Management",
  "Event Photography Assist",
];

export const PERKS = [
  "Cash Pay (Same Night)",
  "Pay Within 3 Days",
  "Weekly Pay",
  "Free Entry + Cover",
  "Cab Drop After Event",
  "Dinner / F&B Included",
  "Commission on Covers",
];

export const DRESS_CODES = [
  "All Black Formals",
  "Black Blazer + Trousers",
  "Traditional Saree",
  "Smart Casual",
  "Ethnic / Festive",
  "Club Wear (Trendy)",
  "Brand Uniform Provided",
];

export const PAY_CYCLES = ["Same Night Cash", "Within 3 Days", "Weekly", "Monthly"];
