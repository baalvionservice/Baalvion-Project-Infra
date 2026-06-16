import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, ArrowLeft, ArrowRight, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { cmsGetPost, type MiningPost } from "@/lib/cms";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import DOMPurify from "isomorphic-dompurify";

// Reflect the latest published content from the central CMS on every request.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = rawSlug || "article";
  const post = (await cmsGetPost(slug)) ?? fallbackPost(slug);
  const description =
    post.excerpt ||
    `${post.title} — market insight and analysis from Baalvion Mining Inc.`;

  return {
    title: post.title,
    description,
    alternates: { canonical: `https://mining.baalvion.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description,
      url: `https://mining.baalvion.com/blog/${slug}`,
      siteName: "Baalvion Mining Inc.",
      type: "article",
      images: post.image ? [{ url: post.image }] : undefined,
    },
  };
}

// Fallback when the central CMS has no matching post (or is offline): synthesize
// a readable article from the slug so any URL still renders, preserving prior behavior.
function fallbackPost(slug: string): MiningPost {
  const title = slug
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const topic = slug.replace(/-/g, ' ');
  return {
    slug,
    title,
    category: "Market Insights",
    author: "Baalvion Mining Desk",
    date: "2026",
    readTime: "8 min read",
    excerpt: "",
    image: BRAND_IMAGES.insight,
    contentHtml: `
      <p>The global mineral trade is undergoing a major transformation driven by demand for critical energy-transition materials. In this deep dive we explore how ${topic} is impacting the industrial supply chain and what exporters need to prepare for in the next quarter.</p>
      <h2>Market Dynamics &amp; Trends</h2>
      <p>Current data suggests pricing volatility is stabilizing, providing a window for bulk procurement contracts. Regional demand for high-purity concentrates across the Asia Pacific corridor is up double digits.</p>
      <h2>Strategic Recommendations</h2>
      <p>For mining companies, the focus should remain on technical-grade consistency and automated compliance verification to minimize port-side delays. Buyers should establish long-term supply agreements to hedge against projected scarcity.</p>
    `,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug || "article";
  const post = (await cmsGetPost(slug)) ?? fallbackPost(slug);

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.image,
    "author": { "@type": "Person", "name": post.author },
    "publisher": {
      "@type": "Organization",
      "name": "Baalvion Mining Inc.",
      "logo": { "@type": "ImageObject", "url": "https://mining.baalvion.com/logo.svg" },
    },
    "datePublished": post.date,
    "url": `https://mining.baalvion.com/blog/${slug}`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Insights", "item": "https://mining.baalvion.com/blog" },
      { "@type": "ListItem", "position": 2, "name": post.title, "item": `https://mining.baalvion.com/blog/${slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={blogSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Navbar />

      <div className="bg-white border-b py-6">
        <div className="container px-4 md:px-8 max-w-4xl mx-auto">
          <Breadcrumbs
            items={[
              { label: "Insights", href: "/blog" },
              { label: post.title, href: `/blog/${slug}` }
            ]}
          />
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-4xl mx-auto py-12 flex-1">
        <article className="space-y-8 bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border">
          <header className="space-y-6">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1 uppercase tracking-widest text-[10px]">
              {post.category}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-slate-900 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium pt-2 border-t border-slate-100 mt-6 pt-6">
              <span className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {post.author}</span>
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {post.date}</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {post.readTime}</span>
            </div>
          </header>

          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-xl border">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="prose prose-slate max-w-none prose-headings:text-primary prose-headings:font-headline">
            {/* Body is admin-authored in the central Baalvion CMS (trusted source). */}
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.contentHtml) }} />
          </div>

          <footer className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex gap-4">
              <Button variant="outline" className="rounded-full gap-2 border-slate-200">
                <Share2 className="h-4 w-4" /> Share Article
              </Button>
            </div>
            <div className="flex gap-4">
              <Link href="/blog">
                <Button variant="ghost" className="text-primary font-bold gap-2">
                  <ArrowLeft className="h-4 w-4" /> All Insights
                </Button>
              </Link>
            </div>
          </footer>
        </article>

        {/* Related Insights */}
        <section className="mt-16 space-y-8">
          <h3 className="text-2xl font-headline font-bold text-slate-900 uppercase italic tracking-tighter">Related <span className="text-primary">Analysis</span></h3>
          <div className="grid sm:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <Card key={i} className="border-none shadow-sm group hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                <div className="relative h-40 bg-slate-100">
                  <Image src={BRAND_IMAGES.insight} alt="Related analysis" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <CardContent className="p-6 space-y-3">
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">Industry Update</Badge>
                  <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">Digital Transformation in Global Mining Operations</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">How automated compliance and real-time tracking are reducing trade friction.</p>
                  <Link href="/blog/digital-transformation-in-global-mining-operations" className="inline-flex items-center gap-2 text-xs font-bold text-primary pt-2">
                    Read Analysis <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
