import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, Lock, AlertTriangle, Clock, ArrowRight, Zap, Ban
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const LOCKED_FEATURES = [
  "Proxy endpoint generation",
  "API key creation",
  "Bandwidth allocation",
  "Sub-user access",
  "Preset management",
  "Analytics export",
];

export default function PaymentRequired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <SEOHead title="Payment Required" description="Update your payment method to restore service access." />

      <div className="w-full max-w-xl space-y-6">
        {/* Lock screen */}
        <Card className="border-2 border-destructive/30 bg-destructive/5">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <Lock className="w-10 h-10 text-destructive" />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-destructive-foreground" />
              </div>
            </div>

            <div>
              <Badge variant="destructive" className="mb-3">Payment Required</Badge>
              <h1 className="text-2xl font-bold">Service Access Locked</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Your subscription payment is past due. Please update your payment method to restore full access.
              </p>
            </div>

            {/* Countdown */}
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">Grace Period Expired</p>
                <p className="text-xs text-muted-foreground">
                  Your 3-day grace period ended on Feb 17, 2026. Account data will be preserved for 30 days.
                </p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3">
              <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/app/billing/methods")}>
                <CreditCard className="w-5 h-5 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => navigate("/app/billing/checkout")}>
                <Zap className="w-5 h-5 mr-2" />
                Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Locked features */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold mb-3 text-destructive flex items-center gap-2">
              <Ban className="w-4 h-4" /> Currently Disabled Features
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LOCKED_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 p-2 text-xs rounded-lg bg-secondary/30 text-muted-foreground">
                  <Lock className="w-3 h-3 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/contact" className="flex items-center gap-1 hover:text-foreground transition-colors">
            Need help? <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
          <Link to="/refund" className="flex items-center gap-1 hover:text-foreground transition-colors">
            Refund Policy <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
