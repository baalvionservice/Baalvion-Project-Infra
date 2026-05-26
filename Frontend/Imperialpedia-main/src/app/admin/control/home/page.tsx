"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import {
  Users,
  ShieldCheck,
  Lock,
  Zap,
  Settings,
  ShieldAlert,
  LayoutDashboard,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Database,
  History,
  Bell,
  RotateCcw,
  Palette,
  Megaphone,
  Loader2,
  FileCode,
  ShieldX,
  Network,
  Cpu,
  Globe,
  Search,
  FlaskConical,
  Key,
} from "lucide-react";
import Link from "next/link";
import { systemService } from "@/services/data/system-service";
import { AdminHomeOverview } from "@/types/system";

/**
 * Admin Control Center Home.
 * Primary landing hub for all platform governance and system orchestration modules.
 */
export default function AdminControlCenterHomePage() {
  const [overview, setOverview] = useState<AdminHomeOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await systemService.getAdminHomeOverview();
        if (response.data) setOverview(response.data);
      } catch (e) {
        console.error("Governance overview sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  if (loading || !overview) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Establishing Governance Handshake...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  const modules = [
    {
      label: "Identity Matrix",
      desc: "Manage user directory & states.",
      href: "/admin/control/users",
      icon: Users,
      color: "text-primary",
      badge: 0,
    },
    {
      label: "Access Orchestration",
      desc: "Feature flags & RBAC hub.",
      href: "/admin/control/access",
      icon: Key,
      color: "text-secondary",
      badge: 0,
    },
    {
      label: "Persona Architect",
      desc: "Define system roles.",
      href: "/admin/control/roles",
      icon: Lock,
      color: "text-primary",
      badge: 0,
    },
    {
      label: "Capability Hub",
      desc: "Assign granular permissions.",
      href: "/admin/control/permissions/assign",
      icon: ShieldCheck,
      color: "text-secondary",
      badge: 0,
    },
    {
      label: "Incident Command",
      desc: "Triage production threats.",
      href: "/admin/control/incidents",
      icon: ShieldAlert,
      color: "text-destructive",
      badge: overview.alertsActive,
    },
    {
      label: "Moderation Gate",
      desc: "Process content reports.",
      href: "/admin/control/moderation/approvals",
      icon: ShieldX,
      color: "text-destructive",
      badge: overview.pendingModeration,
    },
    {
      label: "Kernel Logic",
      desc: "Configure global settings.",
      href: "/admin/control/settings",
      icon: Settings,
      color: "text-secondary",
      badge: 0,
    },
    {
      label: "Feature Studio",
      desc: "Toggle system gateways.",
      href: "/admin/control/features",
      icon: Zap,
      color: "text-amber-500",
      badge: 0,
    },
    {
      label: "Identity Studio",
      desc: "Manage brand & visual tokens.",
      href: "/admin/control/branding",
      icon: Palette,
      color: "text-primary",
      badge: 0,
    },
    {
      label: "Discovery Logic",
      desc: "Manage SEO & Sitemaps.",
      href: "/admin/control/seo",
      icon: Search,
      color: "text-secondary",
      badge: 0,
    },
    {
      label: "Broadcast Hub",
      desc: "Manage system alerts.",
      href: "/admin/control/alerts",
      icon: Megaphone,
      color: "text-secondary",
      badge: overview.alertsActive,
    },
    {
      label: "Experiment Hub",
      desc: "A/B testing & Rollouts.",
      href: "/admin/control/experiments",
      icon: FlaskConical,
      color: "text-emerald-500",
      badge: 0,
    },
    {
      label: "Session Command",
      desc: "Monitor active connections.",
      href: "/admin/control/sessions",
      icon: Activity,
      color: "text-primary",
      badge: overview.activeSessions,
    },
    {
      label: "Scaling Hub",
      desc: "Cluster & deployment telemetry.",
      href: "/admin/control/infrastructure",
      icon: Cpu,
      color: "text-secondary",
      badge: 0,
    },
    {
      label: "Distribution Hub",
      desc: "Edge & Multi-Region monitoring.",
      href: "/admin/control/edge",
      icon: Network,
      color: "text-primary",
      badge: 0,
    },
    {
      label: "Content Delivery",
      desc: "CDN & Cache orchestration.",
      href: "/admin/control/cdn",
      icon: Globe,
      color: "text-secondary",
      badge: 0,
    },
    {
      label: "Audit Kernel",
      desc: "Immutable platform logs.",
      href: "/admin/control/audit-trail",
      icon: History,
      color: "text-primary",
      badge: 0,
    },
  ];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Mission Control
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Governance Hub
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Orchestrating the Imperialpedia Index across{" "}
            {formatCompact(overview.pSEONodes)} programmatic nodes.
          </Text>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            System Status: {overview.systemHealth}
          </span>
        </div>
      </header>

      {/* Governance Pulse matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Identity Reach
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompact(overview.totalUsers)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
              Total Active Readers
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Verified Experts
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalCreators}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">
              100% Vetting Compliance
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-destructive/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Integrity Tasks
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.pendingModeration}
            </div>
            <p className="text-[10px] text-destructive font-bold mt-1">
              Awaiting Decision
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Command Nodes
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeSessions}</div>
            <p className="text-[10px] text-primary font-bold mt-1">
              Active Admin Sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Orchestration Grid */}
      <div className="space-y-6">
        <Text variant="h3" className="font-bold border-b border-white/5 pb-4">
          Functional Modules
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="glass-card p-6 hover:border-primary/40 transition-all duration-300 group h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <mod.icon className="h-16 w-16" />
                </div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`p-3 rounded-2xl bg-background/50 border border-white/5 ${mod.color} group-hover:scale-110 transition-transform`}
                    >
                      <mod.icon className="h-6 w-6" />
                    </div>
                    {mod.badge > 0 && (
                      <Badge
                        variant="destructive"
                        className="animate-pulse shadow-lg shadow-destructive/20 h-6 px-2 text-[10px] font-bold"
                      >
                        {mod.badge} Pending
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Text
                      variant="body"
                      weight="bold"
                      className="group-hover:text-primary transition-colors"
                    >
                      {mod.label}
                    </Text>
                    <Text
                      variant="caption"
                      className="text-muted-foreground leading-relaxed"
                    >
                      {mod.desc}
                    </Text>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                      Enter Module
                    </span>
                    <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* System Health Snapshot */}
      <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden text-center lg:text-left">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Database className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <Text variant="h2" className="text-2xl font-bold">
              Platform Scalability Verified
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed max-w-2xl text-base"
            >
              The Intelligence Index has achieved **99.98% SLA** this cycle.
              pSEO Ingestion nodes are synchronized and all functional gateways
              are operating within the standard latency buffer (42ms).
            </Text>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Button
              variant="outline"
              className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5"
              asChild
            >
              <Link href="/admin/control/health">Infrastructure Telemetry</Link>
            </Button>
            <Button
              className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
              asChild
            >
              <Link href="/admin/control/incidents">Incident Response Hub</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
