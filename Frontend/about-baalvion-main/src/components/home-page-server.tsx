import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Globe,
  Database,
  Workflow,
  CheckCircle2,
  Target,
  ShieldCheck,
  Activity,
  BarChart3,
  Cpu,
  Zap,
  Globe2,
} from "lucide-react";
import Link from "next/link";
import { Project, EcosystemItem } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface PopulatedPage {
  id: string;
  slug: string;
  title: string;
  sections: string[];
  sectionData: any[];
}

interface HomePageServerProps {
  homePageData: PopulatedPage;
  projects: Project[];
  ecoItems: EcosystemItem[];
}

/**
 * Server-side rendered home page component
 * Optimized for SEO and Google indexing
 */
export default function HomePageServer({
  homePageData,
  projects,
  ecoItems,
}: HomePageServerProps) {
  const sections = homePageData?.sectionData || [];
  const heroSection = sections.find((s) => s.type === "hero");
  const problemSection = sections.find((s) => s.type === "problem");
  const solutionSection = sections.find((s) => s.type === "solution");
  const ctaSection = sections.find((s) => s.type === "cta-final");

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-white flex flex-col">
      <main className="flex-1" id="main-content">
        {/* HERO SECTION - Primary Value Proposition */}
        {heroSection && (
          <section
            className="relative pt-40 pb-20 border-b border-gray-100 bg-white overflow-hidden"
            aria-labelledby="hero-title"
          >
            <div className="section-container relative z-10 animate-fade-in">
              <div className="max-w-4xl">
                <span className="section-label">{heroSection.data?.label}</span>
                <h1
                  id="hero-title"
                  className="text-gray-900 mb-6 font-bold leading-[1.1] tracking-tight"
                >
                  {heroSection.title}
                </h1>
                <p className="mb-10 text-gray-600 text-lg md:text-xl max-w-2xl font-medium">
                  {heroSection.description}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
                  <Button
                    size="lg"
                    asChild
                    className="h-12 px-10 btn-primary w-full sm:w-auto"
                    aria-label="Explore our global platform"
                  >
                    <Link href="/platform" className="flex items-center">
                      {heroSection.data?.ctaPrimary}{" "}
                      <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="h-12 px-10 btn-outline w-full sm:w-auto"
                    aria-label="Partner with Baalvion"
                  >
                    <Link href="/contact">
                      {heroSection.data?.ctaSecondary}
                    </Link>
                  </Button>
                </div>

                {/* STATS TICKER - Real-time Performance Indicators */}
                <div className="flex flex-wrap gap-12 pt-10 border-t border-gray-100">
                  {heroSection.data?.stats?.map((stat: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-[11px] font-bold text-primary uppercase tracking-widest">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="absolute top-0 right-0 w-1/3 h-full bg-gray-50/50 -z-10 hidden lg:block"
              aria-hidden="true"
            />
          </section>
        )}

        {/* PROBLEM SECTION - Market Fragmentation */}
        {problemSection && (
          <section
            className="section-vertical-padding bg-gray-50 border-b border-gray-100"
            aria-labelledby="problem-title"
          >
            <div className="section-container">
              <div className="max-w-3xl mb-16">
                <span className="section-label">The Challenge</span>
                <h2 id="problem-title" className="text-gray-900 mb-4 font-bold">
                  {problemSection.title}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {problemSection.description}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {problemSection.data?.points?.map((point: any, i: number) => (
                  <Card
                    key={i}
                    className="bg-white p-8 shadow-sm border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-12 h-12 rounded-sm bg-primary/5 flex items-center justify-center text-primary mb-6"
                      aria-hidden="true"
                    >
                      {i === 0 ? (
                        <Workflow className="w-6 h-6" />
                      ) : i === 1 ? (
                        <ShieldCheck className="w-6 h-6" />
                      ) : (
                        <BarChart3 className="w-6 h-6" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {point.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {point.desc}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SOLUTION SECTION - Unified Architecture */}
        {solutionSection && (
          <section
            className="section-vertical-padding bg-white border-b border-gray-100"
            aria-labelledby="solution-title"
          >
            <div className="section-container">
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <span className="section-label">
                      Baalvion Operating System (BOS) Architecture
                    </span>
                    <h2 id="solution-title" className="text-gray-900 font-bold">
                      {solutionSection.title}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {solutionSection.description}
                    </p>
                  </div>
                  <div className="space-y-6">
                    {solutionSection.data?.features?.map(
                      (feat: any, i: number) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div
                            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"
                            aria-hidden="true"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold text-gray-900">
                              {feat.title}
                            </h4>
                            <p className="text-sm text-gray-600">{feat.desc}</p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-10 lg:p-16 text-center space-y-8 border border-gray-100 relative group">
                  <Globe
                    className="w-16 h-16 text-primary mx-auto group-hover:scale-110 transition-transform duration-700"
                    aria-hidden="true"
                  />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Unified Execution Layer
                  </h3>
                  <p className="text-gray-600 italic font-medium">
                    "A single protocol connecting every node of the global trade
                    Baalvion Operating System (BOS)."
                  </p>
                  <Button
                    asChild
                    className="w-full h-12 btn-primary font-bold shadow-xl shadow-primary/20"
                    aria-label="Explore the architecture of the BOS platform"
                  >
                    <Link href="/platform">Explore Platform Architecture</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ECOSYSTEM PREVIEW - Modular Layers */}
        <section
          className="section-vertical-padding bg-gray-50 border-b border-gray-100"
          aria-labelledby="ecosystem-title"
        >
          <div className="section-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl space-y-4">
                <span className="section-label">BOS Ecosystem Portals</span>
                <h2
                  id="ecosystem-title"
                  className="mb-0 text-gray-900 font-bold"
                >
                  Multi-Layered Governance
                </h2>
                <p className="text-gray-600 text-lg">
                  Strategically resolving global commerce bottlenecks through
                  modular node expansion.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="btn-outline h-12 px-8 group"
                aria-label="Explore all ecosystem layers"
              >
                <Link href="/ecosystem">
                  Explore All Layers{" "}
                  <ArrowRight
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ecoItems.slice(0, 4).map((item, i) => (
                <Card
                  key={item.id}
                  className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-lg group"
                >
                  <div className="p-8 space-y-6 flex flex-col h-full">
                    <div
                      className="w-12 h-12 bg-primary/5 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"
                      aria-hidden="true"
                    >
                      {i === 0 ? (
                        <Database className="w-6 h-6" />
                      ) : i === 1 ? (
                        <Target className="w-6 h-6" />
                      ) : i === 2 ? (
                        <ShieldCheck className="w-6 h-6" />
                      ) : (
                        <Globe className="w-6 h-6" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                        {item.layer} LAYER
                      </span>
                      <span className="text-[9px] font-mono text-gray-300">
                        NODE_V3
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PROJECTS PREVIEW - Active Implementation Nodes */}
        <section
          className="section-vertical-padding bg-white border-b border-gray-100"
          aria-labelledby="projects-title"
        >
          <div className="section-container">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <span className="section-label">Institutional Execution</span>
              <h2 id="projects-title" className="text-gray-900 font-bold">
                What We're Architecting
              </h2>
              <p className="text-gray-600 text-lg">
                Every initiative contributes to a unified global trade
                infrastructure through the BOS Core.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {projects.slice(0, 3).map((project) => (
                <Card
                  key={project.id}
                  className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-lg group"
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div
                        className="w-10 h-10 bg-gray-50 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors"
                        aria-hidden="true"
                      >
                        <Activity className="w-5 h-5" />
                      </div>
                      <Badge
                        className={cn(
                          "py-1 px-3 text-[10px] font-bold uppercase rounded-sm border",
                          project.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : project.status === "In Development"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : "bg-gray-50 text-gray-500 border-gray-100"
                        )}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                        {project.category}
                      </span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-primary hover:translate-x-1 transition-transform"
                        aria-label={`View details for project ${project.name}`}
                      >
                        <ArrowRight className="w-5 h-5" aria-hidden="true" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                asChild
                variant="outline"
                className="btn-outline h-12 px-10"
                aria-label="View the full strategic project portfolio"
              >
                <Link href="/projects">View Strategic Portfolio</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* AI & TECHNOLOGY HIGHLIGHTS - Intelligence Layer Readiness */}
        <section
          className="section-vertical-padding bg-gray-50 border-b border-gray-100 relative overflow-hidden"
          aria-labelledby="ai-highlights-title"
        >
          <div className="section-container relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    {
                      icon: Cpu,
                      title: "AI Vendor Scoring",
                      desc: "Predictive risk analysis mapping 150+ metrics per node.",
                      stat: "99.2% Accuracy",
                    },
                    {
                      icon: Zap,
                      title: "Clearing Automation",
                      desc: "Instant settlement protocols reducing latency by 85%.",
                      stat: "T-0 Settlement",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Compliance Core",
                      desc: "Real-time legal mapping across 180+ jurisdictions.",
                      stat: "Always-On",
                    },
                    {
                      icon: BarChart3,
                      title: "Predictive Intel",
                      desc: "Machine learning demand forecasting for global hubs.",
                      stat: "Real-time Feed",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-6 sm:p-8 bg-white border border-gray-100 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 group relative"
                    >
                      <div
                        className="absolute top-4 sm:top-6 right-4 sm:right-8 text-[8px] sm:text-[9px] font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden="true"
                      >
                        {item.stat}
                      </div>
                      <item.icon
                        className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-4 sm:mb-6 group-hover:scale-110 transition-transform"
                        aria-hidden="true"
                      />
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[120px] animate-pulse"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-10 order-1 lg:order-2">
                <div>
                  <span className="section-label">
                    Intelligence Architecture
                  </span>
                  <h2
                    id="ai-highlights-title"
                    className="text-gray-900 font-bold leading-tight text-4xl md:text-5xl"
                  >
                    Advanced BOS Orchestration
                  </h2>
                </div>
                <p className="text-xl text-gray-600 leading-relaxed">
                  The Baalvion Operating System (BOS) leverages custom machine
                  learning models to eliminate friction in international
                  commerce, automating compliance and risk scoring in real-time.
                </p>
                <div className="grid gap-6">
                  {[
                    "Automated KYC/AML verification protocols (ISO 20022 ready)",
                    "Dynamic multi-currency clearing engine",
                    "Localized intelligence for 198 markets via Satellite Link",
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 text-sm font-bold text-gray-700 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary/20 transition-all"
                    >
                      <div
                        className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"
                        aria-hidden="true"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE GLOBAL TRADE MAP - Network Visualization */}
        <section
          className="hidden sm:flex section-vertical-padding bg-white border-b border-gray-100 overflow-hidden"
          aria-labelledby="global-map-title"
        >
          <div className="section-container">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <span className="section-label">Global Presence Registry</span>
              <h2
                id="global-map-title"
                className="text-gray-900 font-bold text-4xl md:text-5xl"
              >
                One System. Infinite Connectivity.
              </h2>
              <p className="text-gray-600 text-lg">
                Explore the technical connectivity of the Baalvion BOS network
                across international trade hubs.
              </p>
            </div>

            <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-[#151B24] rounded-2xl sm:rounded-[3rem] border border-gray-800 p-4 sm:p-8 flex items-center justify-center group overflow-hidden shadow-2xl shadow-black/20">
              <div
                className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/darkmap/1200/800')] bg-cover bg-center grayscale brightness-50"
                aria-hidden="true"
              />

              <div className="absolute inset-0 z-0" aria-hidden="true">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping" />
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full animate-ping delay-300" />
                <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-primary rounded-full animate-ping delay-700" />
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-primary rounded-full animate-ping delay-1000" />
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 md:gap-12 text-center w-full px-2 sm:px-4">
                {[
                  {
                    region: "Americas",
                    partners: "42+",
                    nodes: "12",
                    status: "Nominal",
                    volume: "$1.2B",
                  },
                  {
                    region: "EMEA",
                    partners: "58+",
                    nodes: "24",
                    status: "Expanding",
                    volume: "$2.4B",
                  },
                  {
                    region: "APAC",
                    partners: "85+",
                    nodes: "32",
                    status: "Active",
                    volume: "$4.8B",
                  },
                  {
                    region: "Global Hubs",
                    partners: "125+",
                    nodes: "68",
                    status: "Unified",
                    volume: "$8.4B",
                  },
                ].map((reg, i) => (
                  <div
                    key={i}
                    className="space-y-3 sm:space-y-6 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-primary/20 transition-all cursor-default group/item"
                    role="group"
                    aria-label={`${reg.region} region metrics`}
                  >
                    <Globe2
                      className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto mb-1 sm:mb-2 group-hover/item:rotate-12 transition-transform duration-500"
                      aria-hidden="true"
                    />
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white mb-1">
                        {reg.region}
                      </h4>
                      <p className="text-[8px] sm:text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
                        {reg.volume} Annual Clearing
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>Connectivity</span>
                        <span className="text-white">{reg.nodes} Nodes</span>
                      </div>
                      <div
                        className="h-1 w-full bg-white/5 rounded-full overflow-hidden"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{
                            width:
                              i === 0
                                ? "60%"
                                : i === 1
                                ? "75%"
                                : i === 2
                                ? "90%"
                                : "100%",
                          }}
                        />
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] sm:text-[10px] py-1 px-2 sm:px-4 rounded-full uppercase font-bold tracking-widest">
                      {reg.status}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-10 inset-x-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/5 pt-8">
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Live Network Status
                </div>
                <div className="text-[9px] font-mono text-gray-500">
                  BOS_CORE_V3.2.1
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        {ctaSection && (
          <section
            className="section-vertical-padding bg-primary text-white relative overflow-hidden"
            aria-labelledby="cta-title"
          >
            <div className="section-container relative z-10 text-center">
              <div className="max-w-3xl mx-auto space-y-8">
                <h2
                  id="cta-title"
                  className="text-white font-bold text-4xl md:text-5xl"
                >
                  {ctaSection.title}
                </h2>
                <p className="text-white/90 text-xl leading-relaxed">
                  {ctaSection.description}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                  <Button
                    size="lg"
                    variant={"outline"}
                    asChild
                    className="h-14 px-12 bg-white/10 text-white   font-bold text-lg w-full sm:w-auto"
                  >
                    <Link href="/contact">
                      {ctaSection.data?.ctaPrimary || "Get Started"}
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="h-14 px-12 bg-white border-white/20 text-primary hover:bg-white/10 font-bold text-lg w-full sm:w-auto"
                  >
                    <Link href="/contact">
                      {ctaSection.data?.ctaSecondary || "Contact Strategy Team"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80"
              aria-hidden="true"
            />
          </section>
        )}
      </main>
    </div>
  );
}
