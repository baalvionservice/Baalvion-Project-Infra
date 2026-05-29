"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock, Building, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

import { useSync } from "@/hooks/use-sync";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";

import DailyRevenueMiniChart from "@/components/charts/daily-revenue-mini-chart";
import OnlineVsOfflinePieChart from "@/components/charts/online-vs-offline-pie-chart";

export default function SyncPage() {
  const { online: onlineSalesData, offline: offlineSalesData, conflicts } = useSync();
  const { businesses: businessesData } = useDashboardRefs();
  const totalToday =
    onlineSalesData.todaysRevenue + offlineSalesData.todaysRevenue;
  const conflictCount = conflicts.length;

  return (
    <div className="space-y-8">
      {/* Top Status Bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last synced:</span>
            <span className="font-medium text-foreground">2 minutes ago</span>
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
          <div className="flex items-center gap-4">
            {conflictCount > 0 ? (
              <Link href="/sync/conflicts">
                <Badge
                  variant="destructive"
                  className="cursor-pointer bg-orange-500 hover:bg-orange-600"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {conflictCount} Conflicts
                </Badge>
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-green-600 font-medium">
                  All systems synced
                </span>
              </div>
            )}
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Online Sales Panel */}
        <Card className="border-blue-500 border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-600">Online Sales</CardTitle>
            <CardDescription>
              Sales from website and mobile app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">
                  ${onlineSalesData.todaysRevenue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orders Today</p>
                <p className="text-2xl font-bold">
                  {onlineSalesData.ordersToday}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg. Order Value
                </p>
                <p className="text-2xl font-bold">
                  ${onlineSalesData.avgOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Top Channels</p>
              <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="bg-blue-500"
                  style={{ width: `${onlineSalesData.topChannels.website}%` }}
                />
                <div
                  className="bg-blue-300"
                  style={{ width: `${onlineSalesData.topChannels.app}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Website: {onlineSalesData.topChannels.website}%</span>
                <span>App: {onlineSalesData.topChannels.app}%</span>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Last 7 Days Revenue</p>
              <DailyRevenueMiniChart
                data={onlineSalesData.revenueLast7Days}
                chartColor="hsl(var(--primary))"
              />
            </div>
          </CardContent>
        </Card>

        {/* Offline Sales Panel */}
        <Card className="border-green-500 border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-600">Offline Sales</CardTitle>
            <CardDescription>In-store and POS transactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">
                  ${offlineSalesData.todaysRevenue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Walk-ins</p>
                <p className="text-2xl font-bold">
                  {offlineSalesData.walkInCustomers}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg. Transaction
                </p>
                <p className="text-2xl font-bold">
                  ${offlineSalesData.avgTransaction.toFixed(2)}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Top Performing Store</p>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">
                    {offlineSalesData.topStore.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {offlineSalesData.topStore.business}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Last 7 Days Revenue</p>
              <DailyRevenueMiniChart
                data={offlineSalesData.revenueLast7Days}
                chartColor="hsl(var(--chart-4))"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Section */}
      <Card>
        <CardHeader>
          <CardTitle>Combined Summary</CardTitle>
          <CardDescription>
            A complete overview of today's sales performance across all
            channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Total Revenue Today
                </p>
                <p className="text-4xl font-bold">
                  ${totalToday.toLocaleString()}
                </p>
              </div>
              <OnlineVsOfflinePieChart
                onlineRevenue={onlineSalesData.todaysRevenue}
                offlineRevenue={offlineSalesData.todaysRevenue}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium mb-2">
              Revenue by Business (Today)
            </p>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead className="text-right">Online</TableHead>
                    <TableHead className="text-right">Offline</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessesData.map((biz) => {
                    // Mocking business-level split for demonstration
                    const online =
                      (Math.random() * onlineSalesData.todaysRevenue) / 2;
                    const offline =
                      (Math.random() * offlineSalesData.todaysRevenue) / 2;
                    return (
                      <TableRow key={biz.id}>
                        <TableCell className="font-medium">
                          {biz.name}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {online.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {offline.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          $
                          {(online + offline).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
