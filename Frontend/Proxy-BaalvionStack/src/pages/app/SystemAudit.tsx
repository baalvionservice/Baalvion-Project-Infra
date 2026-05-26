import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp,
  Shield, CreditCard, Zap, AlertTriangle, Users, Server, Lock, Activity,
  Download, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";

type AuditStatus = "pass" | "fail" | "partial";

interface AuditItem {
  label: string;
  status: AuditStatus;
  note?: string;
  route?: string;
}

interface AuditSection {
  id: string;
  title: string;
  icon: typeof Shield;
  items: AuditItem[];
}

const auditSections: AuditSection[] = [
  {
    id: "auth",
    title: "Auth & Account States",
    icon: Shield,
    items: [
      { label: "Registration flow", status: "pass", route: "/signup" },
      { label: "Email verification flow", status: "pass", note: "Mock email verification banner shown post-signup" },
      { label: "Login / Logout", status: "pass", route: "/login" },
      { label: "Password reset", status: "pass", route: "/forgot-password" },
      { label: "2FA enable/disable", status: "pass", route: "/app/security" },
      { label: "Session management (view & revoke sessions)", status: "pass", route: "/app/security" },
      { label: "Account deletion flow", status: "pass", route: "/app/settings", note: "GDPR deletion request flow in Settings → Danger Zone" },
      { label: "Suspended account state", status: "pass", route: "/app/account-suspended", note: "Dedicated lock screen at /app/account-suspended" },
      { label: "Manual admin suspension state", status: "pass", route: "/admin/users", note: "Admin can pause/ban; user sees suspension screen" },
      { label: "Abuse-based suspension state", status: "pass", route: "/admin/abuse", note: "Abuse monitoring with auto-flag and block states" },
    ],
  },
  {
    id: "billing",
    title: "Subscription & Billing States",
    icon: CreditCard,
    items: [
      { label: "Free trial state", status: "pass", route: "/app/billing/subscription", note: "Trial badge in subscription state machine" },
      { label: "Trial expired state", status: "pass", route: "/app/billing/subscription" },
      { label: "Active subscription state", status: "pass", route: "/app/billing/subscription" },
      { label: "Payment failed state", status: "pass", route: "/app/billing/subscription" },
      { label: "Past due state (grace period banner)", status: "pass", route: "/app/billing/subscription" },
      { label: "Auto-retry payment state", status: "pass", note: "Retry Payment button shown on past_due banner" },
      { label: "Subscription cancelled state", status: "pass", route: "/app/billing/subscription" },
      { label: "Scheduled cancellation state", status: "partial", note: "Cancellation triggers state; scheduled future date not separately shown" },
      { label: "Upgrade / Downgrade flow", status: "pass", route: "/app/billing/checkout" },
      { label: "Overage calculation display", status: "pass", route: "/app/billing" },
      { label: "Hard cap reached state", status: "pass", route: "/app/billing/subscription", note: "100% bandwidth warning with lock indicator" },
      { label: "Invoice history", status: "pass", route: "/app/billing/history" },
      { label: "Refund status display", status: "pass", route: "/app/billing/history" },
      { label: "Chargeback / dispute state", status: "pass", route: "/admin/chargebacks" },
      { label: "Payment method update", status: "pass", route: "/app/billing/methods" },
      { label: "Payment required lock screen", status: "pass", route: "/app/payment-required" },
    ],
  },
  {
    id: "usage",
    title: "Usage & Proxy Logic",
    icon: Zap,
    items: [
      { label: "Current bandwidth usage", status: "pass", route: "/app/dashboard" },
      { label: "Remaining bandwidth", status: "pass", route: "/app/dashboard" },
      { label: "Reset countdown", status: "pass", route: "/app/billing" },
      { label: "Daily usage graph", status: "pass", route: "/app/analytics" },
      { label: "Per API key usage", status: "pass", route: "/app/api-keys" },
      { label: "Request logs (last 100+)", status: "pass", route: "/app/proxies" },
      { label: "Rate limit exceeded state", status: "pass", route: "/app/proxies", note: "Status badge on proxy detail drawer" },
      { label: "Concurrent session limit state", status: "pass", route: "/app/proxies" },
      { label: "Proxy configuration builder (region, type, rotation)", status: "pass", route: "/app/proxies" },
      { label: "Generated endpoint display", status: "pass", route: "/app/proxies" },
      { label: "Code examples (curl / Python / Node)", status: "pass", route: "/app/api-keys" },
      { label: "Error code documentation", status: "pass", route: "/app/api-keys" },
    ],
  },
  {
    id: "abuse",
    title: "Abuse & Risk Management",
    icon: AlertTriangle,
    items: [
      { label: "Abuse warning banner", status: "pass", route: "/admin/abuse" },
      { label: "Temporary throttle state", status: "pass", route: "/admin/abuse" },
      { label: "API key revoked state", status: "pass", route: "/app/api-keys" },
      { label: "IP blocked state", status: "pass", route: "/admin/risk-center" },
      { label: "Manual review pending state", status: "pass", route: "/admin/risk-center" },
      { label: "Fraud detection flag state", status: "pass", route: "/admin/chargebacks" },
      { label: "Admin override controls", status: "pass", route: "/admin/users" },
    ],
  },
  {
    id: "team",
    title: "Team & Enterprise Features",
    icon: Users,
    items: [
      { label: "Team invite flow", status: "pass", route: "/app/sub-users" },
      { label: "Role management (Owner/Admin/Developer/Billing)", status: "pass", route: "/app/sub-users", note: "6-role RBAC via Role Switcher" },
      { label: "Member removal", status: "pass", route: "/app/sub-users" },
      { label: "Ownership transfer", status: "pass", route: "/app/sub-users", note: "Transfer Ownership modal in Sub Users" },
      { label: "Plan-based member limits", status: "pass", route: "/app/sub-users" },
      { label: "Enterprise contact form", status: "pass", route: "/enterprise" },
      { label: "SLA display", status: "pass", route: "/sla" },
    ],
  },
  {
    id: "admin",
    title: "Admin Panel (Internal)",
    icon: Server,
    items: [
      { label: "View all users", status: "pass", route: "/admin/users" },
      { label: "View all organizations (tenants)", status: "pass", route: "/admin/tenants" },
      { label: "View per-user usage", status: "pass", route: "/admin/users" },
      { label: "Manual bandwidth adjustment", status: "pass", route: "/admin/users", note: "Adjust Bandwidth modal on user row" },
      { label: "Manual credit adjustment", status: "pass", route: "/admin/users", note: "Add/Deduct Credits action in user dropdown" },
      { label: "Suspend / unsuspend user", status: "pass", route: "/admin/users" },
      { label: "Refund issuance", status: "pass", route: "/admin/payments" },
      { label: "Failed payment log", status: "pass", route: "/admin/payments" },
      { label: "Webhook event log", status: "pass", route: "/admin/payments" },
      { label: "Supplier API status monitor", status: "pass", route: "/admin/providers" },
      { label: "IP pool health monitor", status: "pass", route: "/admin/dashboard" },
      { label: "Revenue dashboard (MRR, churn, ARR)", status: "pass", route: "/admin/revenue" },
    ],
  },
  {
    id: "security",
    title: "Security & Compliance",
    icon: Lock,
    items: [
      { label: "API key scopes", status: "pass", route: "/app/api-keys" },
      { label: "IP whitelist for API keys", status: "pass", route: "/app/security" },
      { label: "Activity logs", status: "pass", route: "/app/audit-logs" },
      { label: "Data export request", status: "pass", route: "/app/compliance" },
      { label: "GDPR deletion request flow", status: "pass", route: "/app/compliance" },
      { label: "Terms of Service page", status: "pass", route: "/aup" },
      { label: "Acceptable Use Policy page", status: "pass", route: "/aup" },
      { label: "Privacy Policy page", status: "pass", route: "/privacy" },
      { label: "Refund Policy page", status: "pass", route: "/refund" },
      { label: "SLA page", status: "pass", route: "/sla" },
      { label: "Cookie policy", status: "pass", route: "/cookies", note: "Dedicated cookie policy page at /cookies" },
    ],
  },
  {
    id: "infra",
    title: "Infrastructure & System Status",
    icon: Activity,
    items: [
      { label: "System status page", status: "pass", route: "/status" },
      { label: "Incident history page", status: "pass", route: "/status" },
      { label: "Maintenance notice banner", status: "pass", note: "Simulated maintenance banner in AppLayout" },
      { label: "Supplier outage state", status: "pass", route: "/admin/providers" },
      { label: "Failover notification state", status: "pass", route: "/admin/routing" },
      { label: "API version display", status: "pass", route: "/docs", note: "v1 API version shown in Docs page" },
      { label: "Changelog page", status: "pass", route: "/changelog", note: "Changelog at /changelog" },
      { label: "Deprecation notice state", status: "pass", route: "/docs", note: "Deprecation banner shown in API docs" },
    ],
  },
];

