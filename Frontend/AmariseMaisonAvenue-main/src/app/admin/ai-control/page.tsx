"use client";

import React from "react";
import Link from "next/link";
import {
  Settings,
  Zap,
  ShieldCheck,
  Cpu,
  ChevronRight,
  RefreshCcw,
  LayoutDashboard,
  Power,
  Sliders,
  Eye,
  Lock,
  ArrowRight,
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
import { useAI } from "@/hooks/use-ai";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AIControlHub() {
  const { modules, updateModule } = useAI();

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              CORE
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Automation Protocols
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <AINavItem
            icon={<LayoutDashboard />}
            label="Intelligence Hub"
            active={false}
            href="/admin/ai-dashboard"
          />
          <AINavItem
            icon={<Settings />}
            label="Module Control"
            active={true}
            href="/admin/ai-control"
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
              Autonomous Control
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              Configure Maison Intelligence Parameters
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-plum/10 rounded-full text-plum">
              <Sliders className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {modules.map((module) => (
              <Card
                key={module.id}
                className="bg-white border-border shadow-luxury hover:border-plum transition-all overflow-hidden"
              >
                <CardHeader className="border-b border-border bg-ivory/20">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <CardTitle className="font-headline text-xl uppercase tracking-tighter">
                        {module.name}
                      </CardTitle>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
                        Protocol ID: {module.id}
                      </p>
                    </div>
                    <Badge
                      variant={module.enabled ? "default" : "outline"}
                      className={cn(module.enabled ? "bg-plum" : "")}
                    >
                      {module.enabled ? "ACTIVE" : "DORMANT"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700">
                        Module Visibility
                      </p>
                      <p className="text-[9px] text-gray-400 italic">
                        Enable global intelligence execution
                      </p>
                    </div>
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={(val) =>
                        updateModule(module.id, val, module.level)
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700">
                      Automation Level
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {["manual", "assisted", "auto"].map((lv) => (
                        <button
                          key={lv}
                          onClick={() =>
                            updateModule(module.id, module.enabled, lv as any)
                          }
                          className={cn(
                            "h-10 border text-[9px] font-bold uppercase tracking-widest transition-all",
                            module.level === lv
                              ? "bg-plum text-white border-plum shadow-md"
                              : "bg-ivory/50 border-border text-gray-400 hover:bg-white"
                          )}
                        >
                          {lv}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    <div className="flex items-center">
                      <Lock className="w-3 h-3 mr-2 text-gold" />
                      <span>Maison Core Authenticated</span>
                    </div>
                    <span className="italic">Last sync: 12ms</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Global Safety Override */}
          <Card className="bg-black text-white p-12 border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <ShieldCheck className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-8 max-w-2xl">
              <div className="flex items-center space-x-4 text-secondary">
                <Power className="w-8 h-8" />
                <h2 className="text-4xl font-headline font-bold italic">
                  Safety Protocol Alpha
                </h2>
              </div>
              <p className="text-xl font-light italic leading-relaxed opacity-80">
                "Institutional Intelligence is a privilege. In the event of
                market volatility or system degradation, the Master Kill Switch
                will immediately revert all AI modules to Manual Curatorial
                Oversight."
              </p>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="rounded-none border-secondary text-secondary h-14 px-12 text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-secondary hover:text-black"
                >
                  ACTIVATE MASTER OVERRIDE
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function AINavItem({
  icon,
  label,
  active,
  href,
}: {
  icon: any;
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link href={href}>
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
          {React.cloneElement(
            icon as React.ReactElement,
            { className: "w-5 h-5" } as any
          )}
        </span>
        <span>{label}</span>
        {active && <ChevronRight className="w-4 h-4 ml-auto" />}
      </button>
    </Link>
  );
}
