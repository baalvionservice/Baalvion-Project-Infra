
import { getRevenueMetrics, getPlanDistribution, getRevenueSources } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Users, Repeat, BarChart } from "lucide-react";
import { RevenueTrendsChart, SubscriptionBreakdownChart, RevenueBreakdownChart } from "./charts";

export default async function RevenueAnalyticsPage() {
    const [revenueMetrics, planDistribution, revenueSources] = await Promise.all([
        getRevenueMetrics(),
        getPlanDistribution(),
        getRevenueSources(),
    ]);

    const latestMetric = revenueMetrics[revenueMetrics.length - 1];
    const totalRevenue = revenueMetrics.reduce((acc, curr) => acc + curr.mrr, 0); // Simplified for mock
    const activeSubscriptions = planDistribution.reduce((acc, curr) => acc + curr.count, 0);
    const churnRate = (latestMetric.churn / (activeSubscriptions - latestMetric.newSubscriptions + latestMetric.churn)) * 100;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Revenue Analytics
                </h2>
                <p className="text-muted-foreground">
                    An overview of your platform's financial performance.
                </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (YTD)</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(1)}k</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${latestMetric.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSubscriptions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Churn Rate (Monthly)</CardTitle>
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{churnRate.toFixed(2)}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <RevenueTrendsChart data={revenueMetrics} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <SubscriptionBreakdownChart data={planDistribution} />
                    <RevenueBreakdownChart data={revenueSources} />
                </div>
            </div>
        </div>
    )
}
