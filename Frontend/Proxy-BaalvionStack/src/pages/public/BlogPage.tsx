import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";

const posts = [
  {
    title: "How to Scale Web Scraping to 10M Pages/Day",
    excerpt: "Learn proven techniques for scaling your web scraping infrastructure using rotating residential proxies with intelligent retry logic and session management.",
    category: "Engineering",
    author: "Arun Krishnamurthy",
    date: "Feb 28, 2026",
    readTime: "8 min read",
    featured: true,
  },
  {
    title: "Understanding Proxy Types: Residential vs Mobile vs Datacenter",
    excerpt: "A comprehensive comparison of the three main proxy types, when to use each, and how to optimize performance for your specific use case.",
    category: "Guide",
    author: "Priya Sharma",
    date: "Feb 21, 2026",
    readTime: "6 min read",
    featured: false,
  },
  {
    title: "SOC 2 Type II: Our Journey to Enterprise Compliance",
    excerpt: "We share the story behind our SOC 2 Type II certification — the challenges, the process, and what it means for our enterprise customers.",
    category: "Security",
    author: "Vikram Patel",
    date: "Feb 14, 2026",
    readTime: "5 min read",
    featured: false,
  },
  {
    title: "Announcing 4G/5G Mobile Proxies in 30 New Countries",
    excerpt: "We've expanded our mobile proxy coverage to 30 additional countries across Southeast Asia, Africa, and South America.",
    category: "Product",
    author: "Neha Gupta",
    date: "Feb 7, 2026",
    readTime: "3 min read",
    featured: false,
  },
  {
    title: "Best Practices for API Key Security in Proxy Networks",
    excerpt: "Learn how to secure your API keys with IP allowlisting, scope restrictions, rotation policies, and monitoring for suspicious activity.",
    category: "Security",
    author: "Raj Malhotra",
    date: "Jan 30, 2026",
    readTime: "7 min read",
    featured: false,
  },
  {
    title: "How Ad Verification Companies Use Baalvion NetStack",
    excerpt: "A deep dive into how leading ad verification companies leverage our infrastructure for real-time ad fraud detection across global markets.",
    category: "Case Study",
    author: "Sanya Mehra",
    date: "Jan 22, 2026",
    readTime: "5 min read",
    featured: false,
  },
];

const categoryColors: Record<string, string> = {
  Engineering: "default",
  Guide: "info",
  Security: "secondary",
  Product: "outline",
  "Case Study": "default",
};

export default function BlogPage() {
  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <div className="container mx-auto px-4 py-24">
      <SEOHead
        title="Blog — Proxy Engineering & Product Updates"
        description="Technical guides, product updates, and industry insights from the Baalvion NetStack engineering team."
        canonical="https://baalvion.com/blog"
      />
      <div className="text-center mb-16">
        <Badge variant="info" className="mb-4">Blog</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Insights & Updates</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Technical guides, product updates, and proxy engineering best practices from our team.
        </p>
      </div>

      {/* Featured Post */}
      {featured && (
        <Card variant="glow" className="max-w-4xl mx-auto mb-12 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-48 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
              <span className="text-6xl font-bold text-primary/20">Featured</span>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant={categoryColors[featured.category] as any || "default"}>{featured.category}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{featured.date}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{featured.readTime}</span>
              </div>
              <h2 className="text-2xl font-bold mb-3">{featured.title}</h2>
              <p className="text-muted-foreground mb-4">{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{featured.author}</span>
                <Button variant="ghost" className="gap-1" disabled>
                  Read More <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {rest.map((post, i) => (
          <Card key={i} variant="interactive" className="group">
            <CardContent className="p-0">
              <div className="h-32 bg-gradient-to-br from-secondary/50 via-secondary/20 to-transparent" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={categoryColors[post.category] as any || "default"} className="text-xs">{post.category}</Badge>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <Button variant="outline" disabled>Load More Posts</Button>
        <p className="text-xs text-muted-foreground mt-2">All posts shown (demo)</p>
      </div>
    </div>
  );
}
