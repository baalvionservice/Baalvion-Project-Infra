import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCommit, Zap, Shield, AlertTriangle, Wrench, Plus, RefreshCw } from "lucide-react";

type ChangeType = "feature" | "improvement" | "fix" | "security" | "deprecated" | "breaking";

interface ChangeEntry {
  type: ChangeType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  highlight?: string;
  tag?: string;
  tagVariant?: "success" | "warning" | "destructive" | "secondary";
  changes: ChangeEntry[];
}

const typeConfig: Record<ChangeType, { label: string; icon: typeof Plus; color: string; bg: string }> = {
  feature: { label: "New", icon: Plus, color: "text-success", bg: "bg-success/10" },
  improvement: { label: "Improved", icon: RefreshCw, color: "text-primary", bg: "bg-primary/10" },
  fix: { label: "Fixed", icon: Wrench, color: "text-warning", bg: "bg-warning/10" },
  security: { label: "Security", icon: Shield, color: "text-destructive", bg: "bg-destructive/10" },
  deprecated: { label: "Deprecated", icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-secondary" },
  breaking: { label: "Breaking", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
};

const releases: Release[] = [
  {
    version: "v2.8.0",
    date: "February 20, 2026",
    highlight: "Global Payment System + System Architecture Audit",
    tag: "Latest",
    tagVariant: "success",
    changes: [
      { type: "feature", text: "10-gateway global payment architecture (Stripe, Adyen, Razorpay, Checkout.com, PayU, Square, Authorize.net, Worldpay, Cashfree, Klarna)" },
      { type: "feature", text: "9-state subscription lifecycle engine with grace period, auto-retry, and suspension logic" },
      { type: "feature", text: "System Architecture Audit page with 8-section backend-readiness scorecard" },
      { type: "feature", text: "Account suspension screens: manual, abuse-detected, payment-required states" },
      { type: "feature", text: "Payment required lock screen with feature-level access restrictions" },
      { type: "feature", text: "Changelog page and Cookie Policy page" },
      { type: "feature", text: "Webhook simulation engine with real-time event log and JSON payload viewer" },
      { type: "feature", text: "Revenue dashboard: MRR, ARR, churn, gateway distribution analytics" },
      { type: "improvement", text: "Admin Users now includes manual bandwidth adjustment and credit management" },
      { type: "improvement", text: "Sub Users page now includes ownership transfer flow" },
      { type: "improvement", text: "Billing sidebar grouped into collapsible section" },
      { type: "fix", text: "Resolved /app/audit route returning 404" },
    ],
  },
  {
    version: "v2.7.0",
    date: "February 15, 2026",
    highlight: "Enterprise Account Hierarchy & Multi-Tenant",
    changes: [
      { type: "feature", text: "Global organization switcher supporting multi-tenant navigation (US, EU, India)" },
      { type: "feature", text: "Tenant management admin panel with per-tenant MRR, usage, and suspension" },
      { type: "feature", text: "Enterprise contract management with Net 7/30/60 payment terms" },
      { type: "feature", text: "Admin chargebacks panel with fraud risk scoring (0–100)" },
      { type: "improvement", text: "Role switcher now supports 6 distinct roles: Owner, Admin, Support, Finance, Viewer, Restricted" },
      { type: "improvement", text: "Plan gating now shows feature-level lock indicators per role" },
    ],
  },
  {
    version: "v2.6.0",
    date: "February 8, 2026",
    highlight: "Admin Intelligence Suite",
    changes: [
      { type: "feature", text: "Admin Pricing Simulator: model MRR impact of plan price changes" },
      { type: "feature", text: "Cohort Retention heatmap with expansion revenue tracking" },
      { type: "feature", text: "Global Network Map with latency heatmaps per region" },
      { type: "feature", text: "Risk Center with IP reputation scoring and abuse auto-flagging" },
      { type: "feature", text: "Growth analytics with acquisition funnel and conversion tracking" },
      { type: "improvement", text: "Admin Control Room redesigned with real-time alert center" },
    ],
  },
  {
    version: "v2.5.0",
    date: "January 28, 2026",
    highlight: "Proxy Management Overhaul",
    changes: [
      { type: "feature", text: "Proxy configuration builder: region, ASN, ZIP, city targeting" },
      { type: "feature", text: "Export proxies as CSV, JSON, TXT (one IP per line)" },
      { type: "feature", text: "Proxy detail drawer with log tail, performance charts, session pool controls" },
      { type: "feature", text: "Keyboard shortcuts system with full shortcut reference modal" },
      { type: "feature", text: "Scheduled rotation jobs and webhook configurations" },
      { type: "improvement", text: "Real-time data toggle for dashboard bandwidth and request charts" },
      { type: "fix", text: "Proxy filter pagination edge case with country filter" },
    ],
  },
  {
    version: "v2.4.0",
    date: "January 15, 2026",
    highlight: "Security & Compliance Hardening",
    changes: [
      { type: "security", text: "Session revocation now reflected immediately across all active sessions" },
      { type: "feature", text: "Login history with geo-IP and device information" },
      { type: "feature", text: "IP allowlist management for API key scopes" },
      { type: "feature", text: "GDPR data export and deletion request flow in Compliance page" },
      { type: "feature", text: "Mock SOC 2 Type II, ISO 27001, and DPA report downloads" },
      { type: "improvement", text: "Audit log now supports CSV and JSON export with date filtering" },
    ],
  },
  {
    version: "v2.3.0",
    date: "January 5, 2026",
    highlight: "Public Site Expansion",
    changes: [
      { type: "feature", text: "Integrations ecosystem page: Puppeteer, Playwright, Selenium" },
      { type: "feature", text: "Proxy Comparison matrix with feature-by-type breakdown" },
      { type: "feature", text: "Infrastructure page: global data center map with latency display" },
      { type: "feature", text: "Case Studies page with enterprise customer profiles" },
      { type: "feature", text: "Bandwidth Calculator with GB slider and pricing estimator" },
      { type: "improvement", text: "Status page now includes 90-day uptime chart and incident detail modal" },
    ],
  },
  {
    version: "v2.2.0",
    date: "December 20, 2025",
    highlight: "API v1 Contracts",
    tag: "API",
    tagVariant: "secondary",
    changes: [
      { type: "feature", text: "Formal TypeScript contracts for all domain entities (identity, billing, proxy, events)" },
      { type: "feature", text: "String-based permission model: 24 granular permissions across 6 resource types" },
      { type: "feature", text: "API intent layer simulating async backend calls" },
      { type: "deprecated", text: "Legacy localStorage-based plan state — migrated to PlanState contract" },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <SEOHead
        title="Changelog – Baalvion NetStack"
        description="All notable changes to the Baalvion NetStack proxy SaaS platform. Feature releases, improvements, security patches, and deprecations."
        canonical="/changelog"
      />

      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <GitCommit className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Platform Changelog</span>
        </div>
        <h1 className="text-4xl font-bold mb-3">What's New</h1>
        <p className="text-muted-foreground">
          A complete record of all features, improvements, fixes, and security updates to Baalvion NetStack.
        </p>
      </div>

      {/* API Version notice */}
      <Card variant="glass" className="mb-10">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Current API Version: <span className="font-mono text-primary">v1</span></p>
              <p className="text-xs text-muted-foreground">Base URL: <span className="font-mono">https://api.baalvion.net/v1</span></p>
            </div>
          </div>
          <Badge variant="success">Stable</Badge>
        </CardContent>
      </Card>

      {/* Releases */}
      <div className="space-y-10">
        {releases.map((release, idx) => (
          <div key={release.version} className="relative">
            {/* Timeline line */}
            {idx < releases.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border/50" />
            )}

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>

              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-mono font-bold text-lg">{release.version}</span>
                  {release.tag && <Badge variant={release.tagVariant}>{release.tag}</Badge>}
                  <span className="text-sm text-muted-foreground">{release.date}</span>
                </div>
                {release.highlight && (
                  <p className="font-semibold text-foreground mb-4">{release.highlight}</p>
                )}

                <Card>
                  <CardContent className="p-4 space-y-2">
                    {release.changes.map((change, ci) => {
                      const tc = typeConfig[change.type];
                      const Icon = tc.icon;
                      return (
                        <div key={ci} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${tc.bg} ${tc.color}`}>
                            <Icon className="w-3 h-3" />
                            {tc.label}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{change.text}</p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
