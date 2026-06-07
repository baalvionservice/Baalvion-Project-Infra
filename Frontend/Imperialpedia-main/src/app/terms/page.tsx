import Link from "next/link";
import { ArrowRight, BookMarked } from "lucide-react";
import { Container } from "@/design-system/layout/container";
import { Section } from "@/design-system/layout/section";
import { Text } from "@/design-system/typography/text";
import { buildMetadata } from "@/lib/seo";
import { fetchAllTerms } from "@/lib/data/term-live";
import type { Term } from "@/lib/data/terms";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Financial Term Dictionary — A to Z",
  description:
    "Browse Imperialpedia's full financial dictionary, indexed A–Z. Expert-vetted definitions of investing, banking, economics, crypto, and market terms.",
  canonical: "/terms",
});

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function letterOf(term: Term): string {
  const first = term.title.charAt(0).toLowerCase();
  return /^[0-9]/.test(first) ? "num" : first;
}

function termHref(term: Term): string {
  return `/terms/${letterOf(term)}/${term.slug}`;
}

export default async function TermsHubPage() {
  const all = (await fetchAllTerms()).filter((t) => t?.title && t?.slug);

  // Letters that actually have at least one term — used to enable/disable nav tiles.
  const populated = new Set(all.map(letterOf));

  // A handful of recent/representative terms to feature beneath the index.
  const featured = [...all]
    .sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }))
    .slice(0, 12);

  const tileBase =
    "flex aspect-square items-center justify-center rounded-xl border text-lg font-bold uppercase transition-colors";

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-4xl">
            <div className="flex items-center gap-3 text-primary mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <BookMarked className="h-6 w-6" />
              </div>
              <Text variant="label" className="font-bold tracking-widest uppercase">
                Financial Dictionary
              </Text>
            </div>
            <Text variant="h1" className="text-4xl lg:text-7xl font-bold tracking-tight">
              Terms, <span className="text-primary">A to Z</span>
            </Text>
            <Text variant="body" className="mt-6 text-muted-foreground text-xl leading-relaxed max-w-3xl">
              The complete Imperialpedia financial dictionary. Pick a letter to
              browse definitions and concepts that move markets — from core
              investing principles to advanced economic mechanics.
            </Text>
          </header>

          {/* A–Z index grid */}
          <nav
            aria-label="Browse dictionary by letter"
            className="mb-16 grid grid-cols-5 gap-3 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-9"
          >
            <Link
              href="/terms-beginning-with-num"
              aria-disabled={!populated.has("num")}
              className={
                tileBase +
                " " +
                (populated.has("num")
                  ? "border-primary/20 bg-primary/5 text-foreground hover:bg-primary hover:text-white"
                  : "pointer-events-none border-border bg-card/30 text-muted-foreground/40")
              }
            >
              0–9
            </Link>
            {ALPHABET.map((l) => {
              const active = populated.has(l);
              return (
                <Link
                  key={l}
                  href={`/terms-beginning-with-${l}`}
                  aria-disabled={!active}
                  className={
                    tileBase +
                    " " +
                    (active
                      ? "border-primary/20 bg-primary/5 text-foreground hover:bg-primary hover:text-white"
                      : "pointer-events-none border-border bg-card/30 text-muted-foreground/40")
                  }
                >
                  {l}
                </Link>
              );
            })}
          </nav>

          {/* Featured terms */}
          {featured.length > 0 && (
            <section aria-labelledby="featured-heading">
              <div className="mb-6 flex items-center gap-4">
                <Text
                  variant="label"
                  id="featured-heading"
                  className="font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Featured Definitions
                </Text>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              </div>
              <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
                {featured.map((term) => (
                  <li key={term.slug} className="bg-background">
                    <Link
                      href={termHref(term)}
                      className="group flex h-full items-start justify-between gap-3 p-6 transition-colors hover:bg-card/60"
                    >
                      <span className="text-base font-bold leading-snug text-foreground group-hover:text-primary">
                        {term.title}
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-all -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Container>
      </Section>
    </main>
  );
}
