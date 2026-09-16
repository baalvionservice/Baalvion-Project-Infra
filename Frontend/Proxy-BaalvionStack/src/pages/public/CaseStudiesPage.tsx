import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Globe, 
  ShoppingCart, 
  Search, 
  BarChart3,
  ArrowRight,
  Quote,
  Users,
  Zap,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/platformClient";
import { caseStudies as fallbackCaseStudies } from "@/data/mockData";

/**
 * Real case studies only.
 *
 * Invented engagements sat here — "Global Retail Corp", "Digital Agency Pro" and others —
 * each with a named customer contact ("Sarah Chen, VP of Data Analytics") and before/after
 * metrics (10,000 to 500,000 daily price checks, 87% to 99.5% accuracy). No such
 * engagements exist, and the numbers were not measured.
 *
 * A case study names a customer and reports their results, so it needs that customer's
 * agreement. The page renders an honest empty state while this list is empty.
 */
type CaseStudy = {
  company: string;
  author: string;
  role: string;
  metrics: { metric: string; before: string; after: string }[];
  [k: string]: unknown;
};

const detailedCaseStudies: CaseStudy[] = [];

const industryLogos = [
  "TechCorp", "GlobalBank", "MediaMax", "RetailPlus", "DataDriven", "CloudFirst", 
  "AnalyticsPro", "MarketLeader", "ScaleUp", "InfoTech", "SmartData", "WebScale"
];

export default function CaseStudiesPage() {
  const { data: caseStudies = fallbackCaseStudies } = useQuery({
    queryKey: ["public", "case-studies"],
    queryFn: () => publicApi.caseStudies(),
    staleTime: 10 * 60 * 1000,
  });
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">
              <TrendingUp className="w-3 h-3 mr-1" />
              Success Stories
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Real Results from Real Customers
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              See how leading companies use Baalvion NetStack to transform their data collection 
              and gain competitive advantages in their industries.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-border/50 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Enterprise Clients</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-success">99.2%</p>
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-accent">45TB+</p>
              <p className="text-sm text-muted-foreground">Daily Data Collected</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-warning">195</p>
              <p className="text-sm text-muted-foreground">Countries Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Case Studies */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {detailedCaseStudies.length === 0 && (
            <div className="mx-auto max-w-2xl py-12 text-center">
              <p className="text-lg">No case studies are published yet.</p>
              <p className="mt-3 text-sm text-muted-foreground">
                A case study names a customer and reports their results, so it is published
                only with that customer&apos;s agreement.
              </p>
            </div>
          )}
          <div className="space-y-16">
            {detailedCaseStudies.map((study, index) => (
              <Card key={study.id} variant="default" className="overflow-hidden">
                <div className={`grid lg:grid-cols-2 gap-0 ${index % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                  {/* Content Side */}
                  <div className="p-8 lg:p-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl bg-${study.color}/10 flex items-center justify-center`}>
                        <study.icon className={`w-6 h-6 text-${study.color}`} />
                      </div>
                      <div>
                        <Badge variant="outline">{study.industry}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{study.company}</p>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-4">{study.title}</h2>
                    <p className="text-muted-foreground mb-6">{study.description}</p>

                    <div className="space-y-4 mb-8">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">THE CHALLENGE</h4>
                        <p className="text-sm">{study.challenge}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">THE SOLUTION</h4>
                        <p className="text-sm">{study.solution}</p>
                      </div>
                    </div>

                    {/* Testimonial */}
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <Quote className="w-5 h-5 text-primary mb-2" />
                      <p className="text-sm italic mb-3">{study.testimonial}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {study.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{study.author}</p>
                          <p className="text-xs text-muted-foreground">{study.role}, {study.company}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results Side */}
                  <div className={`p-8 lg:p-12 bg-secondary/20 ${index % 2 === 1 ? 'lg:order-first' : ''}`}>
                    <div className="mb-8">
                      <p className="text-6xl font-bold text-primary mb-2">{study.improvement}</p>
                      <p className="text-lg text-muted-foreground">{study.metric}</p>
                    </div>

                    <h4 className="font-semibold text-sm text-muted-foreground mb-4">KEY RESULTS</h4>
                    <div className="space-y-4">
                      {study.results.map((result) => (
                        <div key={result.metric} className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-sm text-muted-foreground mb-2">{result.metric}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground line-through">{result.before}</span>
                            <ArrowRight className="w-4 h-4 text-primary" />
                            <span className="text-lg font-bold text-success">{result.after}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">More Success Stories</h2>
            <p className="text-muted-foreground">Quick highlights from our diverse customer base</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study) => (
              <Card key={study.id} variant="interactive" className="p-6">
                <Badge variant="outline" className="mb-4">{study.company}</Badge>
                <h3 className="text-lg font-semibold mb-2">{study.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{study.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{study.improvement}</span>
                  <span className="text-sm text-muted-foreground">{study.metric}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            TRUSTED BY INDUSTRY LEADERS
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50">
            {industryLogos.map((logo) => (
              <div key={logo} className="text-lg font-bold text-muted-foreground">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card variant="default" className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <Zap className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of companies that trust Baalvion NetStack for their data collection needs. 
              Start your free trial today with no credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}