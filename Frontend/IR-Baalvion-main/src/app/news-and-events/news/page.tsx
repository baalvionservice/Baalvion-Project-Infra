import type { Metadata } from 'next';
import { cmsGetNews } from '@/lib/cms';

export const metadata: Metadata = {
    title: 'News | Baalvion',
    description: 'Latest news from Baalvion.',
};

export default async function NewsPage() {
    // Editorial content is managed centrally in the Baalvion CMS (admin-platform console).
    const news = await cmsGetNews();

    return (
        <>
            <section className="bg-black text-white py-12 md:py-20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm font-bold text-primary tracking-widest mb-2">NEWS &amp; EVENTS</p>
                    <h1 className="text-4xl md:text-5xl font-bold">News</h1>
                </div>
            </section>
            <section className="py-16 md:py-24 bg-white text-black">
                <div className="container mx-auto px-4 max-w-4xl">
                    {news.length === 0 ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">Content Coming Soon</h2>
                            <p className="text-gray-600 mt-4">Our latest news articles will be listed here.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {news.map((article, idx) => (
                                <article key={idx} className="border-b border-gray-100 pb-12 last:border-0">
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{article.date}</p>
                                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 hover:text-primary transition-colors">
                                        {article.title}
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed">{article.excerpt}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
