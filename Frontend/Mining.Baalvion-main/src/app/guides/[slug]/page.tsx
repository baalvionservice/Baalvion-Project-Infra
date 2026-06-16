"use client"

import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Globe, ShieldCheck, ArrowLeft, ArrowRight, Share2, ClipboardCheck, History } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedProducts } from "@/components/marketplace/RelatedProducts";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { sanitizeRichHtml } from "@/lib/sanitize";

const getGuideData = (slug: string) => {
  return {
    slug,
    title: slug.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category: slug.includes('compliance') ? 'Compliance' : 'Logistics',
    author: "Nexus Strategy Team",
    date: "May 21, 2024",
    readTime: "12 min read",
    content: `
      <p className="text-lg leading-relaxed mb-6">Navigating the complexities of ${slug.replace(/-/g, ' ')} requires a deep understanding of international trade protocols and technical specifications. This handbook provides a comprehensive roadmap for verified exporters.</p>
      <h2 className="text-2xl font-bold text-primary mb-4">Regulatory Framework</h2>
      <p className="mb-6">Global standards for bulk mineral transit have evolved to prioritize automated compliance. Our research indicates that using electronic Bill of Lading systems reduces port-side delays by an average of 18.4%.</p>
      <div className="bg-slate-50 p-6 rounded-2xl border mb-8">
        <h3 className="font-bold text-slate-900 mb-2">Key Export Checkpoints:</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600">
          <li>Tier 3 Verified Mining License validation.</li>
          <li>Regional Sanctions cross-check via automated registry.</li>
          <li>Authorized third-party lab inspection by accredited agencies.</li>
        </ul>
      </div>
      <h2 className="text-2xl font-bold text-primary mb-4">Implementation Strategy</h2>
      <p className="mb-6">Strategic scaling in the ${slug.includes('lithium') ? 'Lithium' : 'Mineral'} market depends on maintaining consistent technical grades. Exporters should synchronize their production tracking with real-time marketplace demand heatmaps.</p>
    `,
    imageUrl: BRAND_IMAGES.guide
  };
};

export default function GuideDetailPage() {
  const { slug: slugParam } = useParams();
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam || "handbook";
  const guide = getGuideData(slug);

  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": guide.title,
    "image": guide.imageUrl,
    "author": { "@type": "Organization", "name": "Baalvion Mining Inc." },
    "publisher": { "@type": "Organization", "name": "Baalvion Mining Inc." },
    "datePublished": "2024-05-21",
    "about": "Industrial mineral trade and export compliance"
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={guideSchema} />
      <Navbar />
      
      <div className="bg-white border-b py-6">
        <div className="container px-4 md:px-8 max-w-5xl mx-auto">
          <Breadcrumbs 
            items={[
              { label: "Knowledge Hub", href: "/guides" },
              { label: guide.title, href: `/guides/${slug}` }
            ]} 
          />
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-5xl mx-auto py-12 flex-1">
        <div className="grid lg:grid-cols-4 gap-12">
          <article className="lg:col-span-3 space-y-8 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border">
            <header className="space-y-6">
              <Badge variant="outline" className="bg-secondary/10 text-primary border-secondary/30 font-bold px-3 py-1 uppercase tracking-widest text-[10px]">
                {guide.category} Report
              </Badge>
              <h1 className="text-4xl md:text-5xl font-headline font-bold text-slate-900 leading-tight">
                {guide.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium pt-6 border-t">
                <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> {guide.author}</span>
                <span className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Updated {guide.date}</span>
                <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {guide.readTime}</span>
              </div>
            </header>

            <div className="relative aspect-[21/9] rounded-3xl overflow-hidden shadow-xl border bg-muted">
              <Image 
                src={guide.imageUrl} 
                alt={`${guide.title} - Industrial Documentation`} 
                fill 
                priority
                className="object-cover"
              />
            </div>

            <div className="prose prose-slate max-w-none prose-headings:text-primary prose-headings:font-headline prose-p:leading-relaxed prose-p:text-slate-600">
              <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(guide.content) }} />
            </div>

            <footer className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <Button variant="outline" className="rounded-full gap-2 border-slate-200 font-bold text-xs uppercase px-6">
                <Share2 className="h-4 w-4" /> Share Guide
              </Button>
              <Link href="/guides">
                <Button variant="ghost" className="text-primary font-bold gap-2 group">
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Browse Hub
                </Button>
              </Link>
            </footer>
          </article>

          <aside className="lg:col-span-1 space-y-8">
            <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden sticky top-24">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-secondary" /> 
                  Related Action
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-xs opacity-70 leading-relaxed">
                  Implement the protocols described in this guide directly in your trade dashboard.
                </p>
                <Link href="/dashboard/compliance">
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold gap-2">
                    Verify Documents <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Knowledge Sources</h4>
              <div className="space-y-2">
                {[
                  { title: "Standard IncoTerms 2020", slug: "incoterms-standard" },
                  { title: "Port Latency Trends", slug: "port-latency" },
                ].map((s) => (
                  <Link key={s.slug} href={`/guides/${s.slug}`} className="block p-3 bg-white border rounded-xl hover:border-primary/30 transition-all group">
                    <p className="text-xs font-bold text-slate-700 group-hover:text-primary">{s.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-20">
          <RelatedProducts currentProductId="none" />
        </div>
      </main>
    </div>
  );
}
