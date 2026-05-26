import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/JsonLd";
import { BookOpen, ArrowRight, FileText, Globe, ShieldCheck } from "lucide-react";
import { guides } from "@/lib/sitemap-data";

export const metadata: Metadata = {
  title: 'Industrial Knowledge Hub | GeoTrade Nexus Guides',
  description: 'Expert guides on mineral export compliance, purity standards, and global trade logistics. Stay informed with technical industry knowledge.',
};

export default function GuidesPage() {
  const guideList = guides.map(g => ({
    ...g,
    title: g.slug.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    cat: g.slug.includes('compliance') ? 'Compliance' : g.slug.includes('logistics') ? 'Logistics' : 'Market Analysis'
  }));

  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "GeoTrade Nexus Knowledge Hub",
    "description": "A collection of industrial guides and market reports for the mining sector.",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": guideList.map((g, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://mining.baalvion.com/guides/${g.slug}`
      }))
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={hubSchema} />
      <Navbar />
      
      <div className="bg-primary py-20 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 p-12 opacity-10">
          <BookOpen className="h-64 w-64" />
        </div>
        <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 uppercase font-black tracking-widest text-[10px]">Technical Knowledge Base</Badge>
          <h1 className="text-4xl md:text-6xl font-headline font-bold leading-tight">Knowledge Hub</h1>
          <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
            Deep-dive industrial reports and regulatory guides to streamline your global trade operations.
          </p>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-16 flex-1">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guideList.map((guide, i) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`}>
              <Card className="border-none shadow-sm hover:shadow-xl transition-all h-full group overflow-hidden bg-white">
                <div className="relative h-40 bg-muted">
                  <Image 
                    src={`https://picsum.photos/seed/${guide.slug}/600/400`} 
                    alt={guide.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-primary font-bold uppercase text-[9px] tracking-widest">{guide.cat}</Badge>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3">
                    In-depth analysis of technical standards and export requirements for high-purity industrial materials in the current global market.
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Updated: {guide.lastMod}</span>
                    <Button variant="ghost" size="sm" className="text-primary font-bold gap-2 p-0 h-auto hover:bg-transparent">
                      Read Guide <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Pagination Placeholder */}
        <div className="flex justify-center pt-16">
          <Button variant="outline" className="px-12 border-slate-200 font-bold text-slate-500">
            View More Reports
          </Button>
        </div>
      </main>
    </div>
  );
}
