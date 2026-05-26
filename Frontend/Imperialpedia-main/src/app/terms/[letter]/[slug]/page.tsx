import BodyBlock from "@/components/ui/body-block";
import { getTermBySlug, getRelatedTerms } from "@/lib/data/utils";
import { buildMetadata } from "@/lib/seo";
import { terms } from "@/lib/data/terms";
import TableOfContents from "./components/TableOfContents";
import RelatedTerms from "./components/RelatedTerms";

export async function generateStaticParams() {
  return terms.map((term) => {
    const firstChar = term.title.charAt(0).toLowerCase();
    const letter = /^[0-9]/.test(firstChar) ? "num" : firstChar;

    return {
      letter,
      slug: term.slug,
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string; slug: string }>;
}) {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) return {};
  return buildMetadata({
    title: term.title,
    description: term?.seoDescription?.slice(0, 160) || "", // use first 160 chars of description for SEO
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ letter: string; slug: string }>;
}) {
  const { slug } = await params;
  const term = getTermBySlug(slug);

  if (!term) return <div>Not found</div>;

  // Extract headings for table of contents
  const headings = term.content.filter((block) => block.type === "heading");

  // Get related terms
  const relatedTerms = getRelatedTerms(slug, 16);

  return (
    <div className="min-h-screen flex flex-col gap-8 mx-auto max-w-7xl p-4 mt-16">
      {/* Table of Contents - Left Side */}
      <div className="flex">
        <TableOfContents headings={headings} />

        {/* Article Content - Right Side */}
        <div className="flex-1 max-w-3xl ">
          <h1 className="text-foreground text-3xl md:text-5xl font-extrabold mb-8 leading-tight tracking-wide">
            {term.title}
          </h1>
          <p className=" text-sm text-foreground/70">
            By{" "}
            <span className="underlined font-semibold text-foreground decoration-dotted uppercase tracking-wider ">
              {term.author}
            </span>
          </p>
          <div className="prose-none">
            {term.content.map((block, i) => (
              <BodyBlock key={i} block={block} />
            ))}
          </div>
        </div>
      </div>

      {/* Related Terms Section */}
      <RelatedTerms terms={relatedTerms} />
    </div>
  );
}
