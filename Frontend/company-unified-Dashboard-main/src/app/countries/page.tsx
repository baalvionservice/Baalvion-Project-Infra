"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalFinancials } from "@/hooks/use-global-financials";

function formatCurrency(amount: number, currency: string) {
  if (currency === "INR") {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    notation: "compact",
    compactDisplay: "short",
  }).format(amount);
}

export default function CountriesPage() {
  const { businesses, countries: countriesData, fxRates } = useGlobalFinancials();

  const countryStats = countriesData.map((country) => {
    const cb = businesses.filter((b) => b.country === country.name);
    const businessCount = cb.length;
    const totalEmployees = cb.reduce((acc, b) => acc + b.currentMetrics.employees, 0);
    const totalRevenueLocal = cb.reduce((acc, b) => acc + b.currentMetrics.revenue, 0);
    const localCurrency = cb[0]?.currency ?? "USD";
    const totalRevenueUsd = cb.reduce((acc, b) => acc + b.currentMetrics.revenue / (fxRates[b.currency] || 1), 0);
    return { ...country, businessCount, totalEmployees, totalRevenueLocal, totalRevenueUsd, localCurrency };
  });

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Global Operations
          </h1>
          <div className="flex items-center gap-2">
            {countriesData.map((c) => (
              <span key={c.id} className="text-2xl">
                {c.flag}
              </span>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground">
          An overview of your business presence in {countriesData.length}{" "}
          countries.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {countryStats.map((country) => (
          <Card key={country.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-3xl">{country.flag}</span>
                <span>{country.name}</span>
              </CardTitle>
              <CardDescription>{country.continent}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Businesses</p>
                  <p className="text-lg font-bold">{country.businessCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-lg font-bold">
                    {country.totalEmployees.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    country.totalRevenueLocal,
                    country.localCurrency
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  ~${(country.totalRevenueUsd / 1000000).toFixed(1)}M USD
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <Badge
                  variant={
                    country.complianceStatus === "Compliant"
                      ? "default"
                      : "destructive"
                  }
                  className={cn(
                    country.complianceStatus === "Compliant"
                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300"
                      : "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300"
                  )}
                >
                  {country.complianceStatus}
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/countries/${country.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
