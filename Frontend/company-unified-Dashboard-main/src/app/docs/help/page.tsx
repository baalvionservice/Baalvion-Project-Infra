'use client'; // Make it a client component

import { useState, useMemo } from 'react'; // import hooks
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Search } from 'lucide-react';
import { useDocs } from '@/hooks/use-docs';
import { Separator } from '@/components/ui/separator';

export default function HelpCenterPage() {
  const { helpArticles } = useDocs();
  const { categories, articles } = helpArticles;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = useMemo(() => {
    if (!searchTerm) {
      return articles.slice(0, 8); // Show featured if no search
    }
    return articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articles, searchTerm]);


  return (
    <main className="container mx-auto max-w-5xl py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight">Help Center</h1>
        <p className="text-lg text-muted-foreground mt-2">How can we help you today?</p>
        <div className="relative mt-6 max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search for articles..." 
            className="pl-12 h-12 text-lg" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.slug} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
      
      <Separator />

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">{searchTerm ? 'Search Results' : 'Featured Articles'}</h2>
        <div className="space-y-4">
            {filteredArticles.map(article => (
                <Link key={article.slug} href={`/docs/help/${article.slug}`}>
                    <Card className="flex items-center p-4 hover:bg-muted/50 cursor-pointer">
                        <FileText className="h-6 w-6 mr-4 text-primary" />
                        <div className="flex-1">
                            <h3 className="font-semibold">{article.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                In {article.category} · {article.readingTime} read · Last updated {article.lastUpdated}
                            </p>
                        </div>
                    </Card>
                </Link>
            ))}
            {filteredArticles.length === 0 && (
              <p className="text-center text-muted-foreground">No articles found matching your search.</p>
            )}
        </div>
      </section>
    </main>
  );
}
