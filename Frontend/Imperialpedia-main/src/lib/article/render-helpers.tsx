import Image from "next/image";
import type { NewsBodyBlock } from "@/lib/data.news";
import { linkEntitiesInText, type EntityLinkerState } from "@/lib/entityLinkInjector";

export function isValidIsoDate(value: string | undefined | null): value is string {
  return !!value && !Number.isNaN(Date.parse(value));
}

export function canonicalSegments(dateISO: string): { year: string; month: string; day: string } {
  const d = new Date(dateISO);
  return {
    year: String(d.getUTCFullYear()),
    month: String(d.getUTCMonth() + 1).padStart(2, "0"),
    day: String(d.getUTCDate()).padStart(2, "0"),
  };
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

// Google typically truncates meta descriptions past ~155-160 chars — clip at a
// word boundary instead of letting an arbitrary CMS excerpt run long and get
// cut mid-word in the SERP snippet.
export function truncateForMeta(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : maxLength - 1)}…`;
}

/**
 * Mirrors the heuristic in lib/seo/faq-extractor.ts (used by the content-engine
 * guide pipeline) but operates on the structured NewsBodyBlock[] callers already
 * have, instead of re-parsing HTML: a heading/subheading ending in "?" is a
 * question, the paragraph text immediately after it is the answer. Only returns
 * pairs when the article's own body is already shaped like FAQ content —
 * nothing here is generated or rewritten, just described to search engines.
 * Requires 2+ pairs (FAQPage schema needs real Q&A, not one stray question).
 */
export function extractFaqFromBlocks(body: NewsBodyBlock[]): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  let pendingQuestion: string | null = null;
  let pendingAnswer: string[] = [];

  const flush = () => {
    if (pendingQuestion && pendingAnswer.length) {
      const answer = pendingAnswer.join(" ").trim();
      if (answer.length >= 20) pairs.push({ question: pendingQuestion, answer });
    }
    pendingQuestion = null;
    pendingAnswer = [];
  };

  for (const block of body) {
    if (block.type === "heading" || block.type === "subheading") {
      flush();
      if (block.text.trim().endsWith("?")) pendingQuestion = block.text.trim();
      continue;
    }
    if (block.type === "paragraph" && pendingQuestion) {
      pendingAnswer.push(block.text);
    }
  }
  flush();

  return pairs.length >= 2 ? pairs.slice(0, 12) : [];
}

// Flattens an article body into plain readable text for the "Listen" (TTS)
// player — headings/paragraphs/quotes/callouts/list items in order; images
// and dividers contribute nothing since there's nothing to read aloud.
export function plainTextFromBody(body: NewsBodyBlock[]): string {
  return body
    .map((block) => {
      switch (block.type) {
        case "paragraph":
        case "heading":
        case "subheading":
        case "callout":
          return block.text;
        case "quote":
          return block.attribution ? `${block.text} — ${block.attribution}` : block.text;
        case "list":
          return block.items.join(". ");
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(". ");
}

// At most one <h2> per article (SEO: single-H2 hierarchy) — the page's own H1 is
// the title, so the first "heading" block stays H2 and every later one demotes to
// "subheading" (renders H3) rather than repeating H2 for each major section.
export function demoteExtraHeadings(body: NewsBodyBlock[]): NewsBodyBlock[] {
  let seenHeading = false;
  return body.map((block) => {
    if (block.type !== "heading") return block;
    if (!seenHeading) {
      seenHeading = true;
      return block;
    }
    return { ...block, type: "subheading" };
  });
}

// Shared body-block renderer — used by every article template (dated news,
// world/country news, ...) so a new block type or style tweak only needs to
// change once instead of drifting across near-identical copies per template.
export function BodyBlock({ block, linker }: { block: NewsBodyBlock; linker?: EntityLinkerState }) {
  const withLinks = (text: string) => (linker ? linkEntitiesInText(text, linker) : text);

  switch (block.type) {
    // Measured against Imperialpedia's article template (18px Lyon, line-height 29.88px,
    // 18px paragraph gap, near-black, in a 630px column). Ours was 17px sans at
    // 1.85 in an 872px column: a line of ~105 characters set airily, which is
    // what read as loose and unfinished. Serif body against sans furniture is
    // the pairing every broadsheet uses, and Source Serif 4 is already loaded
    // for headlines so this costs no extra font request.
    case "paragraph":
      return (
        <p className="font-headline text-foreground text-[1.125rem] leading-[1.66] mb-[1.125rem]">
          {withLinks(block.text)}
        </p>
      );

    case "heading":
      return (
        <h2 className="!font-news text-foreground text-[1.375rem] font-bold mt-9 mb-3 leading-tight tracking-tight">
          {block.text}
        </h2>
      );

    case "subheading":
      return (
        <h3 className="!font-news text-foreground text-[1.1875rem] font-bold mt-8 mb-2.5 leading-tight tracking-tight">
          {block.text}
        </h3>
      );

    case "quote":
      return (
        <blockquote className="my-8 pl-6 border-l-4 border-foreground">
          <p className="text-foreground text-xl font-medium leading-relaxed italic mb-2">
            &ldquo;{withLinks(block.text)}&rdquo;
          </p>
          {block.attribution && (
            <footer className="text-sm text-muted-foreground not-italic font-medium">
              — {block.attribution}
            </footer>
          )}
        </blockquote>
      );

    case "callout":
      return (
        <div className="my-7 rounded-xl bg-muted border border-border px-6 py-5">
          <p className="text-foreground text-[0.9375rem] leading-relaxed font-medium">
            {withLinks(block.text)}
          </p>
        </div>
      );

    case "list":
      return (
        <ul className="my-5 space-y-2 pl-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-foreground text-[1.0625rem] leading-relaxed"
            >
              <span className="mt-[0.4rem] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              {item}
            </li>
          ))}
        </ul>
      );

    case "image":
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={block.url}
              alt={block.caption ?? "Article illustration"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-xs text-muted-foreground text-center leading-relaxed">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}
