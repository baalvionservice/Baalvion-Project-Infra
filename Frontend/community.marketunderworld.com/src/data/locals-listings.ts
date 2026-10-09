// Shared Locals Hub data — used by the listing page AND individual detail pages
// so Google can index every listing at its own URL with unique SEO metadata.

import type { RoleCategory, RoleRequirement } from "./locals-roles";

export type Category = "All" | "Casting & Jobs" | "Events" | "Matchmaking" | "Travel";

export interface LocalListing {
  id: string;
  slug: string;           // URL-friendly identifier e.g. "ugc-video-shoot-cosmetic-brand-mumbai"
  title: string;
  type: Exclude<Category, "All">;
  location: string;
  city: string;           // For SEO keywords e.g. "Mumbai"
  description: string;
  requirements?: string[];
  contact?: string;
  date?: string;
  salary?: string;
  postedBy: string;
  verified: boolean;
  postedAt: string;
  minAge?: number;
  maxAge?: number;
  gender?: "Male" | "Female" | "Any";
  // ── Many-to-many role requirements (new system) ──────────────────────────
  primaryCategory?: RoleCategory;        // e.g. "Hospitality, Hosting & Front of House"
  roleRequirements?: RoleRequirement[];  // e.g. [{roleId:"h-01", roleName:"Female Hostess", qty:5, gender:"Female"}]
  // SEO helpers
  seoKeywords?: string[];
}

export const ALL_LISTINGS: LocalListing[] = [
  {
    id: "cast-1",
    slug: "ugc-video-shoot-cosmetic-brand-mumbai",
    title: "CASTING CALL - UGC Video Shoot (Cosmetic Brand)",
    type: "Casting & Jobs",
    location: "Mumbai",
    city: "Mumbai",
    description:
      "Need Mumbai Based GenZ Artist Only. Project is for a Cosmetic Brand doing UGC Videos (3-4 videos). Shoot dates flexible based on selected actor's availability. If you are interested, share your photos, one intro video, and contact details.",
    requirements: [
      "Must speak English fluently",
      "Comfortable creating natural, authentic UGC-style videos",
      "Send recent photos + 1 intro video + contact details",
    ],
    contact: "WhatsApp: +91 8355945296",
    date: "This month or next month",
    postedBy: "Casting47",
    verified: true,
    postedAt: "Today · 12:36 PM",
    minAge: 18,
    maxAge: 24,
    gender: "Any",
    seoKeywords: ["UGC creator Mumbai", "cosmetic brand shoot Mumbai", "GenZ artist casting", "content creator casting call Mumbai 2026"],
  },
  {
    id: "cast-2",
    slug: "female-artist-casting-dermacy-films-delhi",
    title: "Dermacy Films - Lead Female Artist (Urgent)",
    type: "Casting & Jobs",
    location: "Delhi & Delhi NCR",
    city: "Delhi",
    description:
      "Urgent requirement for good looking female artists for Dermacy films. Shoot Date: 6th to 9th October (1 Day). Must be confident with direct-to-camera delivery. Interested artists send your current look pics with complete profile work link. Audition link and intro without contact.",
    requirements: [
      "Dermatologist role: Female, 28-32 yrs. Good-looking, polished, credible face, strong English.",
      "Consumer role: Female, 25-30 yrs. Fresh, relatable face with a natural screen presence, strong English.",
    ],
    contact: "rightwayfilms26@gmail.com | 9212764866 | 9372342210",
    date: "Oct 6 to Oct 9, 2026",
    postedBy: "Right Way Films",
    verified: true,
    postedAt: "Yesterday",
    minAge: 25,
    maxAge: 32,
    gender: "Female",
    seoKeywords: ["acting audition Delhi", "female artist casting Delhi NCR", "Dermacy films casting call", "actress required Delhi October 2026"],
  },
  {
    id: "dance-1",
    slug: "dancer-boys-girls-goa-shows-mumbai",
    title: "DANCER BOYS & GIRLS Needed - Goa Shows (6 Months)",
    type: "Casting & Jobs",
    location: "Mumbai (Rehearsals) → Goa (Shows)",
    city: "Mumbai",
    description:
      "Show in Goa for 6 Months. Daily Evening Show 2-3hrs Indian Musical. Rehearsals in Mumbai from 15 Nov to 30 Nov. Stay and Food will be provided. Boys ke saath girls compulsory hai.",
    requirements: [
      "Rehearsals conveyance: ₹300 per day in Mumbai",
      "Send 1 Good Pic with Name & Height + 1 Dance Video",
      "Boys with girls pairs preferred",
    ],
    salary: "₹33,000 / month + Stay & Food",
    postedBy: "DANCER BOYS (मुंबई)",
    verified: true,
    postedAt: "Today · 12:02 PM",
    minAge: 18,
    maxAge: 35,
    gender: "Any",
    seoKeywords: ["dancer jobs Mumbai", "dancer required Goa", "Indian musical show dancer", "dance performance jobs Mumbai 2026", "dancer boys girls Goa show"],
  },
  {
    id: "dance-2",
    slug: "wedding-show-girls-jodhpur",
    title: "Girls Required for Jodhpur Wedding Shows",
    type: "Events",
    location: "Jodhpur, Rajasthan",
    city: "Jodhpur",
    description:
      "Need 2 girls for Jodhpur wedding shows. 4 month duration starting from November. Good pay for the right candidates. Contact directly for more details.",
    contact: "+91 7397 854 767",
    postedBy: "Ankit",
    verified: false,
    postedAt: "Today",
    minAge: 20,
    maxAge: 35,
    gender: "Female",
    seoKeywords: ["wedding performer Jodhpur", "girls required wedding show", "Rajasthan wedding performance", "wedding dancers Jodhpur 2026"],
  },
  {
    id: "mtc-1",
    slug: "elite-matchmaking-networking-south-mumbai",
    title: "Elite Matchmaking & Networking - South Mumbai",
    type: "Matchmaking",
    location: "South Mumbai",
    city: "Mumbai",
    description:
      "Connect with high-net-worth individuals and entrepreneurs for dating, friendship, or business synergies. Verified profiles only. Age 21+.",
    requirements: [
      "Verified Profile Required",
      "Age 21+",
    ],
    postedBy: "Admin",
    verified: true,
    postedAt: "2 Days ago",
    minAge: 21,
    gender: "Any",
    seoKeywords: ["matchmaking Mumbai", "elite dating Mumbai", "networking South Mumbai", "friends dating Mumbai 2026"],
  },
];

/** Convert a listing title + location into a URL slug */
export function toSlug(title: string, location: string): string {
  return `${title} ${location}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Find a listing by its slug */
export function getListingBySlug(slug: string): LocalListing | undefined {
  return ALL_LISTINGS.find((l) => l.slug === slug);
}
