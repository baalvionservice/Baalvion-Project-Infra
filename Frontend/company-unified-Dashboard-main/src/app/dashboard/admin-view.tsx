"use client";
import * as React from "react";
import {
  ArrowUp,
  Briefcase,
  CircleDollarSign,
  Users,
  BellRing,
  Activity,
  Building,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RoleWelcomeBanner } from "@/components/role-welcome-banner";
import businessesData from "@/lib/data/businesses";
import fxRatesData from "@/lib/data/fx-rates.json";
import type { Business, FxRate, BusinessStatus } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import RevenueByBusinessChart from "@/components/charts/revenue-by-business-chart";
import OverallPerformanceChart from "@/components/charts/overall-performance-chart";
import AiInsightsCard from "@/components/ai-insights-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import operationsData from "@/lib/data/operations.json";
import alertsData from "@/lib/data/alerts.json";
import Link from "next/link";
import { PiggyBank } from "lucide-react";
import PushNotificationPrompt from "@/components/push-notification-prompt";
import ProductTour from "@/components/product-tour";
import Confetti from "@/components/confetti";
import SetupChecklist from "@/components/setup-checklist";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const businesses: Business[] = businessesData;
const fxRates: FxRate = fxRatesData;

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-8 lg:col-span-2">
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="grid auto-rows-max items-start gap-8">
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[320px] w-full" />
        </div>
      </div>
    </div>
  );
}

const totalRevenue = businesses.reduce(
  (acc, biz) => acc + biz.currentMetrics.revenue / (fxRates[biz.currency] || 1),
  0
);
const totalProfit = businesses.reduce(
  (acc, biz) => acc + biz.currentMetrics.profit / (fxRates[biz.currency] || 1),
  0
);
const totalEmployees = businesses.reduce(
  (acc, biz) => acc + biz.currentMetrics.employees,
  0
);
const countryCount = new Set(businesses.map((b) => b.country)).size;

const statusColors: Record<BusinessStatus, string> = {
  Active:
    "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
  Growth:
    "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Review:
    "border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
};

const getIconForActivity = (description: string) => {
  if (description.includes("order"))
    return <CircleDollarSign className="h-4 w-4" />;
  if (description.includes("clocked in")) return <Users className="h-4 w-4" />;
  return <Briefcase className="h-4 w-4" />;
};

export default function AdminView() {
  const isMobile = useIsMobile();
  const revenueToday = operationsData.snapshot.todaysRevenue;
  const recentAlerts = alertsData.slice(0, 3);
  const recentActivities = operationsData.activityFeed.slice(0, 5);
  const [tourVisible, setTourVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // New states for setup & celebration
  const [isNewUser, setIsNewUser] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const tourCompleted = localStorage.getItem("baalvion_tour_completed");
    const isDemo = localStorage.getItem("baalvion_demo_mode") === "true";

    // Show setup checklist for non-demo new users
    if (!isDemo && tourCompleted !== "true") {
      setIsNewUser(true);
    }

    const handleStartTour = () => {
      localStorage.removeItem("baalvion_tour_completed");
      setTourVisible(true);
    };

    const handleCelebration = (event: Event) => {
      const customEvent = event as CustomEvent;
      setShowConfetti(true);
      toast({
        title: "🎉 Congratulations!",
        description: customEvent.detail.message,
        className:
          "bg-green-100 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-300",
      });
      setTimeout(() => setShowConfetti(false), 3000); // Confetti lasts 3 seconds
    };

    window.addEventListener("start-tour", handleStartTour);
    window.addEventListener("celebrate", handleCelebration);

    if (tourCompleted !== "true") {
      setTimeout(() => setTourVisible(true), 500);
    }

    const loadingTimer = setTimeout(() => setLoading(false), 1500);

    return () => {
      window.removeEventListener("start-tour", handleStartTour);
      window.removeEventListener("celebrate", handleCelebration);
      clearTimeout(loadingTimer);
    };
  }, [toast]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (isMobile) {
    return (
      <div className="space-y-6">
        <PushNotificationPrompt />
        {isNewUser && <SetupChecklist />}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              ${revenueToday.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-2">
          <Button asChild variant="outline" className="flex-col h-20">
            <Link href="/businesses">
              <Building />
              <span className="text-xs mt-1">Businesses</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-col h-20">
            <Link href="/finance">
              <PiggyBank />
              <span className="text-xs mt-1">Finance</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-col h-20">
            <Link href="/employees">
              <Users />
              <span className="text-xs mt-1">Employees</span>
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing /> Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="text-sm">
                {alert.title}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity /> Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mt-1">
                  {getIconForActivity(activity.description)}
                </div>
                <div>
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.business} - {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Confetti show={showConfetti} />
      <RoleWelcomeBanner />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s a look at your business empire.
        </p>
      </div>
      <PushNotificationPrompt />
      {tourVisible && <ProductTour onComplete={() => setTourVisible(false)} />}
      <div className="space-y-8">
        {isNewUser && <SetupChecklist />}
        <div
          id="dashboard-stats"
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalRevenue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+12.4%</span> vs last month
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Profit
              </CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalProfit / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+18.3%</span> from last month
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Businesses
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businesses.length}</div>
              <p className="text-xs text-muted-foreground">
                Across {countryCount} countries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalEmployees.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+2%</span> from last quarter
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-8 lg:col-span-2">
            <OverallPerformanceChart />
            <Card id="business-table">
              <CardHeader>
                <CardTitle>Business Overview</CardTitle>
                <CardDescription>
                  A summary of all your managed businesses.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">
                          Business
                        </TableHead>
                        <TableHead className="min-w-[100px]">Country</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="text-right min-w-[100px]">
                          Revenue
                        </TableHead>
                        <TableHead className="text-right min-w-[100px]">
                          Profit
                        </TableHead>
                        <TableHead className="text-right min-w-[100px]">
                          Employees
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses.map((biz) => {
                        const image = PlaceHolderImages.find(
                          (img) => img.id === biz.imageId
                        );
                        return (
                          <TableRow key={biz.id}>
                            <TableCell className="min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  {image && (
                                    <AvatarImage
                                      src={image.imageUrl}
                                      alt={biz.name}
                                      data-ai-hint={image.imageHint}
                                    />
                                  )}
                                  <AvatarFallback>
                                    {biz.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="font-medium truncate">
                                  {biz.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[100px]">
                              {biz.country}
                            </TableCell>
                            <TableCell className="min-w-[80px]">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "capitalize",
                                  statusColors[biz.status]
                                )}
                              >
                                {biz.status}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className="text-right min-w-[100px]"
                              id="currency-display"
                            >
                              {biz.currency}{" "}
                              {(biz.currentMetrics.revenue / 1_000_000).toFixed(
                                2
                              )}
                              M
                            </TableCell>
                            <TableCell className="text-right min-w-[100px]">
                              {biz.currency}{" "}
                              {(biz.currentMetrics.profit / 1_000_000).toFixed(
                                2
                              )}
                              M
                            </TableCell>
                            <TableCell className="text-right min-w-[100px]">
                              {biz.currentMetrics.employees.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            id="ai-insights-card"
            className="grid auto-rows-max items-start gap-8"
          >
            <RevenueByBusinessChart />
            <AiInsightsCard />
          </div>
        </div>
      </div>
    </>
  );
}
