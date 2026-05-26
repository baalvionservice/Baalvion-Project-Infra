import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: 'Trade Insights | GeoTrade Nexus Blog',
  description: 'Expert analysis on global mineral markets, mining compliance trends, and industrial supply chain innovation.',
};

export default function BlogPage() {
  const posts = [
    { title: "The Rise of Critical Minerals in 2024", cat: "Market Analysis", date: "May 12, 2024", author: "Dr. Sarah Chen" },
    { title: "AI in Mining: Beyond the Hype", cat: "Technology", date: "May 10, 2024", author: "Marc Holden" },
    { title: "Navigating Cross-Border Logistics", cat: "Operations", date: "May 05, 2024", author: "James Miller" },
  ];

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "GeoTrade Nexus Insights",
    "description": "Mining industry analysis and trade insights.",
    "blogPost": posts.map(p => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "author": { "@type": "Person", "name": p.author },
      "datePublished": p.date
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={blogSchema} />
      <Navbar />
      
      <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Trade Insights</h1>
          <p className="text-lg text-slate-500 mt-4 leading-relaxed">
            Market analysis, regulatory updates, and technology deep-dives from the leaders in global mineral trading.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
              <div className="relative h-48 bg-muted">
                <Image 
                  src={`https://picsum.photos/seed/blog-${i}/600/400`} 
                  alt={post.title} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6 space-y-4">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary">
                  {post.cat}
                </Badge>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {post.title}
                </h3>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>By {post.author}</span>
                  <span>{post.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
