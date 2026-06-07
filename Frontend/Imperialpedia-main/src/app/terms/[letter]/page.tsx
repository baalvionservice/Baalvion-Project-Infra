import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/design-system/layout/container";
import { buildMetadata } from "@/lib/seo";
import { fetchTermsByLetter } from "@/lib/data/term-live";
import type { Term } from "@/lib/data/terms";

// Refresh published listings periodically without freezing them at build time.
export const revalidate = 300;

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const ALL_LETTERS = ["num", ...ALPHABET];

function letterLabel(letter: string): string {
  return letter === "num" ? "#" : letter.toUpperCase();
}

function isValidLetter(letter: string): boolean {
  return letter === "num" || /^[a-z]$/.test(letter);
}

/** Canonical detail URL for a term, derived from its title's first character. */
function termHref(term: Term): string {
  const firstChar = term.title.charAt(0).toLowerCase();
  const letter = /^[0-9]/.test(firstChar) ? "num" : firstChar;
  return `/terms/${letter}/${term.slug}`;
}

/** The plain term name — strip the descriptive ": Definition, …" SEO suffix. */
function shortLabel(title: string): string {
  const head = title.split(/\s[—–-]\s|:/)[0];
  return head.trim() || title.trim();
}

export function generateStaticParams() {
  return ALL_LETTERS.map((letter) => ({ letter }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter: raw } = await params;
  const letter = raw.toLowerCase();
  const label = letterLabel(letter);
  return buildMetadata({
    title: `Terms Beginning With '${label}'`,
    description: `Browse Imperialpedia's financial dictionary — expert-vetted definitions and concepts beginning with '${label}', indexed A–Z.`,
    canonical: `/terms-beginning-with-${letter}`,
  });
}

export default async function TermsByLetterPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter: raw } = await params;
  const letter = raw.toLowerCase();

  // Unknown letters are a genuine 404 — never a runtime error.
  if (!isValidLetter(letter)) notFound();

  const terms = (await fetchTermsByLetter(letter))
    .filter((t) => t?.title && t?.slug)
    .sort((a, b) =>
      a.title.localeCompare(b.title, "en", { sensitivity: "base" }),
    );

  const label = letterLabel(letter);

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-10 lg:py-14">
        {/* Heading — bold neutral sans, Investopedia dictionary style */}
        <h1 className="!font-ui mb-8 text-4xl font-extrabold tracking-tight text-foreground lg:text-[2.75rem]">
          Terms Beginning With &apos;{label}&apos;
        </h1>

        {/* Compact A–Z selector */}
        <nav
          aria-label="Browse dictionary by letter"
          className="mb-10 flex flex-wrap items-center gap-x-1 gap-y-2 border-y border-border py-3"
        >
          {ALL_LETTERS.map((l) => {
            const active = l === letter;
            return (
              <Link
                key={l}
                href={`/terms-beginning-with-${l}`}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded px-2 py-1 text-sm font-bold uppercase transition-colors " +
                  (active
                    ? "bg-primary text-white"
                    : "text-foreground/70 hover:bg-primary/10 hover:text-primary")
                }
              >
                {l === "num" ? "#" : l}
              </Link>
            );
          })}
        </nav>

        {/* Term list — four flowing columns of plain links */}
        {terms.length === 0 ? (
          <p className="py-10 text-muted-foreground">
            No definitions are indexed under &apos;{label}&apos; yet. Browse the{" "}
            <Link href="/terms" className="text-primary font-semibold hover:underline">
              full dictionary
            </Link>
            .
          </p>
        ) : (
          <div className="gap-x-10 sm:columns-2 lg:columns-4">
            {terms.map((term) => (
              <Link
                key={term.slug}
                href={termHref(term)}
                className="mb-3 block break-inside-avoid text-[15px] leading-snug text-foreground transition-colors visited:text-primary hover:text-primary hover:underline"
              >
                {shortLabel(term.title)}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
