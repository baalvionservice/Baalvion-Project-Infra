import HeadingSection from "@/components/layout/HeadingSection";
import { brokerGuides } from "./Components/data.brokers";
import Image from "next/image";
import Link from "next/link";
import { NewsArticle } from "@/lib/data.news";
import { brokerFAQs } from "./Components/data.faq.brokers";
import FAQ from "@/components/faq/FAQ";
import { ExploreNewsSection } from "../news/ExploreNewsSection";


/** Horizontal card (image left, text right) — for the sidebar list */
function HorizontalArticleCard({ article }: { article: NewsArticle }) {
    return (
        <Link
            href={`/${article.slug}`}
            className="group flex gap-3 items-center py-4 border-b border-gray-100 last:border-none"
        >
            <div className="relative flex-shrink-0 w-32 h-full overflow-hidden">
                <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105"
                    sizes="96px"
                />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
                <p className="text-blue-500 tracking-wider">BROKERS</p>
                <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:underline line-clamp-2">
                    {article.title}
                </h3>
                <div className="text-neutral-400 text-sm">
                    By <span className="">{article.author.name}</span>

                </div>
            </div>
        </Link>
    );
}

/** Large hero card — the featured article */
function FeaturedArticleCard({ article }: { article: typeof brokerGuides[0] }) {
    return (
        <Link href={`/${article.slug}`} className="group block">
            <div className="relative w-full md:mt-6 overflow-hidden aspect-[16/9] lg:aspect-[21/9]">
                <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 75vw"
                    priority
                />
                {/* gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />


            </div>
            {/* text */}
            <div className="py-5 space-y-3">
                <p className="text-blue-500 tracking-wider">STOCKS</p>
                <h2 className="text-foreground text-2xl md:text-3xl font-bold leading-snug max-w-2xl group-hover:underline group-hover:text-blue-500 underline-offset-4">
                    {article.title}
                </h2>

                <p className="text-gray-500 text-xs">
                    By {article.author.name}
                </p>
            </div>
        </Link>
    );
}


export default function BrokersPage() {
    const featured = brokerGuides.find((article) => article.featured);
    const sidebarArticles = brokerGuides.filter((a) => !a.featured);
    return (
        <div className='min-h-screen'>

            {/* Heading */}
            <HeadingSection tag={"INVESTING"} title={"Brokers"} description="From beginners to advanced traders looking for options trading, international exposure, and alternative investments, there is a brokerage firm for every investor across all levels of experience, income, and risk tolerance. Learn how the best brokers work and which ones are suited to help you reach your financial goals" />

            {/* ── Main content ── */}
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-12">

                {/* ── Top section: featured + sidebar ── */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Featured (takes 2/3 width) */}
                    <div className="lg:col-span-2">
                        <FeaturedArticleCard article={featured!} />

                    </div>

                    {/* Sidebar latest */}
                    <aside className="flex flex-col">

                        {sidebarArticles.slice(0,4).map((article) => (
                            <HorizontalArticleCard key={article.id} article={article} />
                        ))}
                    </aside>



                </section>


                {/* ── FAQ ── */}
                <section className="w-full pb-4 md:pb-12">
                    <FAQ data={brokerFAQs} />
                </section>




                {/* ── Article grid ── */}
                <section className="pb-4 md:pb-12">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground mb-6 pb-2">
                        Explore Brokers
                    </h2>

                    <ExploreNewsSection articles={sidebarArticles} />
                </section>
            </div>

        </div>
    )
}