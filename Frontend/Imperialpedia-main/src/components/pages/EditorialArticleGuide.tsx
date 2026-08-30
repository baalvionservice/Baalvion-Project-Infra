import Link from "next/link";
import { CheckCircle2, Bookmark, Share2, Clock, UserCheck } from "lucide-react";
import { KeyTakeawaysBox } from "@/components/pages/KeyTakeawaysBox";

interface Section {
  heading: string;
  body: string[];
}

interface EditorialArticleGuideProps {
  title?: string;
  categoryName?: string;
  keyTakeaways?: string[];
  sections?: Section[];
  introParagraphs?: string[];
}

/**
 * Authentic Newspaper / Financial Publication Editorial Guide Component.
 * Transforms generic boxy AI cards into an immersive, highly-readable
 * editorial reading experience with newspaper-grade typography,
 * byline credits, Key Takeaways callout, and clean article chapters.
 */
export function EditorialArticleGuide({
  title = "Comprehensive Guide & Core Principles",
  categoryName,
  keyTakeaways,
  sections,
  introParagraphs,
}: EditorialArticleGuideProps) {
  if (!keyTakeaways?.length && !sections?.length && !introParagraphs?.length) {
    return null;
  }

  return (
    <article className="w-full max-w-4xl mx-auto py-8">
      {/* Article Header & Editorial Meta */}
      <div className="border-b border-border/80 pb-6 mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[#1d4fc4]">
              {categoryName ? `${categoryName} Guide` : "Editorial Primer"}
            </span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> 8 min read
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <UserCheck className="h-4 w-4" />
            <span>Fact Checked &amp; Expert Reviewed</span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-snug">
          {title}
        </h2>
      </div>

      {/* ── Key Takeaways Callout (Investopedia Editorial Box with Coral Corner Brackets) ── */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <KeyTakeawaysBox items={keyTakeaways} />
      )}

      {/* ── Introductory Text ── */}
      {introParagraphs && introParagraphs.length > 0 && (
        <div className="space-y-5 my-6 text-base sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          {introParagraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}

      {/* ── Article Chapters / In-Depth Sections (Straight Newspaper Editorial Flow) ── */}
      {sections && sections.length > 0 && (
        <div className="space-y-12 my-10">
          {sections.map((section, idx) => (
            <section key={idx} className="space-y-4 pt-4 first:pt-0">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight border-b border-border/60 pb-2.5">
                {section.heading}
              </h3>
              <div className="space-y-4 text-base sm:text-[1.0625rem] text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                {section.body.map((paragraph, pIdx) => (
                  <p key={pIdx}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
