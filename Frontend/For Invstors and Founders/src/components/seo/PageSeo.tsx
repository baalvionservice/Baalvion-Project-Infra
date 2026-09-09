import { useEffect } from "react";

// Per-route <head> management without pulling in react-helmet. Tags this component owns are
// marked data-page-seo so they can be torn down on unmount without clobbering the static tags
// in index.html.
//
// Caveat worth knowing: this is a client-rendered SPA, so these tags exist only after JS runs.
// Googlebot renders JS and will see them; most social/link scrapers do not, and will fall back
// to the static index.html tags. Real per-page previews need prerendering at build time.

const SITE_URL: string =
  (import.meta as any).env?.VITE_PUBLIC_SITE_URL || "https://www.marketunderworld.com";

type Props = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
};

const upsert = (selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) => {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    el.setAttribute("data-page-seo", "");
    document.head.appendChild(el);
  }
  apply(el);
};

export default function PageSeo({ title, description, path, image, noIndex, jsonLd }: Props) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const img = image || `${SITE_URL}/og-image.png`;

    document.title = title;

    const meta = (attr: "name" | "property", key: string, content: string) =>
      upsert(`meta[${attr}="${key}"]`, () => {
        const m = document.createElement("meta");
        m.setAttribute(attr, key);
        return m;
      }, (el) => el.setAttribute("content", content));

    meta("name", "description", description);
    meta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    meta("property", "og:title", title);
    meta("property", "og:description", description);
    meta("property", "og:url", url);
    meta("property", "og:image", img);
    meta("property", "og:type", "website");
    meta("name", "twitter:card", "summary_large_image");
    meta("name", "twitter:title", title);
    meta("name", "twitter:description", description);
    meta("name", "twitter:image", img);

    upsert('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    }, (el) => el.setAttribute("href", url));

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-page-seo", "");
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => { script?.remove(); };
  }, [title, description, path, image, noIndex, jsonLd]);

  return null;
}

export { SITE_URL };
