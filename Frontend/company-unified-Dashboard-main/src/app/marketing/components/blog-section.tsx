import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const blogPosts = [
  {
    title: 'How to manage equity across 5 businesses without a CFO',
    description: 'A deep dive into modern equity management for global founders.',
    imageSeed: 'equity-chart',
    imageHint: 'chart graph'
  },
  {
    title: 'Multi-currency reporting: a guide for global founders',
    description: 'Stop letting exchange rates eat into your profit. Here’s how to master multi-currency financials.',
    imageSeed: 'currencies',
    imageHint: 'world currencies'
  },
  {
    title: "Why your ERP doesn't understand digital-first businesses",
    description: "Traditional ERPs were built for a different era. Learn why a new approach is needed for today's companies.",
    imageSeed: 'server-room',
    imageHint: 'server room'
  }
];

export default function BlogSection() {
  return (
    <section id="blog" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">From the Blog</h2>
          <p className="mt-2 text-lg text-muted-foreground">Insights for building and scaling a global business empire.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <div className="aspect-video relative mb-4">
                    <Image src={`https://picsum.photos/seed/${post.imageSeed}/600/400`} alt={post.title} fill className="rounded-md object-cover" data-ai-hint={post.imageHint} />
                </div>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>{post.description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                 <Button variant="outline" asChild>
                    <Link href="#">Read More <ArrowRight className="ml-2" /></Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
