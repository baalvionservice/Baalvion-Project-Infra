import type { Metadata, Viewport } from "next";
import { RootHtml, sharedMetadata, sharedViewport } from "@/app/_shell/root-html";
import { getWelcomeOfferContent } from "@/lib/cms";
import {
  SUPPORTED_COUNTRIES,
  normalizeCountry,
  countryToLocale,
  directionForCountry,
} from "@/lib/i18n/countries";
import { CountryChrome } from "./CountryChrome";

export const viewport: Viewport = sharedViewport;
export const metadata: Metadata = sharedMetadata;

/**
 * The storefront's ROOT layout — it owns <html>, not src/app/layout.tsx, which
 * no longer exists.
 *
 * The country used to be read in the old single root layout via
 * `(await headers()).get("x-amarise-country")`. `headers()` is a dynamic API,
 * and in the ROOT layout it applies to the whole app: the production build
 * shipped 61 of 63 routes as `f` with no revalidate window, so no page on this
 * site was ever cached — every request paid a full server render. Taking the
 * country from `params` instead is the same value from the same source
 * (middleware derives the header from this very segment) with none of that cost.
 */
export async function generateStaticParams(): Promise<{ country: string }[]> {
  return SUPPORTED_COUNTRIES.map((country) => ({ country }));
}

export default async function CountryRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
}) {
  const country = normalizeCountry((await params).country);
  const welcomeOffer = await getWelcomeOfferContent();

  return (
    <RootHtml
      lang={countryToLocale(country)}
      dir={directionForCountry(country)}
      welcomeOffer={welcomeOffer}
    >
      <CountryChrome>{children}</CountryChrome>
    </RootHtml>
  );
}
