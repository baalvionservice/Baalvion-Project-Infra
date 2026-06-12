import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, ChevronRight, ChevronLeft } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { cmsGetArticles } from '@/lib/cms';
import { ArticleShare } from '../../[category]/[slug]/article-share';

const BASE_URL = 'https://about.baalvion.com';
const SITE_NAME = 'Baalvion Operating System (BOS)';
const PAGE_TITLE = 'What you need to know about Baalvion today';
const PAGE_DESC = 'The latest headlines and strategic briefings from Baalvion News — trade corridors, infrastructure, and AI updates across the Baalvion Operating System (BOS).';
const URL = `${BASE_URL}/news/updates/today`;
const OG_IMAGE = `${BASE_URL}/api/og?title=${encodeURIComponent(PAGE_TITLE)}&eyebrow=${encodeURIComponent('Baalvion News')}`;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: URL },
  openGraph: {
    type: 'article',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: URL,
    siteName: SITE_NAME,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: PAGE_TITLE }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [OG_IMAGE],
  },
};

export default async function TodayNewsPage() {
  const moreNews = (await cmsGetArticles('updates')).filter((a) => a.slug !== 'today').slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-48 pb-0">
        <div className="max-w-4xl mx-auto px-6 mb-24">
          {/* Main Headline */}
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#111111] leading-tight tracking-tight">
              What you need to know about Baalvion today
            </h1>
            <p className="text-xl text-gray-500 font-medium">
              Here are the latest headlines from Baalvion News
            </p>
          </div>

          {/* Share Button */}
          <div className="flex justify-end mb-8">
            <ArticleShare emailLabel="Email Article" />
          </div>

          {/* Author & Timestamp Section */}
          <div className="flex items-center justify-between py-8 border-y border-gray-100 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <Globe className="text-white w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-700">
                Written by <span className="text-[#007185]">Baalvion Staff</span>
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                Baalvion News
              </p>
              <p className="text-xs text-gray-400 font-medium">2 min read</p>
            </div>
          </div>

          {/* Article Content */}
          <div className="space-y-12 mb-20">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#007185]">
                Baalvion Trade Corridors expanded in Middle East
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                We are working closely with local authorities and prioritizing the safety of our personnel throughout our recovery efforts. We continue to support affected customers, helping them to migrate to alternate Baalvion Operating System (BOS) Nodes, with a large number already successfully operating their applications from other parts of the world.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#007185]">
                Baalvion satellite production to accelerate launch cadence
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Baalvion is accelerating satellite deployment with over 200 Baalvion Operating System (BOS) satellites now operational. The company has completed 11 launches in year one and plans to more than double its pace to 20+ missions in year two. Production capacity reaches 30 satellites weekly at the strategic facility, with hundreds flight-ready and six payloads stacked in Singapore totaling 200+ satellites.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#007185]">
                Baalvion AI scoring platform launches in UK
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                The United Kingdom is the first country in Europe to get Baalvion&apos;s next-generation AI scoring system. This platform provides real-time risk assessment and trade compliance intelligence for mid-market businesses.
              </p>
            </div>
          </div>

          {/* Newsletter Signup Section */}
          <div className="mt-20 pt-10 border-t border-gray-100">
            <div className="relative bg-white border border-gray-200 p-8 shadow-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF9900]" />
              <h3 className="text-2xl font-bold text-[#111111] mb-8">Sign up for the weekly Baalvion newsletter</h3>

              <div className="max-w-md">
                <form className="relative flex items-center group" action="/api/subscribe" method="post">
                  <input
                    type="email"
                    name="email"
                    aria-label="Email address"
                    placeholder="Enter email"
                    className="w-full border-b border-gray-300 py-3 text-lg outline-none focus:border-[#FF9900] transition-colors placeholder:text-gray-400"
                  />
                  <button type="submit" aria-label="Subscribe" className="absolute right-0 w-10 h-10 bg-[#FF9900] rounded-full flex items-center justify-center text-white transition-transform group-focus-within:scale-105 hover:bg-[#e68a00]">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </form>
                <div className="mt-3 flex gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <Link href="/privacy" className="hover:text-gray-600 underline">Baalvion Privacy Policy</Link>
                  <span>Opt out anytime</span>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-lg font-bold text-gray-900">
                Get more headlines from <Link href="/news/updates" className="text-[#007185] hover:underline">Baalvion News.</Link>
              </p>
            </div>
          </div>

          {/* Trending News Section */}
          <div className="mt-20">
            <div className="border-b border-gray-200 pb-3 mb-8">
              <h3 className="text-xl font-bold text-[#111111]">Trending news and stories</h3>
            </div>

            <ul className="space-y-6">
              {[
                "Baalvion's new automated customs clearance node goes live in Singapore",
                'How AI is transforming trade finance for mid-market exporters',
                'Everything you need to know about the Baalvion Operating System (BOS) Core upgrade',
                'Baalvion establishes new strategic trade corridor with Brazil',
                'Baalvion increases investment in green energy for industrial logistics',
              ].map((story, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="mt-2.5 w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0 group-hover:bg-[#FF9900]" />
                  <Link href="/news/updates" className="text-lg font-bold text-gray-700 leading-tight hover:text-[#007185] hover:underline transition-colors">
                    {story}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* More Baalvion News Section */}
        <section className="bg-[#F2F2F2] py-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#111111]">More Baalvion News</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-gray-400 px-2 uppercase tracking-widest">1 / 1</span>
                  <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {moreNews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {moreNews.map((news) => (
                  <Link key={news.id} href={`/news/${news.category}/${news.slug}`} className="group bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden transition-transform hover:-translate-y-1">
                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-50">
                      <Image
                        src={news.image}
                        alt={news.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold leading-tight text-gray-900 group-hover:text-[#007185] transition-colors line-clamp-3">
                          {news.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-medium">{news.date}</p>
                      </div>
                      <div className="mt-4">
                        <span className="inline-block px-2.5 py-1 bg-gray-100 border border-gray-200 rounded text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          {news.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
