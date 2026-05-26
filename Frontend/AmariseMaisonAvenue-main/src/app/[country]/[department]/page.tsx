'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { DEPARTMENTS, CATEGORIES, PRODUCTS } from '@/lib/mock-data';
import { ProductCard } from '@/components/product/ProductCard';
import { ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DepartmentPage() {
  const { country, department } = useParams();
  const countryCode = (country as string) || 'us';
  const deptObj = DEPARTMENTS.find(d => d.id === department);

  const deptCategories = CATEGORIES.filter(c => c.departmentId === department);
  const featuredProducts = PRODUCTS.filter(p => p.departmentId === department).slice(0, 8);

  if (!deptObj) return <div className="py-40 text-center">Department not found.</div>;

  return (
    <div className="bg-ivory pb-40">
      <section className="relative h-[70vh] w-full flex items-center justify-center overflow-hidden bg-muted">
        {/* Banner Card Box Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
           <span className="text-[20vw] font-headline font-bold uppercase tracking-widest text-gray-900">{deptObj.name.charAt(0)}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-ivory" />
        <div className="relative z-10 text-center space-y-8 max-w-5xl px-6">
          <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-widest uppercase text-muted-foreground mb-8">
            <Link href={`/${countryCode}`} className="hover:text-primary">Maison</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-bold">{deptObj.name}</span>
          </nav>
          <h1 className="text-7xl md:text-9xl font-headline font-bold text-gray-900 leading-tight italic">{deptObj.name}</h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light italic max-w-3xl mx-auto">{deptObj.description}</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 space-y-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {deptCategories.map(cat => (
            <Link key={cat.id} href={`/${countryCode}/${department}/${cat.id}`} className="group relative aspect-[16/9] overflow-hidden bg-white shadow-luxury">
              {/* Category Card Box Placeholder */}
              <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-bold tracking-[0.4em] text-gray-300 uppercase transition-all duration-[2s] group-hover:scale-105 group-hover:bg-ivory">
                {cat.name} Gallery
              </div>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white">
                <h3 className="text-4xl font-headline font-bold italic mb-4">{cat.name}</h3>
                <div className="flex items-center text-white text-[10px] font-bold tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  Enter Gallery <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <section className="space-y-20">
          <div className="text-center space-y-4">
            <Sparkles className="w-10 h-10 text-gold mx-auto mb-4" />
            <h2 className="text-5xl font-headline font-bold italic text-gray-900">Department Masterpieces</h2>
            <p className="text-gray-400 text-xs uppercase tracking-[0.4em] font-bold">Curated from the Global Ateliers</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
