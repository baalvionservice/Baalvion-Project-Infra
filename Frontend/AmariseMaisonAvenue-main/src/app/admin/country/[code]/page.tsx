"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import {
  BarChart3,
  Package,
  Users,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/mock-data";

/**
 * Layer 3: Jurisdictional Hub Panel.
 * Scoped dashboard for regional administrators.
 */
export default function RegionalHubPanel() {
  const { code } = useParams();
  const countryCode = (code as string) || "us";
  const { scopedTransactions, scopedProducts, scopedInquiries } = useAppStore();

  const countryName = COUNTRIES[countryCode]?.name || "Regional";

  const stats = useMemo(() => {
    const revenue = scopedTransactions.reduce((acc, t) => acc + t.amount, 0);
    return {
      revenue: `$${(revenue / 1000).toFixed(1)}k`,
      products: scopedProducts.length,
      leads: scopedInquiries.length,
      fulfillmentRate: "98.4%",
    };
  }, [scopedTransactions, scopedProducts, scopedInquiries]);

  return (
    <div className="space-y-12 animate-fade-in font-body">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-gold">
            <Globe className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              Tactical Layer 3
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            {countryName} Hub
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Jurisdictional oversight for the {countryName} market node.
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <Badge
            variant="outline"
            className="bg-gold/10 text-gold border-gold/20 h-10 px-6 rounded-none text-[10px] font-bold uppercase tracking-widest"
          >
            Hub Node: Active
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsTile
          label="Regional Yield"
          value={stats.revenue}
          trend="+12.4%"
          icon={<BarChart3 />}
        />
        <StatsTile
          label="Registry Count"
          value={stats.products}
          trend="Verified"
          icon={<Package />}
        />
        <StatsTile
          label="Active Leads"
          value={stats.leads}
          trend="High Intent"
          icon={<Users />}
        />
        <StatsTile
          label="SLA Compliance"
          value={stats.fulfillmentRate}
          trend="Optimal"
          icon={<ShieldCheck />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Card className="bg-[#111113] border-white/5 rounded-none shadow-2xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-white font-headline text-2xl uppercase italic">
              Recent Hub Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {scopedTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white/20">
                      ASSET
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/80 uppercase tracking-tight">
                        {tx.artifactName || "Acquisition"}
                      </p>
                      <p className="text-[9px] text-white/20 font-mono">
                        REF: {tx.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white tabular">
                      ${tx.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[7px] h-4 px-1 border-white/5 text-white/40 uppercase"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-white/5 p-10 flex flex-col justify-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Clock className="w-40 h-40 text-gold" />
          </div>
          <h3 className="text-3xl font-headline font-bold italic tracking-tight text-white leading-none">
            Hub Logistics
          </h3>
          <p className="text-sm font-light italic text-white/60 leading-relaxed max-w-sm">
            "Local fulfillment nodes in {countryName} are operating at 100%
            capacity. Average white-glove dispatch time is 4.2 hours
            post-settlement."
          </p>
          <div className="space-y-4 pt-6 border-t border-white/10">
            <HubProgress label="Preparation" val={92} />
            <HubProgress label="Dispatch" val={85} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatsTile({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: any;
  trend: string;
  icon: any;
}) {
  return (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-4 hover:border-gold/40 transition-all rounded-none shadow-xl">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">
          {label}
        </span>
        <div className="text-white/20">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
        </div>
      </div>
      <div className="text-3xl font-headline font-bold italic text-white tabular">
        {value}
      </div>
      <div className="flex items-center text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
        <ArrowUpRight className="w-3 h-3 mr-1" /> {trend}
      </div>
    </Card>
  );
}

function HubProgress({ label, val }: { label: string; val: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-white/40">
        <span>{label} Velocity</span>
        <span>{val}%</span>
      </div>
      <div className="h-0.5 bg-white/5 w-full">
        <div className="h-full bg-gold" style={{ width: `${val}%` }} />
      </div>
    </div>
  );
}
