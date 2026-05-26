import { Database, Shield, Zap, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PopulatedPage {
  id: string;
  slug: string;
  title: string;
  sections: string[];
  sectionData: any[];
}

interface PlatformPageServerProps {
  pageData: PopulatedPage | null;
}

/**
 * Server-side rendered platform page component
 * Optimized for SEO and Google indexing
 */
export default function PlatformPageServer({
  pageData,
}: PlatformPageServerProps) {
  const getIcon = (title: string = "") => {
    const t = title.toLowerCase();
    if (t.includes("ledger") || t.includes("infrastructure"))
      return <Database className="w-8 h-8" />;
    if (t.includes("compliance") || t.includes("security"))
      return <Shield className="w-8 h-8" />;
    if (t.includes("clearing") || t.includes("engine"))
      return <Zap className="w-8 h-8" />;
    return <Globe className="w-8 h-8" />;
  };

  // Safe access to sectionData with fallback to empty array
  const sections = pageData?.sectionData || [];
  const featuresSection = sections.find((s) => s.type === "cards");

  // Default features if no data is available
  const defaultFeatures = [
    {
      title: "Global Trade Infrastructure",
      desc: "Unified protocol connecting businesses, finance, and compliance across 198 countries through a single execution layer.",
    },
    {
      title: "AI-Powered Compliance",
      desc: "Real-time legal mapping and automated KYC/AML verification protocols across 180+ jurisdictions with 99.2% accuracy.",
    },
    {
      title: "Instant Settlement Engine",
      desc: "T-0 clearing automation reducing transaction latency by 85% through dynamic multi-currency processing.",
    },
  ];

  const features = featuresSection?.data?.features || defaultFeatures;

  return (
    <main className="pt-40 pb-24">
      <div className="section-container">
        <div className="max-w-4xl mb-20 animate-fade-in">
          <span className="section-label">Technology & Infrastructure</span>
          <h1 className="text-gray-900 mb-8 leading-[1.1] tracking-tight">
            BOS <span className="text-primary">Core</span> Architecture
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
            {featuresSection?.description ||
              "Architecting the foundational layer for global trade with enterprise-grade reliability and modular scalability."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f: any, i: number) => (
            <Card
              key={i}
              className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg group overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gray-50 group-hover:bg-primary transition-colors" />
              <CardContent className="p-10 space-y-8">
                <div className="w-16 h-16 bg-primary/5 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  {getIcon(f.title)}
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
