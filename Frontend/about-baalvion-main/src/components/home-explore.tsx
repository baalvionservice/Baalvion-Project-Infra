import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cmsGetServices, cmsGetCaseStudies, cmsGetArticles } from '@/lib/cms';

/**
 * Homepage discovery band: passes link equity from the home page to the
 * services, case-study, and article hubs, and surfaces the latest items.
 * Server component; degrades to whatever the CMS currently has.
 */
export async function HomeExplore() {
  const [services, caseStudies, articles] = await Promise.all([
    cmsGetServices(),
    cmsGetCaseStudies(),
    cmsGetArticles(),
  ]);

  const topServices = services.slice(0, 6);
  const topCases = caseStudies.slice(0, 3);
  const topArticles = articles.slice(0, 4);

  if (topServices.length === 0 && topCases.length === 0 && topArticles.length === 0) return null;

  return (
    <section className="bg-white py-24 border-t border-gray-100">
      <div className="section-container space-y-20">
        {topServices.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">What we build</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-bold text-[#111111] tracking-tight">Services</h2>
              </div>
              <Link href="/services" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 hover:text-primary transition-colors">
                All services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topServices.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`} className="group rounded-xl border border-gray-100 p-6 hover:border-primary/40 hover:bg-gray-50 transition-colors">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#007185]">{s.title}</h3>
                  {s.excerpt && <p className="mt-2 text-sm text-gray-500 line-clamp-2">{s.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {topCases.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Proof of work</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-bold text-[#111111] tracking-tight">Case Studies</h2>
              </div>
              <Link href="/case-studies" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 hover:text-primary transition-colors">
                All case studies <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topCases.map((s) => (
                <Link key={s.slug} href={`/case-studies/${s.slug}`} className="group rounded-xl bg-[#151B24] p-6 hover:bg-black transition-colors">
                  <h3 className="font-bold text-white group-hover:text-primary">{s.title}</h3>
                  {s.excerpt && <p className="mt-2 text-sm text-gray-400 line-clamp-3">{s.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {topArticles.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Insights</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-bold text-[#111111] tracking-tight">From the Baalvion Journal</h2>
              </div>
              <Link href="/news" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 hover:text-primary transition-colors">
                All articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topArticles.map((a) => (
                <Link key={a.id} href={`/news/${a.category}/${a.slug}`} className="group rounded-xl border border-gray-100 p-6 hover:border-primary/40 hover:bg-gray-50 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{a.category}</span>
                  <h3 className="mt-2 font-bold text-gray-900 group-hover:text-[#007185] line-clamp-3">{a.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
