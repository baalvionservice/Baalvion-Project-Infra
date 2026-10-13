// Setup/seed data leaves obvious stand-in text on products ("PLACEHOLDER DESCRIPTION", colour
// "TBD Color", status "Pending Real Details"). None of that may reach customers, so the editor
// flags it and blocks publishing until it has been replaced with real details.
export interface PlaceholderInput {
  description?: string | null;
  colors?: string[];
  listingStatus?: unknown;
}

const PLACEHOLDER = /placeholder|lorem ipsum|\btbd\b|\bto be (decided|confirmed)\b|coming soon/i;

export function placeholderReasons({ description, colors = [], listingStatus }: PlaceholderInput): string[] {
  const out: string[] = [];
  if (description && PLACEHOLDER.test(description)) out.push('The description still contains placeholder text. Write the real one under "Extra details".');
  if (colors.some((c) => PLACEHOLDER.test(c))) out.push('The colour is still a placeholder (for example "TBD Color"). Enter the real colour, or clear it.');
  if (typeof listingStatus === 'string' && /pending real details/i.test(listingStatus)) out.push('This product is still marked "Pending Real Details" from setup. Saving it with real details clears that.');
  return out;
}

export const splitList = (text: string): string[] =>
  Array.from(new Set(text.split(',').map((x) => x.trim()).filter(Boolean)));
