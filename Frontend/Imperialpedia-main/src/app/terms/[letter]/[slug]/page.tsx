import BodyBlock from "@/components/ui/body-block";
import { getRelatedTerms } from "@/lib/data/utils";
import { fetchTermBySlug } from "@/lib/data/term-live";
import { buildMetadata } from "@/lib/seo";
import { terms } from "@/lib/data/terms";
import TableOfContents from "./components/TableOfContents";
import RelatedTerms from "./components/RelatedTerms";
import { env } from "@/config/env";

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
  const { letter, slug } = await params;
  const term = await fetchTermBySlug(slug);
  if (!term) return {};
  return buildMetadata({
    title: term.title,
    description: term?.seoDescription?.slice(0, 160) || "",
    canonical: `/terms/${letter}/${slug}`,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ letter: string; slug: string }>;
}) {
  const { letter, slug } = await params;
  const term = await fetchTermBySlug(slug);

  if (!term) return <div>Not found</div>;

  // Extract headings for table of contents
  const headings = term.content.filter((block) => block.type === "heading");

  // Get related terms
  const relatedTerms = getRelatedTerms(slug, 16);

  const baseUrl = (env.siteUrl || 'https://imperialpedia.com').replace(/\/$/, '');
  const termUrl = `${baseUrl}/terms/${letter}/${slug}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: term.title,
    description: term.seoDescription?.slice(0, 200) || term.title,
    author: { '@type': 'Person', name: term.author },
    publisher: { '@type': 'Organization', name: 'Imperialpedia', url: baseUrl },
    url: termUrl,
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Terms', item: `${baseUrl}/terms` },
      { '@type': 'ListItem', position: 3, name: term.title, item: termUrl },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col gap-8 mx-auto max-w-7xl p-4 mt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
