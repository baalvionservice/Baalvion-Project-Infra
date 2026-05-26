import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { CreditCard, FileText, Zap, CheckCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { useSubscription, usePlans, useInvoices, useUsageForecast, useChangePlan } from "@/hooks/usePlatform";
import { format } from "date-fns";

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  growth: "bg-primary/10 text-primary",
  enterprise: "bg-warning/10 text-warning",
};

export default function Billing() {
  const { data: subscription, isLoading: loadingSub } = useSubscription();
  const { data: plans, isLoading: loadingPlans } = usePlans();
  const { data: invoicesPage, isLoading: loadingInvoices } = useInvoices({ pageSize: 5 });
  const { data: forecast } = useUsageForecast();
  const changePlan = useChangePlan();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const recentInvoices = invoicesPage?.data ?? [];
  const currentPlan = plans?.find(p => p.slug === subscription?.planSlug);

  const handleChangePlan = async (slug: string) => {
    setUpgrading(slug);
    await changePlan.mutateAsync(slug);
    setUpgrading(null);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Billing" description="Manage your subscription and billing." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your plan, usage, and payment history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/app/billing/methods"><CreditCard className="w-4 h-4 mr-2" />Payment Methods</Link></Button>
          <Button variant="outline" asChild><Link to="/app/billing/history"><FileText className="w-4 h-4 mr-2" />Invoice History</Link></Button>
        </div>
      </div>

      {/* Current subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSub ? (
            <div className="space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-64" /></div>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{currentPlan?.name ?? subscription.planSlug}</h2>
                    <Badge className={PLAN_COLORS[subscription.planSlug] ?? ""}>{subscription.planSlug}</Badge>
                    <Badge variant={subscription.status === "active" ? "success" : "warning"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {currentPlan && `$${currentPlan.monthlyPrice}/month · `}
                    Renews {format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}
                  </p>
                </div>
                <Button variant="outline" asChild><Link to="/app/billing/subscription">Manage <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
              </div>

              {/* Usage forecast */}
              {forecast && (
                <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Bandwidth Forecast</span>
                    <span className={forecast.willExceed ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {forecast.willExceed ? `~${forecast.overageGb?.toFixed(1)} GB overage expected` : "On track"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Projected {forecast.projectedGb.toFixed(0)} GB · {forecast.daysRemaining} days remaining
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No active subscription.</p>
          )}
        </CardContent>
      </Card>

      {/* Plan picker */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        {loadingPlans ? (
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(plans ?? []).map(plan => {
              const isCurrent = subscription?.planSlug === plan.slug;
              return (
                <Card key={plan.id} className={isCurrent ? "border-primary/50 bg-primary/5" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {isCurrent && <Badge variant="success">Current</Badge>}
                    </div>
                    <CardDescription>
                      <span className="text-2xl font-bold text-foreground">${plan.monthlyPrice}</span>/mo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{plan.bandwidthLimitGb} GB bandwidth</p>
                    <ul className="space-y-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent || changePlan.isPending}
                      onClick={() => handleChangePlan(plan.slug)}>
                      {upgrading === plan.slug ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isCurrent ? "Current Plan" : "Switch to " + plan.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Recent Invoices</CardTitle>
            <Button variant="outline" size="sm" asChild><Link to="/app/billing/history">View All</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : recentInvoices.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map(inv => (
                <div key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{inv.id}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(inv.issuedAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">${((inv.total ?? inv.amount) / 100).toFixed(2)}</span>
                    <Badge variant={inv.status === "paid" ? "success" : inv.status === "failed" ? "destructive" : "warning"}>
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
