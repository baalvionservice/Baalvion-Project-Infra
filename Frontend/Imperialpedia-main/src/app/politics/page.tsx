import Image from "next/image";
import Link from "next/link";
import { generateMockNews } from "@/data/mockNews";
import ExpandingOpportunities from "@/components/news/ExpandingOpportunities";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";


export const metadata: Metadata = buildMetadata({
  title: 'Politics',
  description: 'Politics news and analysis from Imperialpedia.',
  canonical: '/politics',
});


export default function LatestNewsPage() {
  const newsData = generateMockNews(1, 20);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} MIN AGO`;
    if (diffInHours < 24)
      return `${diffInHours} HOUR${diffInHours > 1 ? "S" : ""} AGO`;
    return date
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();
  };

  const heroStory = newsData[0];
  const rightStory = newsData[1];
  const midCards = newsData.slice(2, 5); // image + cat + title + author
  const imageTextRow = newsData.slice(5, 8); // image + cat + title + time
  const trendingItems = newsData.slice(0, 5); // 5-column trending

  return (
    <div className="min-h-screen bg-white mt-12 w-full overflow-x-hidden">
      {/* ── Header ── */}

      <div className="text-center pt-4 mb-4 border-b-[3px] border-yellow-400 px-3">
        <h1 className="text-base sm:text-lg font-extrabold tracking-[0.15em] sm:tracking-[2px] uppercase text-[#0a2756] pb-2">
          Politics
        </h1>
      </div>
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pb-12 w-full">
        {/* ── Top: hero 2/3 | right story 1/3 (stacked on small screens) ── */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 md:gap-3 mb-4">
          {heroStory && (
            <div className="min-w-0">
              <Link href={heroStory.url} className="group block">
                <div className="aspect-video relative overflow-hidden w-full rounded-sm">
                  <Image
                    src={heroStory.image}
                    alt={heroStory.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                    priority
                  />
                </div>
                <h2 className="text-[15px] sm:text-[17px] font-bold leading-snug text-black group-hover:text-[#1565c0] mt-2 mb-1.5">
                  {heroStory.title}
                </h2>
              </Link>
              <span className="text-[11px] font-bold text-[#0a6bb5] mr-1.5">
                {heroStory.source}
              </span>
              <span className="text-[11px] text-gray-500 uppercase">
                {formatDate(heroStory.publishedAt)}
              </span>
            </div>
          )}

          {rightStory && (
            <div className="min-w-0 border-t border-gray-200 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-3">
              <Link href={rightStory.url} className="group block">
                <div className="aspect-video md:h-[270px] md:aspect-auto relative overflow-hidden w-full rounded-sm">
                  <Image
                    src={rightStory.image}
                    alt={rightStory.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 280px"
                  />
                </div>

                <span className="text-[13px] sm:text-[14px] pt-2 font-bold leading-snug text-black group-hover:text-[#1565c0] block">
                  {rightStory.title}
                </span>
              </Link>
              <div className="mt-1.5">
                <span className="text-[11px] font-bold text-[#0a6bb5] mr-1.5">
                  {rightStory.source}
                </span>
                <span className="text-[11px] text-gray-500 uppercase">
                  {formatDate(rightStory.publishedAt)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Mid row: 3 image cards with author ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 border-t border-gray-200 pt-4">
          {midCards.map((article) => (
            <div key={article.id} className="min-w-0">
              <Link href={article.url} className="group block">
                <div className="aspect-video relative overflow-hidden w-full mb-1.5 rounded-sm">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
                  />
                </div>
                <span className="text-[9px] font-bold text-[#0a6bb5] uppercase tracking-[0.5px] mb-1 block">
                  {article.category}
                </span>
                <h3 className="text-[13px] font-bold leading-snug text-black group-hover:text-[#1565c0] mb-1">
                  {article.title}
                </h3>
              </Link>
              <span className="text-[10px] font-bold text-[#0a6bb5] mr-1">
                {article.source}
              </span>
              <span className="text-[10px] text-gray-500 uppercase">
                {formatDate(article.publishedAt)}
              </span>
            </div>
          ))}
        </div>

        {/* ── Second image row: image + category + title + time ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 border-t border-gray-200 pt-4 mt-4">
          {imageTextRow.map((article) => (
            <div key={article.id} className="min-w-0">
              <Link href={article.url} className="group block">
                <div className="aspect-video relative overflow-hidden w-full mb-1.5 rounded-sm">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
                  />
                </div>
                <span className="text-[9px] font-bold text-[#0a6bb5] uppercase tracking-[0.5px] mb-1 block">
                  {article.category}
                </span>
                <h3 className="text-[13px] font-bold leading-snug text-black group-hover:text-[#1565c0] mb-1">
                  {article.title}
                </h3>
              </Link>
              <span className="text-[10px] text-gray-500 uppercase">
                {formatDate(article.publishedAt)}
              </span>
            </div>
          ))}
        </div>


        <ExpandingOpportunities news={newsData} />

        {/* ── Trending Now ── */}
        <div className="mt-6 pt-4 border-t-[3px] border-yellow-400">
          <h2 className="text-base sm:text-[18px] font-extrabold tracking-[1px] uppercase text-[#0a2756] mb-4 px-0.5">
            Trending Now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-0">
            {trendingItems.map((article, i) => (
              <Link
                key={article.id}
                href={article.url}
                className="group block lg:pl-2 lg:pr-3 lg:border-r-4 lg:border-gray-200 lg:last:border-r-0 min-w-0"
              >
                <div className="text-2xl sm:text-[28px] font-bold text-gray-300 leading-none mb-2">
                  {i + 1}
                </div>
                <p className="text-[11px] sm:text-[12px] font-bold leading-snug text-black group-hover:text-[#1565c0]">
                  {article.title}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* More in latest news */}
        <div className="mt-6 pt-4 border-t-[3px] border-yellow-400">
          <h2 className="text-sm sm:text-[15px] font-bold tracking-[1px] uppercase text-[#0a2756] mb-4 px-0.5">
            More in Politics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 mt-4">
            {newsData.slice(11).map((article) => (
              <div key={article.id} className="min-w-0">
                <Link href={article.url} className="group block">
                  <div className="aspect-video relative overflow-hidden w-full mb-1.5 rounded-sm">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[#0a6bb5] uppercase tracking-[0.5px] mb-1 block">
                    {article.category}
                  </span>
                  <h3 className="text-[13px] font-bold leading-snug text-black group-hover:text-[#1565c0] mb-1">
                    {article.title}
                  </h3>
                </Link>
                <span className="text-[10px] text-gray-500 uppercase">
                  {formatDate(article.publishedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
