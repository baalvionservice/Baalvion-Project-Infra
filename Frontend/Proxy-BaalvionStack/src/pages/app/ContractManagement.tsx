import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileText, Calendar, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useSubscription, usePlans, useInvoices, useOrganization } from "@/hooks/usePlatform";
import { format, differenceInDays } from "date-fns";

export default function ContractManagement() {
  const { data: sub, isLoading: loadingSub } = useSubscription();
  const { data: plans } = usePlans();
  const { data: invoicePage } = useInvoices({ pageSize: 6 });
  const { data: org } = useOrganization();

  const currentPlan = plans?.find(p => p.slug === sub?.planSlug);
  const invoices = invoicePage?.data ?? [];

  const periodStart = sub ? new Date(sub.currentPeriodStart) : null;
  const periodEnd = sub ? new Date(sub.currentPeriodEnd) : null;
  const totalDays = periodStart && periodEnd ? differenceInDays(periodEnd, periodStart) : 30;
  const daysRemaining = periodEnd ? Math.max(0, differenceInDays(periodEnd, new Date())) : 0;
  const daysElapsed = totalDays - daysRemaining;
  const progress = Math.round((daysElapsed / totalDays) * 100);

  const bandwidthPct = org && currentPlan
    ? Math.min(100, Math.round((org.bandwidthUsedGb / currentPlan.bandwidthLimitGb) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <SEOHead title="Contract Management" description="View your subscription contract and commitment." />

      <div>
        <h1 className="text-2xl font-bold">Contract Management</h1>
        <p className="text-muted-foreground">Your subscription agreement and usage commitment.</p>
      </div>

      {loadingSub ? (
        <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      ) : !sub ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No active contract.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Contract overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Active Contract
                  </CardTitle>
                  <CardDescription>Subscription #{sub.id}</CardDescription>
                </div>
                <Badge variant={sub.status === "active" ? "success" : "warning"}>{sub.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Plan", value: currentPlan?.name ?? sub.planSlug },
                  { label: "Monthly Rate", value: currentPlan ? `$${currentPlan.monthlyPrice}` : "–" },
                  { label: "Start Date", value: periodStart ? format(periodStart, "MMM d, yyyy") : "–" },
                  { label: "Renewal Date", value: periodEnd ? format(periodEnd, "MMM d, yyyy") : "–" },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Period progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" /> Billing Period
                  </span>
                  <span className="font-medium">{daysRemaining} days remaining</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {daysElapsed} of {totalDays} days elapsed
                </p>
              </div>

              {/* Bandwidth vs commitment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" /> Bandwidth Usage
                  </span>
                  <span className={bandwidthPct > 90 ? "text-destructive font-semibold" : "font-medium"}>
                    {org?.bandwidthUsedGb ?? 0} / {currentPlan?.bandwidthLimitGb ?? "–"} GB
                  </span>
                </div>
                <Progress value={bandwidthPct}
                  className={`h-3 ${bandwidthPct > 90 ? "[&>div]:bg-destructive" : bandwidthPct > 75 ? "[&>div]:bg-warning" : ""}`} />
                {bandwidthPct > 90 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Near bandwidth limit — consider upgrading
                  </p>
                )}
              </div>

              {/* Auto-renewal toggle (display only — real toggle would call API) */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium">Auto-renewal</p>
                  <p className="text-sm text-muted-foreground">Subscription renews automatically on {periodEnd ? format(periodEnd, "MMM d") : "–"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">{sub.cancelAtPeriodEnd ? "Off" : "On"}</Label>
                  <Switch checked={!sub.cancelAtPeriodEnd} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No payment history yet.</p>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border/50" />
                  <div className="space-y-4">
                    {invoices.map((inv, i) => (
                      <div key={inv.id} className="relative">
                        <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 mt-1 ${
                          inv.status === "paid" ? "bg-success border-success" :
                          inv.status === "failed" ? "bg-destructive border-destructive" :
                          "bg-warning border-warning"
                        }`} />
                        <div className="p-3 rounded-lg bg-secondary/30 ml-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-xs text-muted-foreground">{inv.id}</p>
                              <p className="text-sm font-medium mt-0.5">
                                ${((inv.total ?? inv.amount) / 100).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={inv.status === "paid" ? "success" : inv.status === "failed" ? "destructive" : "warning"} className="text-xs">
                                {inv.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(inv.issuedAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
