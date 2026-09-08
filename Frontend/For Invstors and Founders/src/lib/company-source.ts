// Where a company record came from decides what it can honestly show. A Form D record has
// filings and money; a national-register record has a legal form, staff and a status, and no
// funding at all. Rendering one shape's fields for the other produces a page full of dashes.
export type SourceKind = "filings" | "registry";

const SOURCES: Record<string, { label: string; blurb: string; kind: SourceKind }> = {
  sec_form_d: {
    label: "SEC Form D",
    blurb: "the notice filed with the US Securities and Exchange Commission when raising capital from private investors",
    kind: "filings",
  },
  brreg: {
    label: "Enhetsregisteret",
    blurb: "Norway's Central Coordinating Register for Legal Entities, run by Brønnøysundregistrene",
    kind: "registry",
  },
  companies_house: {
    label: "Companies House",
    blurb: "the United Kingdom's registrar of companies",
    kind: "registry",
  },
  prh: {
    label: "PRH / YTJ",
    blurb: "the Finnish Business Information System, run by the Patent and Registration Office and the Tax Administration",
    kind: "registry",
  },
};

export const sourceInfo = (source: string | null | undefined) =>
  SOURCES[String(source || "")] || { label: "Manual entry", blurb: "entered directly by Baalvion", kind: "registry" as SourceKind };

export const isRegistryRecord = (source: string | null | undefined) => sourceInfo(source).kind === "registry";
