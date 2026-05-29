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
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Users,
  Server,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useGlobalFinancials } from "@/hooks/use-global-financials";
import CountryPerformanceChart from "@/components/charts/country-performance-chart";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

export default function CountryDetailPage() {
  const params = useParams();
  const countryId = String(params?.country ?? "");
  const { businesses, countries: countriesData, serverCosts } = useGlobalFinancials();
  const country = countriesData.find((c) => c.id === countryId);
  const serverCost = serverCosts.find((s) => s.country === country?.name)?.cost ?? 0;

  if (countriesData.length > 0 && !country) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold">404 - Country Not Found</h1>
        <p className="text-muted-foreground">
          The country you are looking for does not exist.
        </p>
        <Link href="/countries">
          <Button variant="link" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Countries
          </Button>
        </Link>
      </div>
    );
  }

  if (!country) return null; // still loading

  const countryBusinesses = businesses.filter(
    (b) => b.country === country.name
  );
  const totalEmployees = countryBusinesses.reduce(
    (acc, b) => acc + b.currentMetrics.employees,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/countries">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Countries
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{country.flag}</span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {country.name}
            </h1>
            <p className="text-muted-foreground">
              A detailed look at your operations in {country.name}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Businesses in {country.name}</CardTitle>
              <CardDescription>
                All active business units operating within the country.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      Revenue (Local)
                    </TableHead>
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
                        <TableCell>
                          <Badge variant="outline">{biz.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {biz.currency}{" "}
                          {(biz.currentMetrics.revenue / 1000000).toFixed(2)}M
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

          <CountryPerformanceChart
            businesses={countryBusinesses}
            countryName={country.name}
          />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Country Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Businesses</span>
                </div>
                <span className="font-bold">{countryBusinesses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Employees</span>
                </div>
                <span className="font-bold">
                  {totalEmployees.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Infrastructure Costs
                  </span>
                </div>
                <span className="font-bold">
                  ${serverCost.toLocaleString()}/mo
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "flex items-start gap-4 p-4 rounded-md",
                  country.complianceStatus === "Compliant"
                    ? "bg-green-50 dark:bg-green-950"
                    : "bg-orange-50 dark:bg-orange-950"
                )}
              >
                {country.complianceStatus === "Compliant" ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                )}
                <div>
                  <h4 className="font-bold">{country.complianceStatus}</h4>
                  <p className="text-sm text-muted-foreground">
                    {country.complianceStatus === "Compliant"
                      ? "All local regulations and tax laws are being met."
                      : "Review needed for new data privacy regulations."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
