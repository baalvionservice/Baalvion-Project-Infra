import type { LicenseKind } from "./types";

/** Friendly metadata for each license category (factual descriptions, no claims). */
export const LICENSE_KINDS: Record<
  LicenseKind,
  { slug: string; label: string; blurb: string; icon: string }
> = {
  "quarry-license": {
    slug: "quarry",
    label: "Quarry Licenses",
    blurb: "Permits authorising the operation of quarries and extraction of stone, aggregates and minerals from approved sites.",
    icon: "Mountain",
  },
  "mining-license": {
    slug: "mining",
    label: "Mining Licenses",
    blurb: "Leases and permits governing mineral exploration and extraction activities.",
    icon: "Pickaxe",
  },
  "environmental-clearance": {
    slug: "environmental",
    label: "Environmental Clearances",
    blurb: "Approvals confirming environmental impact assessment and consent to operate within regulatory limits.",
    icon: "Leaf",
  },
  "government-approval": {
    slug: "government",
    label: "Government Approvals",
    blurb: "Sanctions, consents and no-objection certificates issued by competent government authorities.",
    icon: "Landmark",
  },
  "industry-registration": {
    slug: "industry",
    label: "Industry Registrations",
    blurb: "Sector and trade registrations relevant to mining, minerals and industrial supply.",
    icon: "FileBadge",
  },
  "corporate-registration": {
    slug: "corporate",
    label: "Corporate Registrations",
    blurb: "Company incorporation and statutory registrations under applicable corporate law.",
    icon: "Building2",
  },
  "iso-certification": {
    slug: "iso",
    label: "ISO Certifications",
    blurb: "Quality, environmental and safety management system certifications, where attained.",
    icon: "BadgeCheck",
  },
};

export const LICENSE_KIND_BY_SLUG: Record<string, LicenseKind> = Object.fromEntries(
  (Object.entries(LICENSE_KINDS) as [LicenseKind, { slug: string }][]).map(
    ([kind, meta]) => [meta.slug, kind],
  ),
);