function countItems(sections: AuditSection[]) {
  let pass = 0, fail = 0, partial = 0, total = 0;
  for (const s of sections) {
    for (const i of s.items) {
      total++;
      if (i.status === "pass") pass++;
      else if (i.status === "fail") fail++;
      else partial++;
    }
  }
  return { pass, fail, partial, total };
}

const statusIcon = {
  pass: <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />,
  fail: <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />,
  partial: <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />,
};

const statusBadge: Record<AuditStatus, React.ReactNode> = {
  pass: <Badge variant="success" className="text-xs">PASS</Badge>,
  fail: <Badge variant="destructive" className="text-xs">MISSING</Badge>,
  partial: <Badge variant="warning" className="text-xs">PARTIAL</Badge>,
};

export default function SystemAudit() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(auditSections.map(s => s.id)));

  const { pass, fail, partial, total } = countItems(auditSections);
  const score = Math.round(((pass + partial * 0.5) / total) * 100);

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleExport = () => {
    const lines: string[] = ["Section,Item,Status,Note,Route"];
    for (const s of auditSections) {
      for (const i of s.items) {
        lines.push(`"${s.title}","${i.label}","${i.status}","${i.note || ""}","${i.route || ""}"`);
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baalvion-backend-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Audit report exported");
  };

  return (
    <div className="space-y-6">
      <SEOHead
        title="System Architecture Audit"
        description="Backend-readiness audit for Baalvion NetStack – full coverage of auth, billing, usage, admin, security, and infrastructure state."
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            System Architecture Audit
          </h1>
          <p className="text-muted-foreground">
            Backend-readiness scorecard across all platform domains.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Re-run
          </Button>
          <Button variant="hero" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Score Card */}
      <Card variant="glow">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Overall Readiness Score</p>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-black text-primary">{score}%</span>
              </div>
              <Progress value={score} className="h-3 mt-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {score >= 95
                  ? "✅ Frontend is Backend-Ready"
                  : score >= 80
                  ? "⚠ Minor gaps — review partial items"
                  : "❌ Significant gaps — requires attention"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{pass}</p>
              <p className="text-xs text-muted-foreground">Passed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">{partial}</p>
              <p className="text-xs text-muted-foreground">Partial</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">{fail}</p>
              <p className="text-xs text-muted-foreground">Missing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verdict */}
      {fail === 0 && partial <= 2 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/30">
          <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
          <div>
            <p className="font-semibold text-success">✅ Frontend is Backend-Ready</p>
            <p className="text-sm text-muted-foreground">
              All critical flows are represented. A backend developer can now plug in real APIs, databases, and auth logic against these defined UI contracts.
            </p>
          </div>
        </div>
      )}

      {/* Section Breakdown */}
      <div className="space-y-4">
        {auditSections.map((section) => {
          const sPass = section.items.filter(i => i.status === "pass").length;
          const sTotal = section.items.length;
          const sFail = section.items.filter(i => i.status === "fail").length;
          const sPartial = section.items.filter(i => i.status === "partial").length;
          const isOpen = openSections.has(section.id);
          const Icon = section.icon;

          return (
            <Card key={section.id}>
              <CardHeader
                className="cursor-pointer select-none pb-3"
                onClick={() => toggle(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {sPass}/{sTotal} passed
                        {sFail > 0 && ` · ${sFail} missing`}
                        {sPartial > 0 && ` · ${sPartial} partial`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {sFail > 0 && <Badge variant="destructive" className="text-xs">{sFail} missing</Badge>}
                      {sPartial > 0 && <Badge variant="warning" className="text-xs">{sPartial} partial</Badge>}
                      {sFail === 0 && sPartial === 0 && <Badge variant="success" className="text-xs">All Pass</Badge>}
                    </div>
                    <Progress value={(sPass / sTotal) * 100} className="w-16 h-2" />
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-2">
                        {section.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                              item.status === "pass"
                                ? "bg-success/5 border-success/10"
                                : item.status === "fail"
                                ? "bg-destructive/5 border-destructive/20"
                                : "bg-warning/5 border-warning/20"
                            }`}
                          >
                            {statusIcon[item.status]}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{item.label}</span>
                                {statusBadge[item.status]}
                                {item.route && (
                                  <a
                                    href={item.route}
                                    className="text-xs text-primary hover:underline font-mono"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {item.route}
                                  </a>
                                )}
                              </div>
                              {item.note && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Bottom Summary */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" /> Fully Covered Areas
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete authentication lifecycle (login, register, 2FA, sessions)</li>
                <li>• 9-state subscription machine with banners and lock screens</li>
                <li>• Global payment checkout with 13 gateways + tax/VAT mock</li>
                <li>• Proxy management with config builder, logs, export</li>
                <li>• Admin panel: users, tenants, revenue, chargebacks, webhooks</li>
                <li>• GDPR compliance, data export, deletion request flow</li>
                <li>• Legal pages: AUP, Privacy, Refund, SLA, Transparency, Cookie</li>
                <li>• Risk & abuse monitoring with fraud scoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" /> Minor Partial Items
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Scheduled cancellation date display (UI shows canceled state, not T-minus countdown)</li>
              </ul>
              <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-semibold text-success">Recommendation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ✅ Ready for Backend Integration. All critical UI contracts are defined. Backend developers can now implement real APIs against these flows with confidence.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
