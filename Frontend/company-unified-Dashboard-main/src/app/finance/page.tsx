"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, LinkIcon } from "lucide-react";
import NetWorthTrendChart from "@/components/charts/net-worth-trend-chart";
import CostBreakdownChart from "@/components/charts/cost-breakdown-chart";
import ProfitTrendChart from "@/components/charts/profit-trend-chart";
import financeData from "@/lib/data/finance-overview.json";
import businessesData from "@/lib/data/businesses";
import type { Business } from "@/lib/types";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import NetWorthCard from "./components/net-worth-card";
import FinanceStatCards from "./components/finance-stat-cards";
import DailyRevenueChart from "./components/daily-revenue-chart";
import Link from "next/link";

const allBusinesses: Business[] = businessesData;

export default function FinanceOverviewPage() {
  const [isNewUser, setIsNewUser] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const isDemo = localStorage.getItem("baalvion_demo_mode") === "true";
    const setupComplete = localStorage.getItem("setup_complete") === "true";
    if (!isDemo && !setupComplete) {
      setIsNewUser(true);
    }
  }, []);

  if (isNewUser) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Finance Overview
          </h1>
          <p className="text-muted-foreground">
            A comprehensive overview of your entire financial landscape.
          </p>
        </div>
        <EmptyState
          title="Connect a payment gateway"
          description="Your financial dashboard is empty. Connect a payment provider like Stripe or PayPal to start tracking revenue, costs, and profit in real-time."
          imageSeed="finance-chart"
          imageHint="financial chart graph"
          actionButton={
            <Button size="lg">
              <LinkIcon className="mr-2" /> Connect Gateway
            </Button>
          }
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">
            A mobile overview of your finances.
          </p>
        </div>
        <NetWorthCard />
        <FinanceStatCards />
        <DailyRevenueChart />
        <Button asChild className="w-full" size="lg">
          <Link href="/finance/reports">Generate Report</Link>
        </Button>
      </div>
    );
  }

  const { netWorth, financialSummary } = financeData;

  const totals = financialSummary.reduce(
    (acc, summary) => {
      acc.revenue += summary.revenue;
      acc.totalCosts += summary.totalCosts;
      acc.grossProfit += summary.grossProfit;
      acc.netProfit += summary.netProfit;
      return acc;
    },
    { revenue: 0, totalCosts: 0, grossProfit: 0, netProfit: 0 }
  );

  const totalMargin =
    totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;

  const getBusinessName = (businessId: string) => {
    return allBusinesses.find((b) => b.id === businessId)?.name || businessId;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Overview</h1>
        <p className="text-muted-foreground">
          A comprehensive overview of your entire financial landscape.
        </p>
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Net Worth Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1 space-y-4 rounded-lg bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Total Net Worth
            </p>
            <p className="text-5xl font-bold tracking-tight">
              ${(netWorth.total / 1_000_000).toFixed(1)}M
            </p>
            <div className="flex items-center text-green-500">
              <ArrowUp className="h-4 w-4" />
              <span>
                ${(netWorth.change.amount / 1000).toFixed(0)}K (+
                {netWorth.change.percentage}%) this month
              </span>
            </div>
            <div className="space-y-2 pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Assets</span>
                <span className="font-medium">
                  ${(netWorth.breakdown.businessAssets / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash & Liquid</span>
                <span className="font-medium">
                  ${(netWorth.breakdown.cashAndLiquid / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investments</span>
                <span className="font-medium">
                  ${(netWorth.breakdown.investments / 1_000_000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
          <div className="md:col-span-3 h-full">
            <NetWorthTrendChart />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Performance by Business</CardTitle>
          <CardDescription>All figures are in USD.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Total Costs</TableHead>
                  <TableHead className="text-right">Gross Profit</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialSummary.map((summary) => (
                  <TableRow key={summary.businessId}>
                    <TableCell className="font-medium">
                      {getBusinessName(summary.businessId)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${summary.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${summary.totalCosts.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${summary.grossProfit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ${summary.netProfit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={summary.margin > 20 ? "default" : "secondary"}
                        className={cn(
                          summary.margin > 20
                            ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300"
                        )}
                      >
                        {summary.margin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="font-bold text-base">
                  <TableCell>Totals</TableCell>
                  <TableCell className="text-right">
                    ${totals.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${totals.totalCosts.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${totals.grossProfit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${totals.netProfit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalMargin.toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CostBreakdownChart />
        <ProfitTrendChart />
      </div>
    </div>
  );
}
