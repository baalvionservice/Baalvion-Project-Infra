
"use client"

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";
import { Globe, Shield, Target } from "lucide-react";

export default function CompanyClient() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <SubPageHero category="Corporate" title="What We Do" />
        <SubPageContent>
          <div className="space-y-32">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <p className="text-2xl md:text-3xl text-gray-800 leading-relaxed font-light">
                We are architecting the foundational layer for the next century of international commerce, bridging the gap between legacy systems and future automation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                { icon: Globe, title: 'Unmatched Reach', desc: 'Operating across 180+ jurisdictions with localized intelligence and legal mapping.' },
                { icon: Shield, title: 'Integrity First', desc: 'A culture rooted in transparency, compliance, and absolute accountability.' },
                { icon: Target, title: 'Strategic Scale', desc: 'Focusing on deep infrastructure that transforms how the world moves value.' },
              ].map((item, i) => (
                <div key={i} className="bg-white p-12 rounded-2xl space-y-8 border border-gray-100 group hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-primary/10">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 text-base leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SubPageContent>
      </main>
      <Footer />
    </div>
  );
}
