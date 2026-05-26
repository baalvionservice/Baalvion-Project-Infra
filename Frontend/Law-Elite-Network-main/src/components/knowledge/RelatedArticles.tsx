"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Article {
  id: string;
  title: string;
  category: string;
  author: string;
  slug: string;
  imageUrl: string;
}

const RELATED_ARTICLES: Article[] = [
  {
    id: 'rel_law_1',
    category: 'Corporate Law',
    title: "Foundations of Corporate Governance for Global Enterprises",
    author: 'Michael Ross',
    slug: 'corporate-governance-foundations',
    imageUrl: 'https://picsum.photos/seed/law-rel-1/400/260'
  },
  {
    id: 'rel_law_2',
    category: 'Litigation',
    title: "Navigating High-Stakes International Arbitration Protocols",
    author: 'Jessica Pearson',
    slug: 'international-arbitration-protocols',
    imageUrl: 'https://picsum.photos/seed/law-rel-2/400/260'
  },
  {
    id: 'rel_law_3',
    category: 'Intellectual Property',
    title: "Strategies for Securing Patents in the Global Marketplace",
    author: 'Louis Litt',
    slug: 'securing-global-patents',
    imageUrl: 'https://picsum.photos/seed/law-rel-3/400/260'
  },
  {
    id: 'rel_law_4',
    category: 'Technology Law',
    title: "The Future of AI Regulation and Algorithmic Accountability",
    author: 'Katrina Bennett',
    slug: 'ai-regulation-future',
    imageUrl: 'https://picsum.photos/seed/law-rel-4/400/260'
  },
  {
    id: 'rel_law_5',
    category: 'Business Law',
    title: "Strategic Frameworks for Complex Mergers & Acquisitions",
    author: 'Harvey Specter',
    slug: 'ma-strategic-frameworks',
    imageUrl: 'https://picsum.photos/seed/law-rel-5/400/260'
  },
  {
    id: 'rel_law_6',
    category: 'Criminal Law',
    title: "White Collar Crime: Defense Strategies for Executives",
    author: 'Robert Zane',
    slug: 'white-collar-defense-strategies',
    imageUrl: 'https://picsum.photos/seed/law-rel-6/400/260'
  },
  {
    id: 'rel_law_7',
    category: 'Real Estate Law',
    title: "Commercial Leasing Statutes for Emerging Tech Hubs",
    author: 'Donna Paulsen',
    slug: 'commercial-leasing-statutes',
    imageUrl: 'https://picsum.photos/seed/law-rel-7/400/260'
  },
  {
    id: 'rel_law_8',
    category: 'Taxation Law',
    title: "Cross-Border Tax Compliance for Multinational Entities",
    author: 'Samantha Wheeler',
    slug: 'cross-border-tax-compliance',
    imageUrl: 'https://picsum.photos/seed/law-rel-8/400/260'
  }
];

export function RelatedArticles() {
  return (
    <section className="pt-2 border-t-4 border-blue-600 mt-20 mb-24">
      <div className="container mx-auto px-0">
        <h2 className="text-3xl font-bold text-slate-900 mb-10 pt-4 px-2">Related Articles</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-2">
          {RELATED_ARTICLES.map((art) => (
            <Link key={art.id} href={`/article/${art.slug}`} className="group block h-full">
              <div className="bg-white border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                  <Image 
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    data-ai-hint="legal dossier"
                  />
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight mb-2">
                    {art.category}
                  </span>
                  
                  <h3 className="text-[17px] font-bold text-slate-900 leading-[1.3] mb-3 group-hover:text-blue-700 transition-colors line-clamp-3">
                    {art.title}
                  </h3>
                  
                  <p className="mt-auto pt-2 text-[12px] font-medium text-slate-400">
                    By <span className="hover:text-slate-600 transition-colors">{art.author}</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
