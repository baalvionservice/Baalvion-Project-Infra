import { PlaceHolderImages } from "./placeholder-images";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  tagline: string;
  bio: string;
  expertise: string[];
  socials: {
    linkedin: string;
    portfolio?: string;
  };
  image: string;
  imageHint: string;
}

/**
 * Demo fixture only — never render this on a public page.
 *
 * Eight invented people were listed here ("Arjun Mehta", "Priya", "David", "Emily",
 * "Samuel", "Chloe", "Omar", "Kenji") with full biographies, presented as the team building
 * this product. They feed the admin console's team CRUD screen and nothing public, which is
 * the only reason they were not removed with the invented executives on /about/team.
 *
 * Left empty rather than populated: an empty admin list is obvious, whereas plausible fake
 * colleagues quietly become the roster someone copies onto a real page.
 */
export let teamMembers: TeamMember[] = [];
