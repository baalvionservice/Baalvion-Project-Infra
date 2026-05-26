"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Play,
  Settings,
  ShieldCheck,
  ChevronRight,
  RefreshCcw,
  Power,
  Cpu,
  LayoutDashboard,
  AlertTriangle,
  Send,
  MessageSquare,
  History,
  Lightbulb,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAutomation } from "@/hooks/use-automation";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AutomationAdminHub() {
  const { rules, toggleRule } = useAutomation();

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              AUTO
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Logic Rule Engine
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <AutoNavItem
            icon={<LayoutDashboard />}
            label="Rule Registry"
            active={true}
          />
          <AutoNavItem
            icon={<Cpu />}
            label="Mitigation Matrix"
            active={false}
          />
          <AutoNavItem
            icon={<History />}
            label="System History"
            active={false}
          />
        </nav>

        <div className="pt-8 border-t border-border space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-plum group"
            asChild
          >
            <Link href="/admin">
              <RefreshCcw className="w-4 h-4 mr-3" /> Master Control
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-ivory relative">
        <header className="flex justify-between items-center bg-white/80 luxury-blur p-8 border-b border-border sticky top-0 z-30">
          <div>
            <h1 className="text-3xl font-headline font-bold italic text-gray-900 uppercase tracking-widest">
              Automation Matrix
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              Operational Intelligence Flows
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-plum text-white hover:bg-black h-10 px-6 rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg">
              <Play className="w-3.5 h-3.5 mr-2" /> EXECUTE GLOBAL AUDIT
            </Button>
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          <Tabs defaultValue="registry" className="w-full">
            <TabsList className="bg-white border border-border h-14 p-1 rounded-none mb-12">
              <TabsTrigger
                value="registry"
                className="rounded-none px-10 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-plum data-[state=active]:text-white"
              >
                Active Registry
              </TabsTrigger>
              <TabsTrigger
                value="mitigation"
                className="rounded-none px-10 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-plum data-[state=active]:text-white"
              >
                Mitigation Matrix
              </TabsTrigger>
            </TabsList>

            <TabsContent value="registry" className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {rules.map((rule) => (
                  <Card
                    key={rule.id}
                    className="bg-white border-border shadow-luxury hover:border-plum transition-all group overflow-hidden"
                  >
                    <CardHeader className="border-b border-border bg-ivory/30">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                            RULE ID: {rule.id}
                          </span>
                          <CardTitle className="font-headline text-xl uppercase tracking-tight">
                            {rule.name}
                          </CardTitle>
                        </div>
                        <div className="p-3 bg-plum/10 rounded-full text-plum">
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                            Trigger
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[8px] uppercase tracking-tighter"
                          >
                            {rule.trigger.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                            Action
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[8px] uppercase tracking-tighter text-plum border-plum/30"
                          >
                            {rule.action.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Power
                            className={cn(
                              "w-3 h-3",
                              rule.enabled ? "text-green-500" : "text-red-500"
                            )}
                          />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-700">
                            {rule.enabled ? "ACTIVE" : "DORMANT"}
                          </span>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent
              value="mitigation"
              className="space-y-12 animate-fade-in"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-plum/5 p-8 border border-plum/10 space-y-4">
                    <div className="flex items-center space-x-3 text-plum">
                      <Lightbulb className="w-5 h-5" />
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">
                        AI Strategic Mitigation
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "Autonomous rules that trigger proactive business
                      mitigation strategies when specific market thresholds are
                      bypassed."
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <MitigationRuleCard
                      hub="India"
                      trigger="Yield < $50k Monthly"
                      mitigation="Dispatch Artisanal Narrative to T1 Segment"
                      impact="High Resonance"
                    />
                    <MitigationRuleCard
                      hub="UAE"
                      trigger="Lead Volume > 50 / 24h"
                      mitigation="Engage AI Sales Overflow Agent"
                      impact="Conversion Stability"
                    />
                    <MitigationRuleCard
                      hub="Global"
                      trigger="SEO Auth < 80%"
                      mitigation="Trigger Metadata Batch Regeneration"
                      impact="Index Protection"
                    />
                  </div>
                </div>

                <aside className="lg:col-span-4 space-y-8">
                  <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                      <ShieldCheck className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400">
                        Integrity Protocol
                      </h4>
                      <p className="text-xs font-light italic leading-relaxed opacity-70">
                        "Every autonomous mitigation must be audited against the
                        Founding Charter of 1924 to ensure brand purity is
                        maintained."
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-blue-900/40 text-blue-400 rounded-none text-[9px] font-bold uppercase h-12"
                      >
                        VIEW MITIGATION LOGS
                      </Button>
                    </div>
                  </Card>
                </aside>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function MitigationRuleCard({
  hub,
  trigger,
  mitigation,
  impact,
}: {
  hub: string;
  trigger: string;
  mitigation: string;
  impact: string;
}) {
  return (
    <Card className="bg-white border-border shadow-sm group hover:border-plum transition-all overflow-hidden rounded-none">
      <div className="p-8 flex items-center justify-between">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Badge
              variant="outline"
              className="text-[8px] uppercase tracking-widest text-slate-400 border-slate-100"
            >
              {hub} HUB
            </Badge>
            <div className="flex items-center space-x-2 text-red-500/60">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {trigger}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-tight text-slate-900">
              {mitigation}
            </h4>
            <p className="text-[10px] text-slate-400 italic">
              Projected Impact: {impact}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <Switch defaultChecked className="data-[state=checked]:bg-plum" />
          <MoreVertical className="w-4 h-4 text-slate-200 group-hover:text-slate-400" />
        </div>
      </div>
    </Card>
  );
}

function AutoNavItem({
  icon,
  label,
  active,
}: {
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center space-x-4 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all group rounded-sm border",
        active
          ? "bg-plum text-white border-plum shadow-md"
          : "text-gray-400 hover:bg-ivory hover:text-plum border-transparent"
      )}
    >
      <span
        className={cn(
          "transition-transform group-hover:scale-110",
          active ? "text-white" : "text-gold"
        )}
      >
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: "w-5 h-5",
        })}
      </span>
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}
