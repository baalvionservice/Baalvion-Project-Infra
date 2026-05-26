import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { getLawyersBySlug } from '@/services/seoService';
import { generateSEOContent } from '@/lib/seo/seoContent';
import LawyerCard from '@/components/cards/LawyerCard';
import { 
  Award, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  ChevronRight,
  Info,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SEOPageProps {
  params: { slug: string };
}

/**
 * Generates dynamic SEO metadata based on the URL context.
 */
export async function generateMetadata({ params }: SEOPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { type, value } = await getLawyersBySlug(slug);
  const seo = generateSEOContent(type, value);

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'website',
    },
  };
}

/**
 * @fileOverview Dynamic SEO Landing Page
 * Captures high-intent organic traffic for specific cities or categories.
 */
export default async function SEOLandingPage({ params }: SEOPageProps) {
  const { slug } = await params;
  const { type, lawyers, value } = await getLawyersBySlug(slug);
  const seo = generateSEOContent(type, value);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <header className="mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent bg-accent/10 px-2 py-1 rounded flex items-center gap-2">
              <Award className="w-3 h-3" />
              Verified Local Excellence
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          
          <h1 className="font-headline text-5xl md:text-7xl italic text-white leading-tight">
            {seo.heading}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mt-4 italic font-light">
            {seo.subheading}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main List */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Ranked Intelligence Matches
              </h2>
              <span className="text-[10px] text-accent font-bold uppercase tracking-widest flex items-center gap-1">
                Live Status <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lawyers.map((lawyer: any) => (
                <LawyerCard key={lawyer.id} lawyer={lawyer} />
              ))}
            </div>

            {/* Content Section for SEO Weight */}
            <section className="pt-16 mt-16 border-t border-white/5 space-y-8">
              <div className="glass-panel p-10 rounded-3xl border-white/5 bg-white/[0.02]">
                <h3 className="font-headline text-3xl italic text-white mb-6">Navigating Legal Excellence</h3>
                <p className="text-muted-foreground leading-relaxed italic mb-6">
                  In the complex landscape of legal advocacy, identifying specialized counsel is paramount. Our network connects discerning clients with {value} practitioners who have demonstrated an unwavering commitment to professional integrity and strategic success. Whether you are navigating {type === 'category' ? value : 'complex local'} statutes or seeking high-stakes litigation support, our practitioners offer the elite expertise your case demands.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mt-12">
                  {seo.faq.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-accent" /> {item.q}
                      </h4>
                      <p className="text-xs text-muted-foreground italic leading-relaxed pl-6">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Sidebar Discovery */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-accent/5">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Elite Standard</h4>
              </div>
              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                All practitioners in the {value} network have been rigorously audited for credentials, insurance, and professional standing.
              </p>
              <Button variant="outline" className="w-full mt-6 border-white/10 text-[9px] uppercase font-bold tracking-widest" asChild>
                <Link href="/register">Apply for Membership</Link>
              </Button>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Nearby Jurisdictions</h4>
              <div className="space-y-2">
                {['Mumbai', 'Pune', 'Bangalore'].map((city) => (
                  <Link 
                    key={city} 
                    href={`/lawyers/${city.toLowerCase()}`}
                    className="flex items-center justify-between text-xs text-white/60 hover:text-accent transition-colors group py-1"
                  >
                    <span>{city}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
