"use client"

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { EcosystemItem } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight, Database, BrainCircuit, Globe, Scale, Workflow } from "lucide-react";

export default function EcosystemClient() {
  const [items, setItems] = useState<EcosystemItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ecosystem')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  const getIcon = (layer: string) => {
    switch (layer) {
      case 'Infrastructure': return <Database className="w-10 h-10" />;
      case 'Intelligence': return <BrainCircuit className="w-10 h-10" />;
      case 'Governance': return <Scale className="w-10 h-10" />;
      case 'Finance': return <Globe className="w-10 h-10" />;
      case 'Commerce': return <Workflow className="w-10 h-10" />;
      default: return <Globe className="w-10 h-10" />;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Syncing Architecture Registry...</p>
      </div>
    </div>
  );

  const layers = Array.from(new Set(items.map(i => i.layer)));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-48 pb-32">
        <div className="section-container">
          <div className="max-w-4xl mb-24 space-y-8 animate-fade-in">
            <span className="section-label">Nexus Architecture</span>
            <h1 className="text-gray-900 mb-6 font-bold leading-tight">
              Operational <br/>Nexus Layers
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
              A standardized blueprint of the Baalvion Nexus, architected for transparency, scalability, and modular integration across global markets.
            </p>
          </div>

          <div className="layout-stack">
            {layers.map((layer) => (
              <div key={layer} className="space-y-12 animate-fade-in">
                <div className="flex items-center gap-8">
                  <div className="w-1.5 h-12 bg-primary rounded-full" />
                  <h2 className="mb-0 uppercase tracking-widest text-2xl md:text-3xl font-bold text-gray-900">{layer} Layer</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {items.filter(i => i.layer === layer).map((item) => (
                    <Card key={item.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-xl group overflow-hidden">
                      <CardContent className="p-10 space-y-10 flex flex-col h-full">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-primary border border-gray-100 transition-all duration-500 group-hover:bg-primary group-hover:text-white">
                          {getIcon(item.layer)}
                        </div>
                        <div className="space-y-4 flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{item.name}</h3>
                          <p className="text-base text-gray-500 leading-relaxed">{item.description}</p>
                        </div>
                        {item.domain && (
                          <div className="pt-8 flex items-center justify-between border-t border-gray-50">
                            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{item.domain}</span>
                            <button className="flex items-center text-[10px] font-bold text-primary uppercase tracking-widest hover:text-gray-900 transition-all">
                              Protocol Specs <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
