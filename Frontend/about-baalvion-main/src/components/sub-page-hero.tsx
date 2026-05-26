
"use client"

import { cn } from "@/lib/utils"

interface SubPageHeroProps {
  category: string;
  title: string;
}

export function SubPageHero({ category, title }: SubPageHeroProps) {
  return (
    <section className="bg-black pt-48 pb-24 text-center">
      <div className="section-container">
        <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.4em] mb-6 block animate-fade-in">
          {category}
        </span>
        <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-0 animate-fade-in stagger-1">
          {title}
        </h1>
      </div>
    </section>
  );
}

export function SubPageContent({ children }: { children?: React.ReactNode }) {
  return (
    <section className="bg-white py-24 min-h-[400px]">
      <div className="section-container">
        {children || (
          <div className="max-w-3xl mx-auto text-center space-y-4 opacity-60 py-20">
            <h2 className="text-xl font-bold text-gray-900">Architecture in Progress</h2>
            <p className="text-sm text-gray-500">The strategic content for this section is currently being architected for deployment in the nexus registry.</p>
          </div>
        )}
      </div>
    </section>
  );
}
