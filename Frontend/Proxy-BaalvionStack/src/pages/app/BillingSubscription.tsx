import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { Zap, CreditCard, Calendar, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useSubscription, usePlans, usePaymentMethods, useUsageForecast } from "@/hooks/usePlatform";
import { format } from "date-fns";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "default"> = {
  active: "success", past_due: "warning", cancelled: "destructive", trialing: "default",
};

export default function BillingSubscription() {
  const { data: sub, isLoading: loadingSub } = useSubscription();
  const { data: plans } = usePlans();
  const { data: methods } = usePaymentMethods();
  const { data: forecast } = useUsageForecast();

  const currentPlan = plans?.find(p => p.slug === sub?.planSlug);
  const defaultMethod = methods?.find(m => m.isDefault);

  const periodStart = sub ? new Date(sub.currentPeriodStart) : null;
  const periodEnd = sub ? new Date(sub.currentPeriodEnd) : null;
  const periodProgress = periodStart && periodEnd
    ? Math.min(100, Math.round(((Date.now() - periodStart.getTime()) / (periodEnd.getTime() - periodStart.getTime())) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <SEOHead title="Subscription" description="View and manage your active subscription." />

      <div>
        <h1 className="text-2xl font-bold">Subscription Details</h1>
        <p className="text-muted-foreground">Your current plan and billing cycle.</p>
      </div>

      {loadingSub ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : !sub ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="font-semibold">No active subscription</p>
            <p className="text-sm text-muted-foreground mt-1">Choose a plan to get started.</p>
            <Button className="mt-4" asChild><Link to="/app/billing">View Plans</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status banners */}
          {sub.status === "past_due" && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 text-warning">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Payment past due</p>
                <p className="text-sm">Please update your payment method to avoid service interruption.</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link to="/app/billing/methods">Update Payment</Link>
              </Button>
            </div>
          )}

          {/* Main subscription card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> {currentPlan?.name ?? sub.planSlug} Plan
                </CardTitle>
                <Badge variant={STATUS_VARIANTS[sub.status] ?? "default"}>{sub.status}</Badge>
              </div>
              {currentPlan && (
                <CardDescription className="text-lg font-semibold text-foreground">
                  ${currentPlan.monthlyPrice}<span className="text-sm font-normal text-muted-foreground">/month</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Billing cycle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Billing Period
                  </span>
                  <span>
                    {periodStart && format(periodStart, "MMM d")} – {periodEnd && format(periodEnd, "MMM d, yyyy")}
                  </span>
                </div>
                <Progress value={periodProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{100 - periodProgress}% of period remaining</p>
              </div>

              {/* Usage forecast */}
              {forecast && (
                <div className="p-4 rounded-lg bg-secondary/40 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Bandwidth Forecast</span>
                    <span className={forecast.willExceed ? "text-destructive" : "text-success"}>
                      {forecast.willExceed
                        ? `~${forecast.overageGb?.toFixed(1)} GB overage expected`
                        : <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />On track</span>
                      }
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Projected usage: {forecast.projectedGb.toFixed(0)} GB · {forecast.daysRemaining} days remaining in period
                  </p>
                </div>
              )}

              {/* Plan features */}
              {currentPlan && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Included Features</p>
                  <div className="flex flex-wrap gap-2">
                    {currentPlan.features.map(f => (
                      <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-border/50">
                <Button variant="outline" asChild>
                  <Link to="/app/billing">Change Plan <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
                {sub.cancelAtPeriodEnd ? (
                  <Badge variant="warning">Cancels {periodEnd && format(periodEnd, "MMM d")}</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {defaultMethod ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{defaultMethod.brand ?? defaultMethod.type} •••• {defaultMethod.last4}</p>
                      {defaultMethod.expiry && <p className="text-xs text-muted-foreground">Expires {defaultMethod.expiry}</p>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/app/billing/methods">Manage</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">No default payment method</p>
                  <Button size="sm" asChild><Link to="/app/billing/methods">Add Method</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
