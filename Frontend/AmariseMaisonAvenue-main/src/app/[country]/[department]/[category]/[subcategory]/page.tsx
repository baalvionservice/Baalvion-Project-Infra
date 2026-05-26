
'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PRODUCTS, DEPARTMENTS, CATEGORIES, formatPrice } from '@/lib/mock-data';
import { ProductCard } from '@/components/product/ProductCard';
import { ChevronRight, Filter, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function SubcategoryPage() {
  const { country, department, category, subcategory } = useParams();
  const countryCode = (country as string) || 'us';
  
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => 
      p.departmentId === department && 
      p.categoryId === category && 
      p.subcategoryId === subcategory
    );
  }, [department, category, subcategory]);

  const deptObj = DEPARTMENTS.find(d => d.id === department);
  const catObj = CATEGORIES.find(c => c.id === category);

  return (
    <div className="bg-ivory min-h-screen pb-40">
      <section className="relative h-[40vh] w-full flex items-end justify-center overflow-hidden">
        <Image src={`https://picsum.photos/seed/amarise-${subcategory}/2560/1440`} alt={subcategory as string} fill className="object-cover opacity-50 grayscale-[20%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ivory" />
        <div className="relative z-10 text-center space-y-4 pb-20">
          <h1 className="text-6xl font-headline font-bold text-gray-900 capitalize">{subcategory?.toString().replace(/-/g, ' ')}</h1>
          <p className="text-lg text-gray-500 font-light italic">Curated Artisanal Selection</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <nav className="flex items-center space-x-2 text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-bold mb-12">
          <Link href={`/${countryCode}`}>Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/${countryCode}/${department}`} className="capitalize">{department}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/${countryCode}/${department}/${category}`} className="capitalize">{catObj?.name}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum capitalize">{subcategory?.toString().replace(/-/g, ' ')}</span>
        </nav>

        <div className="flex justify-between items-center pb-6 border-b border-border mb-12">
          <span className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Showing {filteredProducts.length} Artifacts</span>
          <button className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors">
            <Filter className="w-3 h-3" /> <span>Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-40 text-center space-y-6">
            <Sparkles className="w-12 h-12 text-gold/30 mx-auto" />
            <p className="text-2xl text-muted-foreground font-light italic font-headline">New treasures are currently being prepared.</p>
          </div>
        )}
      </div>
    </div>
  );
}
