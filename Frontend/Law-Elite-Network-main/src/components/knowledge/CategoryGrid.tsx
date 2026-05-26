"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldAlert, 
  Users, 
  Lightbulb, 
  FileText, 
  Home, 
  Briefcase, 
  Globe, 
  Scale, 
  Banknote, 
  Leaf, 
  Cpu,
  ChevronRight
} from 'lucide-react';

interface CategoryGridProps {
  categories: any[];
}

/**
 * @fileOverview Premium Category Grid
 * Tactical discovery module for legal domains with mobile-optimized responsive grid.
 */
export function CategoryGrid({ categories }: CategoryGridProps) {
  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'building':
      case 'building2': return <Building2 className="w-6 h-6" />;
      case 'shield':
      case 'shieldalert': return <ShieldAlert className="w-6 h-6" />;
      case 'users': return <Users className="w-6 h-6" />;
      case 'lightbulb': return <Lightbulb className="w-6 h-6" />;
      case 'filetext': return <FileText className="w-6 h-6" />;
      case 'home': return <Home className="w-6 h-6" />;
      case 'briefcase': return <Briefcase className="w-6 h-6" />;
      case 'globe': return <Globe className="w-6 h-6" />;
      case 'scale': return <Scale className="w-6 h-6" />;
      case 'banknote': return <Banknote className="w-6 h-6" />;
      case 'leaf': return <Leaf className="w-6 h-6" />;
      case 'cpu': return <Cpu className="w-6 h-6" />;
      default: return <Scale className="w-6 h-6" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 animate-in fade-in duration-1000 px-4">
      {categories.map((cat, index) => (
        <Link 
          key={cat.id} 
          href={`/law/${cat.slug}`}
          className="group h-full"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="h-full bg-white border border-slate-100 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex flex-col group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 mb-6 md:mb-8 relative z-10 shadow-inner group-hover:shadow-blue-500/20">
              {getIcon(cat.icon || '')}
            </div>
            
            <div className="space-y-3 relative z-10 flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium italic">
                {cat.description}
              </p>
            </div>

            <div className="mt-8 md:mt-10 flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500 relative z-10">
              Explore Dossiers <ChevronRight className="ml-1 w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
