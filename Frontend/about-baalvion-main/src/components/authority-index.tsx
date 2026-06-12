import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { SubPageHero } from '@/components/sub-page-hero';

export interface IndexItem {
  title: string;
  excerpt?: string;
  href: string;
  tag?: string;
}

interface AuthorityIndexProps {
  eyebrow: string;
  title: string;
  intro?: string;
  items: IndexItem[];
  emptyLabel?: string;
}

/** Listing grid for /services, /industries, /case-studies index pages. */
export function AuthorityIndex({ eyebrow, title, intro, items, emptyLabel }: AuthorityIndexProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <SubPageHero category={eyebrow} title={title} />
        <div className="section-container py-20">
          {intro && <p className="max-w-3xl text-lg text-gray-600 leading-relaxed mb-12">{intro}</p>}
          {items.length === 0 ? (
            <div className="py-24 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">{emptyLabel || 'Content is being published.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                >
                  {item.tag && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                      {item.tag}
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-[#111111] leading-snug group-hover:text-[#007185] transition-colors">
                    {item.title}
                  </h2>
                  {item.excerpt && (
                    <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-4 flex-1">{item.excerpt}</p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                    Read more
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
