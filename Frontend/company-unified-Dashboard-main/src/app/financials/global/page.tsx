"use client";

import { useMemo, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DollarSign, Percent, TrendingUp } from "lucide-react";
import OverallPerformanceChart from "@/components/charts/overall-performance-chart";
import RevenueByCountryChart from "@/components/charts/revenue-by-country-chart";
import CountryPerformanceChart from "@/components/charts/country-performance-chart";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useGlobalFinancials } from "@/hooks/use-global-financials";

function GlobalFinancialsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCountry = searchParams.get("country") || "global";

  const { businesses, countries: countriesData, serverCosts: serverCostsData, fxRates } = useGlobalFinancials();

  // Global aggregates (USD-converted) from live data.
  const globalStats = useMemo(() => {
    const totalRevenue = businesses.reduce((acc, biz) => acc + biz.currentMetrics.revenue / (fxRates[biz.currency] || 1), 0);
    const totalCosts = serverCostsData.reduce((acc, cost) => acc + cost.cost, 0) * 12;
    const operationalProfit = businesses.reduce((acc, biz) => acc + biz.currentMetrics.profit / (fxRates[biz.currency] || 1), 0);
    const netProfit = operationalProfit - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    return { totalRevenue, totalCosts, netProfit, profitMargin };
  }, [businesses, serverCostsData, fxRates]);

  const countryFinancials = useMemo(() => countriesData.map((country) => {
    const cb = businesses.filter((b) => b.country === country.name);
    const revenue = cb.reduce((acc, b) => acc + b.currentMetrics.revenue / (fxRates[b.currency] || 1), 0);
    const profit = cb.reduce((acc, b) => acc + b.currentMetrics.profit / (fxRates[b.currency] || 1), 0);
    const serverCost = serverCostsData.find((sc) => sc.country === country.name)?.cost || 0;
    return { name: country.name, revenue, costs: serverCost * 12, profit: profit - serverCost * 12 };
  }), [businesses, countriesData, serverCostsData, fxRates]);

  const handleCountryChange = (countryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (countryId === "global") {
      params.delete("country");
    } else {
      params.set("country", countryId);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const countryDetails = useMemo(() => {
    if (selectedCountry === "global") return null;
    return countriesData.find((c) => c.id === selectedCountry);
  }, [selectedCountry]);

  const countryBusinesses = useMemo(() => {
    if (selectedCountry === "global" || !countryDetails) return [];
    return businesses.filter((b) => b.country === countryDetails.name);
  }, [selectedCountry, countryDetails]);

  const serverCostsWithRevenue = useMemo(() => {
    return serverCostsData.map((cost) => {
      const countryBusinesses = businesses.filter(
        (b) => b.country === cost.country
      );
      const totalRevenue = countryBusinesses.reduce(
        (acc, b) => acc + b.currentMetrics.revenue / (fxRates[b.currency] || 1),
        0
      );
      const percentageOfRevenue =
        totalRevenue > 0 ? ((cost.cost * 12) / totalRevenue) * 100 : 0;
      return { ...cost, percentageOfRevenue };
    });
  }, [serverCostsData, businesses, fxRates]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Global Financials
          </h1>
          <p className="text-muted-foreground">
            An overview of your global financial performance.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Select value={selectedCountry} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global View</SelectItem>
              {countriesData.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCountry === "global" ? (
        // Global View
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue (USD)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(globalStats.totalRevenue / 1000000).toFixed(1)}M
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Costs (USD)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(globalStats.totalCosts / 1000000).toFixed(2)}M
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Net Profit (USD)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(globalStats.netProfit / 1000000).toFixed(1)}M
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Profit Margin
                </CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {globalStats.profitMargin.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <RevenueByCountryChart data={countryFinancials} />
            </div>
            <div className="lg:col-span-2">
              <OverallPerformanceChart />
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4 bg-green-50 dark:bg-green-950 rounded-t-lg">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <CardDescription>Biggest Revenue Growth (MoM)</CardDescription>
                <CardTitle>India (+21%)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                TechCorp India's launch of the new AI-powered analytics tool has
                driven a significant increase in monthly recurring revenue.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        // By Country View
        <div className="space-y-8">
          {countryDetails && (
            <div>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{countryDetails.flag}</span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {countryDetails.name} Financials
                  </h2>
                  <p className="text-muted-foreground">
                    A detailed look at your operations in {countryDetails.name}.
                  </p>
                </div>
              </div>
            </div>
          )}
          {countryBusinesses.length > 0 && (
            <CountryPerformanceChart
              businesses={countryBusinesses}
              countryName={countryDetails?.name || ""}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Business Breakdown</CardTitle>
              <CardDescription>
                All businesses operating within {countryDetails?.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countryBusinesses.map((biz) => {
                    const image = PlaceHolderImages.find(
                      (img) => img.id === biz.imageId
                    );
                    return (
                      <TableRow key={biz.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {image && (
                                <AvatarImage
                                  src={image.imageUrl}
                                  alt={biz.name}
                                />
                              )}
                              <AvatarFallback>
                                {biz.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{biz.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{biz.status}</TableCell>
                        <TableCell className="text-right">
                          {biz.currency}{" "}
                          {(biz.currentMetrics.revenue / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell className="text-right">
                          {biz.currency}{" "}
                          {(biz.currentMetrics.profit / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell className="text-right">
                          {biz.currentMetrics.employees}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Server Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Server Costs</CardTitle>
          <CardDescription>
            Monthly infrastructure costs by country.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Cloud Provider</TableHead>
                <TableHead>Services</TableHead>
                <TableHead className="text-right">Monthly Cost (USD)</TableHead>
                <TableHead className="text-right">% of Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serverCostsWithRevenue.map((cost) => (
                <TableRow key={cost.country}>
                  <TableCell>{cost.country}</TableCell>
                  <TableCell>{cost.provider}</TableCell>
                  <TableCell>{cost.services}</TableCell>
                  <TableCell className="text-right">
                    ${cost.cost.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {cost.percentageOfRevenue.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
function GlobalFinancialsFallback() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-5 w-80 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="w-full sm:w-auto">
          <div className="h-10 w-full sm:w-[200px] bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function GlobalFinancialsPage() {
  return (
    <Suspense fallback={<GlobalFinancialsFallback />}>
      <GlobalFinancialsContent />
    </Suspense>
  );
}
