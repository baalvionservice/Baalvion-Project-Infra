
"use client"

import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, ArrowLeft, ArrowRight, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";

// Mock helper to simulate blog post fetching
const getPostData = (slug: string) => {
  return {
    slug,
    title: slug.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category: "Market Insights",
    author: "Dr. Sarah Chen",
    date: "May 20, 2024",
    readTime: "8 min read",
    content: `
      <p className="text-lg leading-relaxed mb-6">The global mineral trade is currently undergoing a massive transformation driven by the demand for critical energy transition materials. In this deep dive, we explore how ${slug.replace(/-/g, ' ')} is impacting the industrial supply chain and what exporters need to prepare for in the next quarter.</p>
      <h2 className="text-2xl font-bold text-primary mb-4">Market Dynamics & Trends</h2>
      <p className="mb-6">Current data suggests that pricing volatility is stabilizing, providing a unique window for bulk procurement contracts. We've seen a 12% increase in regional demand for high-purity concentrates across the Asia Pacific corridor.</p>
      <h2 className="text-2xl font-bold text-primary mb-4">Strategic Recommendations</h2>
      <p className="mb-6">For mining companies, the focus should remain on technical grade consistency and automated compliance verification to minimize port-side delays. Buyers should look towards establishing long-term supply agreements to hedge against projected scarcity.</p>
    `,
    imageUrl: `https://picsum.photos/seed/${slug}/1200/600`
  };
};

export default function BlogPostPage() {
  const { slug: slugParam } = useParams();
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam || "article";
  const post = getPostData(slug);

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.imageUrl,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "GeoTrade Nexus",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mining.baalvion.com/logo.png"
      }
    },
    "datePublished": "2024-05-20",
    "dateModified": "2024-05-20"
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={blogSchema} />
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
              src={post.imageUrl} 
              alt={post.title} 
              fill 
              priority
              className="object-cover"
            />
          </div>

          <div className="prose prose-slate max-w-none prose-headings:text-primary prose-headings:font-headline">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
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

        {/* Dynamic Related Insights Section */}
        <section className="mt-16 space-y-8">
          <h3 className="text-2xl font-headline font-bold text-slate-900 uppercase italic tracking-tighter">Related <span className="text-primary">Analysis</span></h3>
          <div className="grid sm:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <Card key={i} className="border-none shadow-sm group hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                <div className="relative h-40 bg-slate-100">
                  <Image src={`https://picsum.photos/seed/insight-${i}/600/400`} alt="Related analysis" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <CardContent className="p-6 space-y-3">
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">Industry Update</Badge>
                  <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">Digital Transformation in Global Mining Operations</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">How automated compliance and real-time tracking are reducing trade friction.</p>
                  <Link href="/blog/digital-transformation" className="inline-flex items-center gap-2 text-xs font-bold text-primary pt-2">
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
