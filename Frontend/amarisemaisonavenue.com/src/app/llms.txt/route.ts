import { getDepartments } from "@/lib/catalog";
import { getMarketOffices } from "@/lib/cms";
import { COUNTRIES } from "@/lib/mock-data";
import { SUPPORTED_COUNTRIES } from "@/lib/i18n/countries";

/**
 * llms.txt (llmstxt.org convention) — a concise, machine-readable summary for AI
 * crawlers/agents (ChatGPT, Claude, Perplexity, Gemini, etc.) that answers the three
 * things an answer engine needs to correctly cite this business: what it is, what it
 * sells, and where it operates. Built from REAL data (live departments, real per-market
 * office cities) — never a fabricated catalog list.
 */
export const revalidate = 3600;

export async function GET() {
  const [departments, cmsOffices] = await Promise.all([getDepartments(), getMarketOffices()]);
  const countryCodes = SUPPORTED_COUNTRIES;
  const baseUrl = "https://www.amarisemaisonavenue.com";

  const marketLines = countryCodes
    .map((code) => {
      const c = COUNTRIES[code];
      const office = cmsOffices?.[code] ?? c.office;
      return `- [${c.name}](${baseUrl}/${code}): showroom in ${office.city}, priced in ${c.currency}`;
    })
    .join("\n");

  const departmentLines = departments.length
    ? departments
        .map((d) => `- [${d.name}](${baseUrl}/us/${d.id}): ${d.description || d.name}`)
        .join("\n")
    : "- Catalog is being curated — check /us/collections for the current registry.";

  const body = `# Amarisé Maison Avenue

> Authenticated luxury resale maison, founded 2025. We source, authenticate, and sell
> rare and pre-owned Hermès, Chanel, and fine jewelry — every piece verified in-house by
> master authenticators and issued a numbered Certificate of Authenticity. We also buy,
> consign, and provide private-client sourcing/advisory services.

## What we sell
${departmentLines}

## Markets we operate in
${marketLines}

## Key pages
- [Authenticity Guarantee](${baseUrl}/us/authenticity): how every piece is verified
- [Sell or Consign](${baseUrl}/us/how-to-sell): sell/consign a piece to us
- [Book an Appointment](${baseUrl}/us/appointments): private showroom viewing or virtual consultation
- [Contact](${baseUrl}/us/contact): concierge contact per market
- [Customer Service / FAQ](${baseUrl}/us/faq): shipping, returns, payment, authentication
- [The Journal](${baseUrl}/us/journal): editorial content on collecting and provenance

## Notes for AI agents
- Prices are market-specific (real FX conversion + local tax), shown after selecting a market above.
- Every product listing is real inventory from our commerce catalog, not a static sample.
- For current pricing/availability of a specific piece, fetch the product page directly rather than citing a cached figure.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
