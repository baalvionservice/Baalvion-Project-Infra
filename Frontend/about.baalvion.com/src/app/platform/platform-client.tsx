"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Page } from "@/lib/db";
import { Loader2, Database, Shield, Zap, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PopulatedPage extends Page {
  sectionData: any[];
}

export default function PlatformClient() {
  const [pageData, setPageData] = useState<PopulatedPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages?slug=platform')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setPageData(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !pageData) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-gray-400">Syncing Core Layers...</p>
      </div>
    </div>
  );

  // Safe access to sectionData with fallback to empty array
  const sections = pageData?.sectionData || [];
  const featuresSection = sections.find(s => s.type === 'cards');

  const getIcon = (title: string = "") => {
    const t = title.toLowerCase();
    if (t.includes('ledger') || t.includes('infrastructure')) return <Database className="w-8 h-8" />;
    if (t.includes('compliance') || t.includes('security')) return <Shield className="w-8 h-8" />;
    if (t.includes('clearing') || t.includes('engine')) return <Zap className="w-8 h-8" />;
    return <Globe className="w-8 h-8" />;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-40 pb-24">
        <div className="section-container">
          <div className="max-w-4xl mb-20 animate-fade-in">
            <span className="section-label">Technology & Infrastructure</span>
            <h1 className="text-gray-900 mb-8 leading-[1.1] tracking-tight">
              Nexus <span className="text-primary">Core</span> Architecture
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
              {featuresSection?.description || "Architecting the foundational layer for global trade with enterprise-grade reliability and modular scalability."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuresSection?.data?.features?.map((f: any, i: number) => (
              <Card key={i} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg group overflow-hidden">
                <div className="h-1.5 w-full bg-gray-50 group-hover:bg-primary transition-colors" />
                <CardContent className="p-10 space-y-8">
                  <div className="w-16 h-16 bg-primary/5 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {getIcon(f.title)}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{f.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}