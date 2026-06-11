import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  HelpCircle, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: 'Help Center Support',
  description: 'Find answers to frequently asked questions about mineral trading, compliance verification, escrow payments, and global logistics on Baalvion Mining Inc.',
};

export default function HelpCenter() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the escrow system work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Baalvion Mining Inc. uses a milestone-based escrow system where funds are held securely until delivery and inspection are confirmed by the buyer."
        }
      },
      {
        "@type": "Question",
        "name": "What is AI Compliance Verification?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our AI tools automatically verify mining licenses and export permits against global regulatory databases to ensure trade legitimacy."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={faqSchema} />
      <Navbar />
      
      <div className="bg-primary py-16 text-primary-foreground">
        <div className="container px-4 md:px-8 max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-headline font-bold">How can we help?</h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search for articles, guides, or troubleshooting..." 
              className="pl-12 h-14 bg-white text-slate-900 border-none rounded-xl text-lg shadow-xl"
            />
          </div>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-16 flex-1">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: "Getting Started", desc: "Setting up your account and KYC verification." },
            { icon: CreditCard, title: "Payments & Escrow", desc: "Understanding the secure settlement process." },
            { icon: Truck, title: "Logistics Hub", desc: "Tracking shipments and managing freight bids." },
            { icon: HelpCircle, title: "RFQ & Tenders", desc: "How to participate in competitive bidding." },
            { icon: MessageSquare, title: "Messaging", desc: "Safe communication with trade partners." },
            { icon: ShieldCheck, title: "Compliance", desc: "Document standards and regional trade laws." },
          ].map((cat, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <cat.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{cat.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{cat.desc}</p>
                <div className="pt-2 text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Browse Guide <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
