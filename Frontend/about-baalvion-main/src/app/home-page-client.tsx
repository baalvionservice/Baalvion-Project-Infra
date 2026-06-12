"use client";

import { useEffect, useState } from "react";
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
  Loader2,
  Target,
  ShieldCheck,
  Activity,
  BarChart3,
  Cpu,
  Zap,
  Leaf,
  Mail,
  Milestone,
  Users,
  Star,
  ShieldAlert,
  Globe2,
  TrendingUp,
  Search,
  Layers,
  ChevronRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Project, EcosystemItem, Page } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/**
 * @interface PopulatedPage
 * @description Page structure with hydrated section data from the BOS Architecture Registry.
 */
interface PopulatedPage extends Page {
  sectionData: any[];
}

/**
 * @component HomePageClient
 * @description The institutional entryway for the Baalvion Operating System (BOS).
 * Designed for high-concurrency data ingestion and future-proof modular rendering.
 */
export default function HomePageClient() {
  const [homePageData, setHomePageData] = useState<PopulatedPage | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ecoItems, setEcoItems] = useState<EcosystemItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Future-proof data synchronization hook
  // Ready for WebSocket or Server-Sent Events (SSE) integration
  useEffect(() => {
    async function init() {
      try {
        const [pgRes, pRes, eRes] = await Promise.all([
          fetch("/api/pages?slug=home"),
          fetch("/api/projects"),
          fetch("/api/ecosystem"),
        ]);

        if (!pgRes.ok || !pRes.ok || !eRes.ok)
          throw new Error("System link synchronization failure.");

        const [pg, p, e] = await Promise.all([
          pgRes.json(),
          pRes.json(),
          eRes.json(),
        ]);

        setHomePageData(pg);
        setProjects(p);
        setEcoItems(e);
      } catch (err) {
        console.error("BOS Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading || !homePageData)
    return (
      <div
        className="min-h-screen bg-white flex items-center justify-center"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-10 h-10 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Syncing Baalvion Operating System (BOS)...
          </p>
        </div>
      </div>
    );

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
                className="absolute inset-0 opacity-20 bg-[url('/images/placeholder.svg')] bg-cover bg-center grayscale brightness-50"
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
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                    aria-hidden="true"
                  />{" "}
                  Live Core Health: 99.99% Operational
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Latency:{" "}
                    <span className="text-primary ml-2">124ms AVG</span>
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Auth:{" "}
                    <span className="text-primary ml-2">mTLS + AES-256</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROJECT PIPELINE / ROADMAP - Future Deployment Logic */}
        <section
          className="section-vertical-padding bg-gray-50 border-b border-gray-100 relative"
          aria-labelledby="roadmap-title"
        >
          <div className="section-container">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
              <div className="max-w-2xl space-y-4">
                <span className="section-label">Execution Pipeline</span>
                <h2
                  id="roadmap-title"
                  className="mb-0 text-gray-900 font-bold text-4xl md:text-5xl"
                >
                  Strategic Milestones
                </h2>
                <p className="text-gray-600 text-lg">
                  Next-gen technical deployments scheduled for the BOS ecosystem
                  integration.
                </p>
              </div>
              <div className="flex items-center w-full  sm:w-fit gap-3 px-6 py-3 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 uppercase tracking-[0.2em] shadow-sm">
                <Milestone
                  className="w-4 h-4 text-primary"
                  aria-hidden="true"
                />{" "}
                Q1 - Q4 • 2026 Deployment
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "BOS Mobile Terminal",
                  status: "In Development",
                  progress: 75,
                  q: "Q1",
                  desc: "Secure node management for institutional clearing partners.",
                },
                {
                  title: "Automated Customs v2",
                  status: "Planned",
                  progress: 20,
                  q: "Q2",
                  desc: "Direct ISO API link to 45+ national customs databases.",
                },
                {
                  title: "ESG Compliance Core",
                  status: "Active",
                  progress: 90,
                  q: "Q1",
                  desc: "Real-time carbon footprint tracking for multi-tier trade routes.",
                },
                {
                  title: "Satellite Uplink v3",
                  status: "Research",
                  progress: 10,
                  q: "Q3",
                  desc: "Global redundant uplink for remote high-scale industrial nodes.",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="p-10 bg-white border border-gray-100 rounded-[2.5rem] space-y-8 hover:border-primary/20 hover:shadow-2xl transition-all duration-500 group h-full flex flex-col"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] bg-primary/5 px-3 py-1 rounded-full">
                      {step.q} Designation
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] font-bold uppercase py-1 px-3 border",
                        step.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-gray-50 text-gray-400 border-gray-100"
                      )}
                    >
                      {step.status}
                    </Badge>
                  </div>
                  <div className="space-y-4 flex-1">
                    <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                  <div className="space-y-3 pt-6 border-t border-gray-100">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Integration Ready</span>
                      <span className="text-primary">{step.progress}%</span>
                    </div>
                    <div
                      className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full bg-primary transition-all duration-1000 group-hover:animate-pulse"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUSTAINABILITY & ESG - Global Accountability */}
        <section
          className="section-vertical-padding bg-white border-b border-gray-100"
          aria-labelledby="esg-title"
        >
          <div className="section-container">
            <div className="bg-[#151B24] rounded-2xl sm:rounded-3xl lg:rounded-[4rem] p-6 sm:p-8 md:p-12 lg:p-24 overflow-hidden relative group shadow-2xl shadow-black/20">
              <div
                className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4 transition-transform duration-1000 group-hover:translate-x-1/3"
                aria-hidden="true"
              />
              <div className="relative z-10 grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-24 items-center">
                <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                  <div>
                    <span className="text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-[0.3em] sm:tracking-[0.5em] mb-4 sm:mb-6 block">
                      ESG & Compliance Protocols
                    </span>
                    <h2
                      id="esg-title"
                      className="text-white font-bold leading-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-0"
                    >
                      Architecting Green Trade
                    </h2>
                  </div>
                  <p className="text-gray-400 text-base sm:text-lg lg:text-xl leading-relaxed">
                    Baalvion is committed to carbon-neutral trade routes and
                    ethical vendor scoring. Our platform ensures every BOS node
                    follows global sustainability standards.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6">
                    <div className="space-y-1 sm:space-y-2 text-center sm:text-left">
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        100%
                      </p>
                      <p className="text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-widest leading-tight">
                        Compliance Audit Success
                      </p>
                    </div>
                    <div className="space-y-1 sm:space-y-2 text-center sm:text-left">
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        40%
                      </p>
                      <p className="text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-widest leading-tight">
                        Energy Waste Reduction
                      </p>
                    </div>
                    <div className="space-y-1 sm:space-y-2 text-center sm:text-left">
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        Net-0
                      </p>
                      <p className="text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-widest leading-tight">
                        By 2028 Target
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    {
                      icon: Leaf,
                      title: "Carbon-Free Routing",
                      desc: "Optimizing global logistics for minimum environmental footprint via BOS AI orchestration.",
                    },
                    {
                      icon: ShieldAlert,
                      title: "Ethical Sourcing AI",
                      desc: "Real-time monitoring of labor laws and safety compliance across all institutional tiers.",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-10 items-start sm:items-center group/card hover:bg-white hover:border-white transition-all duration-700 hover:shadow-2xl"
                    >
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover/card:bg-primary group-hover/card:text-white transition-all duration-500 shrink-0"
                        aria-hidden="true"
                      >
                        <item.icon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover/card:text-gray-900 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm sm:text-base text-gray-400 group-hover/card:text-gray-600 transition-colors leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PARTNERS - Institutional Trust Carousel */}
        <section
          className="py-32 bg-white border-b border-gray-100 overflow-hidden"
          aria-labelledby="partners-title"
        >
          <div className="section-container">
            <div className="text-center mb-20 space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.6em]">
                Core Integration Partners
              </span>
              <h2
                id="partners-title"
                className="text-gray-900 font-bold text-3xl"
              >
                Trusted by Global Nodes
              </h2>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent className="-ml-4">
                {[
                  "SBI Corporate",
                  "PayU Enterprise",
                  "HSBC Node",
                  "Standard Chartered",
                  "Global Logistics",
                  "Oracle Cloud",
                  "SAP Integrated",
                ].map((name, i) => (
                  <CarouselItem
                    key={i}
                    className="pl-4 md:basis-1/3 lg:basis-1/5"
                  >
                    <div className="p-8 h-32 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-center grayscale hover:grayscale-0 opacity-40 hover:opacity-100 transition-all group cursor-default">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-primary/20 transition-colors"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-black tracking-tighter text-gray-900 uppercase italic whitespace-nowrap">
                          {name}
                        </span>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-12">
                <CarouselPrevious
                  className="relative inset-0 translate-y-0 h-12 w-12"
                  aria-label="Previous partner logos"
                />
                <CarouselNext
                  className="relative inset-0 translate-y-0 h-12 w-12"
                  aria-label="Next partner logos"
                />
              </div>
            </Carousel>
          </div>
        </section>

        {/* NEWSLETTER SIGNUP - Growth & Engagement Terminal */}
        <section
          className="section-vertical-padding bg-gray-50"
          aria-labelledby="newsletter-title"
        >
          <div className="section-container">
            <div className="max-w-5xl mx-auto bg-white p-6 sm:p-8 md:p-12 lg:p-24 rounded-2xl sm:rounded-3xl lg:rounded-[4rem] border border-gray-100 shadow-sm text-center space-y-8 sm:space-y-10 lg:space-y-12 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full h-1 sm:h-2 bg-gradient-to-r from-primary to-orange-600"
                aria-hidden="true"
              />
              <div className="space-y-4 sm:space-y-6">
                <div
                  className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary"
                  aria-hidden="true"
                >
                  <Mail className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10" />
                </div>
                <h2
                  id="newsletter-title"
                  className="text-gray-900 font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-0"
                >
                  Stay Integrated
                </h2>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">
                  Receive weekly strategic briefs, technical milestones, and BOS
                  system logs directly to your institutional registry.
                </p>
              </div>
              <form
                className="max-w-lg mx-auto relative group"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="relative">
                  <label htmlFor="institutional-email" className="sr-only">
                    Institutional email address
                  </label>
                  <input
                    id="institutional-email"
                    type="email"
                    required
                    placeholder="Enter institutional email"
                    className="w-full h-14 sm:h-16 lg:h-20 bg-gray-50 border border-gray-200 rounded-full px-6 sm:px-8 lg:px-10 pr-32 sm:pr-40 lg:pr-48 text-base sm:text-lg lg:text-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all shadow-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 sm:right-3 top-2 sm:top-3 h-10 sm:h-10 lg:h-14 px-6 sm:px-8 lg:px-10 bg-primary hover:bg-primary/90 text-white rounded-full font-bold text-sm sm:text-base lg:text-lg transition-all shadow-xl active:scale-95 flex items-center gap-2 sm:gap-3"
                  >
                    <span className="hidden sm:inline">Subscribe</span>
                    <span className="sm:hidden">Go</span>
                    <ChevronRight
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </form>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500"
                    aria-hidden="true"
                  />
                  Compliance Verified
                </div>
                <div className="flex items-center gap-2">
                  <Lock
                    className="w-3 h-3 sm:w-4 sm:h-4 text-primary"
                    aria-hidden="true"
                  />
                  End-to-End Encrypted
                </div>
                <div className="flex items-center gap-2">
                  <Search
                    className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                    aria-hidden="true"
                  />
                  Global Registry Enabled
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA - Institutional Onboarding */}
        {ctaSection && (
          <section
            className="section-vertical-padding bg-white relative overflow-hidden"
            aria-labelledby="final-cta-title"
          >
            <div className="section-container relative z-10">
              <div className="bg-[#151B24] p-8 sm:p-12 md:p-16 lg:p-24 text-center rounded-2xl sm:rounded-3xl lg:rounded-[4rem] shadow-2xl border border-gray-800 max-w-6xl mx-auto group">
                <div
                  className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                  aria-hidden="true"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#FF9900_0%,transparent_70%)]" />
                </div>

                <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 lg:space-y-12 relative z-10">
                  <h2
                    id="final-cta-title"
                    className="text-white leading-tight mb-0 font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-tighter"
                  >
                    {ctaSection.title}
                  </h2>
                  <p className="text-gray-400 text-base sm:text-lg md:text-xl lg:text-2xl font-medium max-w-2xl mx-auto">
                    {ctaSection.description}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
                    <Button
                      size="lg"
                      asChild
                      className="h-12 sm:h-14 lg:h-16 px-8 sm:px-10 lg:px-14 btn-primary text-base sm:text-lg lg:text-xl rounded-full shadow-2xl shadow-primary/30 group/btn w-full sm:w-auto"
                      aria-label="Explore the full BOS platform"
                    >
                      <Link
                        href="/platform"
                        className="flex items-center justify-center gap-3"
                      >
                        {ctaSection.data?.ctaPrimary}
                        <ArrowRight
                          className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:translate-x-2 transition-transform"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="h-12 sm:h-14 lg:h-16 px-8 sm:px-10 lg:px-14 border-white/10 bg-white/5 hover:bg-white/10 text-white text-base sm:text-lg lg:text-xl rounded-full transition-all group/btn2 w-full sm:w-auto"
                      aria-label="Contact our strategy team"
                    >
                      <Link
                        href="/contact"
                        className="flex items-center justify-center gap-3"
                      >
                        {ctaSection.data?.ctaSecondary}
                        <ExternalLink
                          className="w-4 h-4 sm:w-5 sm:h-5 opacity-50 group-hover/btn2:opacity-100 transition-opacity"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                  </div>

                  <div className="pt-8 sm:pt-12 flex justify-center">
                    <button
                      className="flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] hover:text-white transition-colors"
                      aria-label="Download the BOS Architecture Whitepaper"
                    >
                      <Layers
                        className="w-3 h-3 sm:w-4 sm:h-4 text-primary"
                        aria-hidden="true"
                      />
                      Architecture Whitepaper v3.2
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
