import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/JsonLd";
import { cmsGetPosts, type MiningPost } from "@/lib/cms";

export const metadata: Metadata = {
  title: 'Trade Insights | Baalvion Mining Inc. Blog',
  description: 'Expert analysis on global mineral markets, mining compliance trends, and industrial supply chain innovation.',
};

// Always reflect the latest published content from the central CMS.
export const dynamic = 'force-dynamic';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Built-in seed content — used only when the central CMS has no posts / is offline.
const FALLBACK_POSTS: MiningPost[] = [
  { title: "The Rise of Critical Minerals in 2024", category: "Market Analysis", date: "May 12, 2024", author: "Dr. Sarah Chen", slug: "the-rise-of-critical-minerals-in-2024", excerpt: "Why lithium, cobalt, and rare earths are reshaping global supply chains.", image: "https://picsum.photos/seed/blog-0/1200/600", readTime: "5 min read", contentHtml: "" },
  { title: "AI in Mining: Beyond the Hype", category: "Technology", date: "May 10, 2024", author: "Marc Holden", slug: "ai-in-mining-beyond-the-hype", excerpt: "Where machine learning is genuinely moving the needle in mineral extraction.", image: "https://picsum.photos/seed/blog-1/1200/600", readTime: "6 min read", contentHtml: "" },
  { title: "Navigating Cross-Border Logistics", category: "Operations", date: "May 05, 2024", author: "James Miller", slug: "navigating-cross-border-logistics", excerpt: "A practical guide to customs, compliance, and clearing for mineral exporters.", image: "https://picsum.photos/seed/blog-2/1200/600", readTime: "4 min read", contentHtml: "" },
];

export default async function BlogPage() {
  const live = await cmsGetPosts();
  const posts: MiningPost[] = live.length > 0 ? live : FALLBACK_POSTS;

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Baalvion Mining Inc. Insights",
    "description": "Mining industry analysis and trade insights.",
    "blogPost": posts.map(p => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "author": { "@type": "Person", "name": p.author },
      "datePublished": p.date
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={blogSchema} />
      <Navbar />

      <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Trade Insights</h1>
          <p className="text-lg text-slate-500 mt-4 leading-relaxed">
            Market analysis, regulatory updates, and technology deep-dives from the leaders in global mineral trading.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, i) => {
            const slug = post.slug || slugify(post.title);
            return (
              <Link key={slug || i} href={`/blog/${slug}`} className="block">
                <Card className="border-none shadow-sm overflow-hidden group hover:shadow-xl transition-all cursor-pointer h-full">
                  <div className="relative h-48 bg-muted">
                    <Image
                      src={post.image || `https://picsum.photos/seed/blog-${i}/600/400`}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary">
                      {post.category}
                    </Badge>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>By {post.author}</span>
                      <span>{post.date}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
