"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  MapPin,
  Truck,
  Ship,
  Plane,
  Train,
  Globe,
  ShieldCheck,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  Activity,
  Anchor,
  ChevronRight,
  Star,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// NOTE: These are GENERIC, illustrative logistics service categories — not real
// companies, and they carry no ratings/reviews or performance claims.
// TODO(business): Replace with real, contracted logistics partners and their
// verified service data once partner agreements are in place. Do not reintroduce
// third-party brand names (e.g. real carriers) as placeholder content.
const logisticsProviders = [
  {
    id: "LOG-001",
    name: "Global Maritime Logistics",
    type: "Sea Freight",
    routes: ["Asia-Pacific", "Europe", "Americas"],
    specialties: ["Bulk Cargo", "Container Shipping", "Port-to-Port"],
    featured: true,
    transitTime: "14-21 days",
    coverage: "Global",
  },
  {
    id: "LOG-002",
    name: "Industrial Freight Network",
    type: "Air & Road",
    routes: ["Europe", "Africa", "Middle East"],
    specialties: ["Express Delivery", "Customs Clearance", "Last Mile"],
    featured: false,
    transitTime: "3-7 days",
    coverage: "Regional",
  },
  {
    id: "LOG-003",
    name: "Continental Rail Freight",
    type: "Rail Freight",
    routes: ["Asia-Europe", "North America"],
    specialties: ["Heavy Cargo", "Bulk Materials", "Cross-Border"],
    featured: true,
    transitTime: "10-18 days",
    coverage: "Continental",
  },
  {
    id: "LOG-004",
    name: "Bulk Cargo Partner",
    type: "Multi-Modal",
    routes: ["Sub-Saharan Africa", "North Africa"],
    specialties: ["Mining Logistics", "Infrastructure", "Local Expertise"],
    featured: false,
    transitTime: "5-14 days",
    coverage: "Regional",
  },
];

const portStatus = [
  {
    port: "Rotterdam, Netherlands",
    status: "Optimal",
    delay: "0 days",
    color: "emerald",
  },
  {
    port: "Shanghai, China",
    status: "Congested",
    delay: "2-3 days",
    color: "amber",
  },
  {
    port: "Durban, South Africa",
    status: "Optimal",
    delay: "0 days",
    color: "emerald",
  },
  {
    port: "Santos, Brazil",
    status: "Maintenance",
    delay: "5-7 days",
    color: "rose",
  },
  {
    port: "Hamburg, Germany",
    status: "Optimal",
    delay: "0 days",
    color: "emerald",
  },
  {
    port: "Singapore",
    status: "High Traffic",
    delay: "1-2 days",
    color: "amber",
  },
];

