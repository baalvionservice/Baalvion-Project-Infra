import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, FileText, Zap, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useOrganization, useSubscription, usePlans, useInvoices } from "@/hooks/usePlatform";
import { format } from "date-fns";

export default function OrganizationBilling() {
  const { data: org } = useOrganization();
  const { data: sub } = useSubscription();
  const { data: plans } = usePlans();
  const { data: invoicePage, isLoading: loadingInvoices } = useInvoices({ pageSize: 5 });

  const currentPlan = plans?.find(p => p.slug === sub?.planSlug);
  const invoices = invoicePage?.data ?? [];
  const usedPct = org ? Math.min(100, Math.round((org.bandwidthUsedGb / org.bandwidthLimitGb) * 100)) : 0;

  return (
    <div className="space-y-6">
      <SEOHead title="Organization Billing" description="Billing overview for your organization." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization Billing</h1>
          <p className="text-muted-foreground">Billing details for {org?.name ?? "your organization"}.</p>
        </div>
        <Button variant="outline" asChild><Link to="/app/billing">Full Billing <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
      </div>

      {/* Plan & usage */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Current Plan</CardTitle></CardHeader>
          <CardContent>
            {!sub ? <Skeleton className="h-12" /> : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{currentPlan?.name ?? sub.planSlug}</span>
                  <Badge variant={sub.status === "active" ? "success" : "warning"}>{sub.status}</Badge>
                </div>
                {currentPlan && <p className="text-muted-foreground">${currentPlan.monthlyPrice}/month</p>}
                <p className="text-sm text-muted-foreground">
                  Renews {sub.currentPeriodEnd && format(new Date(sub.currentPeriodEnd), "MMM d, yyyy")}
                </p>
                <Button size="sm" variant="outline" asChild className="mt-2">
                  <Link to="/app/billing">Change Plan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-accent" />Bandwidth Usage</CardTitle></CardHeader>
          <CardContent>
            {!org ? <Skeleton className="h-12" /> : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{org.bandwidthUsedGb} GB used</span>
                  <span className="text-muted-foreground">{org.bandwidthLimitGb} GB limit</span>
                </div>
                <Progress value={usedPct}
                  className={`h-3 ${usedPct > 90 ? "[&>div]:bg-destructive" : usedPct > 75 ? "[&>div]:bg-warning" : ""}`} />
                <p className="text-xs text-muted-foreground">{usedPct}% of bandwidth used this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Invoice History</CardTitle>
            <Button variant="outline" size="sm" asChild><Link to="/app/billing/history">View All</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No invoices yet.</TableCell></TableRow>
                ) : invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.issuedAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-semibold">${((inv.total ?? inv.amount) / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "paid" ? "success" : inv.status === "failed" ? "destructive" : "warning"} className="text-xs">
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
