'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { 
  ChevronLeft, 
  Share2, 
  Bookmark, 
  Heart, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Copy, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * JournalArticlePage: High-authority editorial content.
 * Features advanced JSON-LD for Article and News discovery.
 */
export default function JournalArticlePage() {
  const { id, country } = useParams();
  const { editorials, products, socialMetrics, toggleLike, trackShare, wishlist } = useAppStore();
  const { toast } = useToast();
  const countryCode = (country as string) || 'us';
  
  const article = editorials.find(ed => ed.id === id);
  const featured = products.filter(p => article?.featuredProducts.includes(p.id));
  const metrics = socialMetrics[id as string] || { likes: 0, shares: 0, engagementRate: 0 };
  const isLiked = wishlist.some(w => w.id === id);

  if (!article) {
    return <div className="py-40 text-center font-headline text-3xl">Article not found in the archives.</div>;
  }

  const handleToggleLike = () => {
    toggleLike(article.id, countryCode);
    toast({
      title: isLiked ? "Mark Cleared" : "Article Appreciated",
      description: isLiked ? "Your mark has been removed from the registry." : "The Maison appreciates your intellectual interest.",
    });
  };

  const handleShare = (platform: string) => {
    trackShare(article.id, countryCode);
    toast({
      title: `Shared to ${platform}`,
      description: "Expanding the Maison's digital reach.",
    });
  };

  return (
    <div className="animate-fade-in bg-white">
      {/* SEO Metadata Structured Data: Article Authority */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "description": article.metaDescription || article.excerpt,
            "image": [article.imageUrl],
            "datePublished": article.date,
            "author": [{ "@type": "Person", "name": article.author }],
            "publisher": { "@type": "Organization", "name": "AMARISÉ MAISON AVENUE", "logo": { "@type": "ImageObject", "url": "https://picsum.photos/seed/logo/200/200" } }
          })
        }}
      />

      {/* Cinematic Hero */}
      <section className="relative h-[85vh] w-full flex items-end overflow-hidden border-b border-border bg-ivory">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
           <span className="text-[20vw] font-headline font-bold text-black tracking-widest uppercase">{article.category.charAt(0)}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
        <div className="container mx-auto px-12 pb-24 relative z-10 max-w-[1600px]">
          <Link href={`/${countryCode}/journal`} className="inline-flex items-center text-[10px] tracking-[0.5em] uppercase text-black hover:text-plum transition-colors mb-16 font-bold">
            <ChevronLeft className="w-3.5 h-3.5 mr-2" /> Back to The Journal
          </Link>
          <div className="space-y-10 max-w-6xl">
            <div className="flex items-center space-x-10">
              <span className="text-secondary text-xs font-bold tracking-[0.6em] uppercase px-5 py-2 border border-secondary/30 bg-white/50 backdrop-blur-sm">
                {article.category}
              </span>
              <span className="text-gray-400 text-[10px] uppercase tracking-[0.4em] font-bold">{article.date}</span>
            </div>
            <h1 className="text-7xl md:text-[120px] font-headline font-bold text-gray-900 leading-[0.85] tracking-tighter italic">
              {article.title}
            </h1>
            <p className="text-2xl md:text-3xl text-gray-500 font-light italic max-w-4xl leading-relaxed">
              {article.excerpt}
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-12 py-40 max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-32">
          {/* Metadata Sidebar */}
          <aside className="lg:col-span-3 space-y-16">
             <div className="space-y-8 pb-16 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                   <div className="w-14 h-14 bg-ivory border border-secondary/20 rounded-full flex items-center justify-center font-headline text-2xl font-bold italic text-secondary">
                     {article.author.charAt(0)}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Curated By</span>
                      <span className="text-sm font-bold uppercase text-black">{article.author}</span>
                   </div>
                </div>
                <div className="flex flex-col space-y-4 pt-4">
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>Appreciation</span>
                      <span className="text-black tabular">{metrics.likes.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>Collective Resonance</span>
                      <span className="text-black tabular">{metrics.shares.toLocaleString()}</span>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary">In This Volume</h4>
                <ul className="space-y-6">
                   {(article.contentOutline || ['The Heritage of Craft', 'Modern Market Dynamics', 'The Collector Perspective']).map((item, i) => (
                     <li key={i} className="group cursor-pointer">
                        <div className="flex items-center space-x-4 border-b border-gray-50 pb-4 group-hover:border-plum transition-colors">
                           <span className="text-[10px] font-bold text-gray-300">0{i+1}</span>
                           <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 group-hover:text-black transition-colors">{item}</span>
                        </div>
                     </li>
                   ))}
                </ul>
             </div>

             <div className="bg-ivory p-10 border border-border space-y-8 shadow-sm">
                <div className="flex items-center space-x-3 text-secondary">
                   <Sparkles className="w-5 h-5" />
                   <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-plum">Atelier Dialogue</span>
                </div>
                <p className="text-xs font-light italic leading-relaxed text-gray-600">
                  Should this narrative resonate with your private collection strategy, our senior curators are available for consultation.
                </p>
                <Link href={`/${countryCode}/contact`}>
                   <Button variant="outline" className="w-full rounded-none border-black text-[9px] font-bold tracking-[0.4em] uppercase h-14 hover:bg-black hover:text-white transition-all">
                     Consult Specialist
                   </Button>
                </Link>
             </div>
          </aside>

          {/* Main Narrative Body */}
          <div className="lg:col-span-9 space-y-32">
             <article className="prose prose-2xl max-w-none font-light leading-relaxed text-gray-700 whitespace-pre-wrap selection:bg-plum/10 first-letter:text-[120px] first-letter:font-headline first-letter:text-black first-letter:float-left first-letter:mr-8 first-letter:mt-6 italic">
               {article.content}
             </article>

             <div className="space-y-24 border-t border-gray-100 pt-32">
                <div className="flex flex-col items-center text-center space-y-6">
                   <div className="inline-flex items-center justify-center p-4 bg-ivory rounded-full shadow-inner">
                      <BookOpen className="w-8 h-8 text-secondary" />
                   </div>
                   <h2 className="text-5xl font-headline font-bold italic tracking-tight">Shop the Narrative</h2>
                   <p className="text-gray-400 text-[10px] uppercase tracking-[0.5em] font-bold">Curated Artifacts from the Atelier</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                  {featured.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
             </div>

             <div className="flex flex-col sm:flex-row justify-between items-center py-12 border-y border-gray-100 gap-8">
                <div className="flex items-center space-x-12">
                   <button 
                    onClick={handleToggleLike}
                    className={cn("flex flex-col items-center space-y-2 group transition-colors", isLiked ? "text-plum" : "text-gray-400")}
                   >
                      <Heart className={cn("w-6 h-6 transition-transform group-hover:scale-110", isLiked && "fill-current")} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Appreciate</span>
                   </button>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <button className="flex flex-col items-center space-y-2 text-gray-400 hover:text-plum transition-colors group">
                            <Share2 className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Resonance</span>
                         </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="bg-white border-border w-56 p-2 rounded-none shadow-2xl">
                         <DropdownMenuItem className="p-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-ivory" onClick={() => handleShare('Facebook')}>
                           <Facebook className="w-4 h-4 mr-4" /> Facebook
                         </DropdownMenuItem>
                         <DropdownMenuItem className="p-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-ivory" onClick={() => handleShare('Twitter')}>
                           <Twitter className="w-4 h-4 mr-4" /> Twitter
                         </DropdownMenuItem>
                         <DropdownMenuItem className="p-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-ivory" onClick={() => handleShare('LinkedIn')}>
                           <Linkedin className="w-4 h-4 mr-4" /> LinkedIn
                         </DropdownMenuItem>
                         <DropdownMenuItem className="p-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-ivory" onClick={() => handleShare('Copy Link')}>
                           <Copy className="w-4 h-4 mr-4" /> Copy Link
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>
                <div className="flex items-center space-x-4">
                   <Bookmark className="w-5 h-5 text-gray-300 cursor-pointer hover:text-plum transition-colors" />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Save to Private Archive</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section className="bg-ivory py-48 border-t border-border overflow-hidden">
        <div className="container mx-auto px-12 max-w-[1600px] flex flex-col lg:flex-row justify-between items-center gap-24 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
             <span className="text-[30vw] font-headline font-bold text-black italic">Next</span>
          </div>
          <div className="space-y-6 text-center lg:text-left relative z-10">
            <h4 className="text-[10px] font-bold tracking-[0.6em] uppercase text-secondary">Up Next in The Journal</h4>
            <h3 className="text-6xl md:text-8xl font-headline font-bold italic tracking-tighter leading-none text-gray-900">
              The Architecture <br /> of Silence
            </h3>
          </div>
          <div className="relative z-10">
            <Link href={`/${countryCode}/journal`}>
              <Button className="h-20 px-20 rounded-none bg-black text-white hover:bg-plum transition-all text-[11px] font-bold tracking-[0.5em] uppercase shadow-2xl">
                Explore More Stories
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