export default function LogisticsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");

  const filteredProviders = logisticsProviders.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.specialties.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesType =
      selectedType === "All" || provider.type.includes(selectedType);
    const matchesRegion =
      selectedRegion === "All" ||
      provider.routes.some((r) => r.includes(selectedRegion));

    return matchesSearch && matchesType && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="bg-primary py-16 text-primary-foreground relative overflow-hidden">
        <div
          className="absolute right-0 top-0 p-12 opacity-10"
          aria-hidden="true"
        >
          <Globe className="h-64 w-64" />
        </div>
        <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
            Global Logistics Network
          </Badge>
          <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
            Logistics & Shipping
          </h1>
          <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
            Connect with verified logistics partners for secure, efficient
            transport of minerals and industrial materials worldwide.
          </p>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-12 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 space-y-6">
            <Card className="border-none shadow-sm sticky top-24">
              <CardHeader className="border-b bg-slate-50/50">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Logistics Filters
                </h2>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <label
                    htmlFor="logistics-search"
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    Search Providers
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="logistics-search"
                      placeholder="Company or service type..."
                      className="pl-9 h-12 border-slate-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Transport Mode
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "All", icon: Globe },
                      { label: "Sea", icon: Ship },
                      { label: "Air", icon: Plane },
                      { label: "Rail", icon: Train },
                      { label: "Road", icon: Truck },
                    ].map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        onClick={() => setSelectedType(label)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-xs font-bold",
                          selectedType === label
                            ? "bg-primary text-white border-primary"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="region-select"
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    Coverage Region
                  </label>
                  <select
                    id="region-select"
                    className="w-full h-12 px-3 rounded-md border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                  >
                    <option value="All">All Regions</option>
                    <option value="Asia">Asia-Pacific</option>
                    <option value="Europe">Europe</option>
                    <option value="Americas">Americas</option>
                    <option value="Africa">Africa</option>
                    <option value="Middle East">Middle East</option>
                  </select>
                </div>

                <Button className="w-full bg-secondary text-secondary-foreground font-bold shadow-md h-12">
                  Apply Filters
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Anchor className="h-32 w-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Global Port Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                {portStatus.slice(0, 4).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          p.color === "emerald"
                            ? "bg-emerald-500 animate-pulse"
                            : p.color === "amber"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        )}
                      />
                      <div>
                        <span className="text-xs font-bold block">
                          {p.port}
                        </span>
                        <span className="text-[10px] opacity-60">
                          {p.delay}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase px-2 py-1 rounded",
                        p.color === "emerald"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : p.color === "amber"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                      )}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-11 text-xs mt-4"
                >
                  View All Ports
                </Button>
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1 space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500 font-medium">
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {filteredProviders.length}
                </span>{" "}
                logistics service categories.
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400">
                  Sort by:
                </span>
                <Button
                  variant="outline"
                  className="gap-2 h-10 border-slate-200 font-bold text-xs"
                >
                  <Activity className="h-3 w-3" /> Rating
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {filteredProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className={cn(
                    "border-none shadow-sm hover:shadow-md transition-all group overflow-hidden border-l-4",
                    provider.featured
                      ? "border-l-secondary"
                      : "border-l-transparent"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                                {provider.name}
                              </h3>
                              {provider.featured && (
                                <Badge className="bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border-secondary/20">
                                  Service Category
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-slate-400" />
                                {provider.type}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {provider.transitTime}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {provider.coverage}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                              Service Routes
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {provider.routes.map((route) => (
                                <span
                                  key={route}
                                  className="px-2 py-1 bg-primary/5 text-primary rounded text-xs font-medium"
                                >
                                  {route}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                              Specialties
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {provider.specialties.map((specialty) => (
                                <span
                                  key={specialty}
                                  className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium"
                                >
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-2">
                          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Indicative transit: {provider.transitTime}
                          </div>
                          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                          <div className="text-xs font-bold text-primary flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Onboarded after verification
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full lg:w-48">
                        <Link href="/contact" className="w-full">
                          <Button className="w-full font-bold h-12 gap-2">
                            Request Quote <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href="/contact" className="w-full">
                          <Button
                            variant="outline"
                            className="w-full font-bold border-slate-200 h-12"
                          >
                            Enquire
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12 pt-8 border-t">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 w-fit mx-auto">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Verified Partners
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    All logistics providers undergo strict verification
                    including insurance, licensing, and performance audits.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-secondary/5 w-fit mx-auto">
                    <Activity className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Real-Time Tracking
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Monitor your shipments with GPS tracking, automated updates,
                    and predictive delivery estimates.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 w-fit mx-auto">
                    <Globe className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Global Coverage
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Access logistics networks across global trade corridors with
                    specialized bulk and mineral transport capabilities.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col items-center gap-3 pt-8 text-center">
              <p className="text-xs text-slate-400 max-w-md">
                The categories above are illustrative. Verified logistics partners
                are matched to your shipment after onboarding.
              </p>
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="px-12 border-slate-300 font-bold h-12 text-slate-600"
                >
                  Talk to a Logistics Specialist
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
