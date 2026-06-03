/**
 * @fileOverview Multi-market SEO helpers.
 *
 * Produces the `hreflang` alternate map + canonical URL that tell search engines
 * the 5 country versions of a page are the same artifact in different markets.
 * Without these, `/us/...`, `/uk/...`, `/ae/...` compete as duplicate content.
 */
import type { Metadata } from "next";
import type { CountryCode } from "./types";
import {
  SUPPORTED_COUNTRIES,
  DEFAULT_COUNTRY,
  countryToLocale,
} from "./i18n/countries";

/** Origin without trailing slash. Override per environment if needed. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.amarisemaisonavenue.com"
).replace(/\/$/, "");

function normalizeSubPath(subPath: string): string {
  if (!subPath || subPath === "/") return "";
  return subPath.startsWith("/") ? subPath : `/${subPath}`;
}

function urlFor(country: CountryCode, subPath: string): string {
  return `${SITE_URL}/${country}${normalizeSubPath(subPath)}`;
}

/**
 * Build canonical + hreflang languages for a page.
 *
 * @param country  the country the current page is rendering
 * @param subPath  everything after the country segment, e.g. "/product/abc"
 */
export function buildAlternates(
  country: CountryCode,
  subPath: string
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const code of SUPPORTED_COUNTRIES) {
    languages[countryToLocale(code)] = urlFor(code, subPath);
  }
  languages["x-default"] = urlFor(DEFAULT_COUNTRY, subPath);

  return {
    canonical: urlFor(country, subPath),
    languages,
  };
}

/** hreflang alternates in the shape expected by `MetadataRoute.Sitemap` entries. */
export function sitemapAlternates(subPath: string): {
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  for (const code of SUPPORTED_COUNTRIES) {
    languages[countryToLocale(code)] = urlFor(code, subPath);
  }
  return { languages };
}
