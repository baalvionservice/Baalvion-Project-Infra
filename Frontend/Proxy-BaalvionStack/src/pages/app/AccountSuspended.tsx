import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ban, AlertTriangle, ShieldAlert, Mail, Phone, ArrowRight, Clock,
  FileText, ExternalLink, RefreshCw
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

type SuspensionType = "manual" | "abuse" | "payment";

const suspensionConfig: Record<SuspensionType, {
  icon: typeof Ban;
  color: string;
  bgColor: string;
  title: string;
  subtitle: string;
  reason: string;
  canAppeal: boolean;
  canPay: boolean;
}> = {
  manual: {
    icon: ShieldAlert,
    color: "text-warning",
    bgColor: "bg-warning/10 border-warning/30",
    title: "Account Suspended",
    subtitle: "This account has been suspended by an administrator.",
    reason: "Your account was suspended due to a policy violation review. If you believe this is an error, please contact our support team.",
    canAppeal: true,
    canPay: false,
  },
  abuse: {
    icon: Ban,
    color: "text-destructive",
    bgColor: "bg-destructive/10 border-destructive/30",
    title: "Account Blocked – Abuse Detected",
    subtitle: "Suspicious activity was detected on your account.",
    reason: "Our automated systems flagged unusual traffic patterns originating from your account. Specifically: high-frequency requests from multiple geo-mismatched IPs within a 24-hour window. Your account has been placed under mandatory review.",
    canAppeal: true,
    canPay: false,
  },
  payment: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10 border-warning/30",
    title: "Service Suspended – Payment Required",
    subtitle: "Your subscription payment is overdue.",
    reason: "Multiple payment attempts have failed. Your account has been suspended after the 3-day grace period expired. All proxy services and API access are currently disabled.",
    canAppeal: false,
    canPay: true,
  },
};

export default function AccountSuspended() {
  const [suspensionType, setSuspensionType] = useState<SuspensionType>("manual");
  const cfg = suspensionConfig[suspensionType];
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <SEOHead title="Account Suspended" description="Your Baalvion NetStack account has been suspended." />

      <div className="w-full max-w-2xl space-y-6">
        {/* Suspension type switcher — demo only */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Demo: Switch suspension type</p>
          <Tabs value={suspensionType} onValueChange={(v) => setSuspensionType(v as SuspensionType)}>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="abuse">Abuse</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" />
            <TabsContent value="abuse" />
            <TabsContent value="payment" />
          </Tabs>
        </div>

        {/* Main suspension card */}
        <Card className={`border-2 ${cfg.bgColor}`}>
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ${cfg.bgColor}`}>
              <Icon className={`w-10 h-10 ${cfg.color}`} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">{cfg.title}</h1>
              <p className="text-muted-foreground mt-2">{cfg.subtitle}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 text-left border border-border/50">
              <p className="text-sm font-medium mb-1 text-muted-foreground">Reason</p>
              <p className="text-sm">{cfg.reason}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-muted-foreground text-xs">Account ID</p>
                <p className="font-mono font-medium">USR-29481</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-muted-foreground text-xs">Suspended At</p>
                <p className="font-medium">Feb 18, 2026</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-muted-foreground text-xs">Ticket</p>
                <p className="font-mono font-medium">#TKT-9921</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {cfg.canPay && (
                <Button variant="hero" asChild>
                  <Link to="/app/billing/methods">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resolve Payment
                  </Link>
                </Button>
              )}
              {cfg.canAppeal && (
                <Button variant="hero" asChild>
                  <Link to="/contact">
                    <Mail className="w-4 h-4 mr-2" />
                    Submit Appeal
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* What's disabled */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              What's Currently Disabled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Proxy access & generation",
                "API key usage",
                "New API key creation",
                "Dashboard metrics",
                "Bandwidth allocation",
                "Sub-user management",
              ].map(item => (
                <div key={item} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                  <Ban className="w-3 h-3 text-destructive flex-shrink-0" />
                  <span className="text-xs">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/aup" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <FileText className="w-3 h-3" /> Acceptable Use Policy
          </Link>
          <Link to="/contact" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ExternalLink className="w-3 h-3" /> Contact Support
          </Link>
          <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowRight className="w-3 h-3" /> Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
