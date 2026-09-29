"use client";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Globe,
  ShieldCheck,
  BarChart,
  ExternalLink,
  TrendingUp,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { dashboardApi } from "@/lib/api-client";
import TrafficTrendChart from "@/components/charts/traffic-trend-chart";
import TrafficSourcesChart from "@/components/charts/traffic-sources-chart";

interface DomainDetail {
  id: string; domain: string; businessName: string;
  trafficTrend: { date: string; visitors: number }[];
  topPages: { url: string; views: number; avgTime: string; bounceRate: number }[];
  trafficSources: { name: string; value: number }[];
  seo: { da: number; backlinks: number; keywords: number };
  geoVisitors: { country: string; flag: string; visitors: number; percentage: number }[];
  revenueAttribution: { orders: number; totalValue: number };
}

export default function DomainDetailPage() {
  const params = useParams();
  const domain = String(params?.domain ?? "");
  const [domainData, setDomainData] = useState<DomainDetail | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.domainAnalytics();
        const arr = (Array.isArray(d) ? d : (d as { data?: unknown[] })?.data ?? []) as DomainDetail[];
        if (!cancelled) { setDomainData(arr.find((x) => x.id === domain) ?? null); setLoaded(true); }
      } catch { if (!cancelled) setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [domain]);

  if (!loaded) return null;

  if (!domainData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold">404 - Domain Not Found</h1>
        <p className="text-muted-foreground">
          The domain you are looking for does not exist.
        </p>
        <Link href="/analytics/domains">
          <Button variant="link" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Domains
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/analytics/domains">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Domains
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <Globe className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {domainData.domain}
            </h1>
            <p className="text-muted-foreground">{domainData.businessName}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <TrafficTrendChart data={domainData.trafficTrend} />
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Avg. Time</TableHead>
                    <TableHead>Bounce Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domainData.topPages.map((page) => (
                    <TableRow key={page.url}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {page.url}{" "}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </TableCell>
                      <TableCell>{page.views.toLocaleString()}</TableCell>
                      <TableCell>{page.avgTime}</TableCell>
                      <TableCell>{page.bounceRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <TrafficSourcesChart data={domainData.trafficSources} />
          <Card>
            <CardHeader>
              <CardTitle>SEO Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Domain Authority
                </p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <ShieldCheck className="text-green-500" /> {domainData.seo.da}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Backlinks</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <ExternalLink className="text-blue-500" />{" "}
                  {domainData.seo.backlinks.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Keywords</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <Search className="text-orange-500" />{" "}
                  {domainData.seo.keywords.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Geographic Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Visitors</TableHead>
                  <TableHead>% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domainData.geoVisitors.map((geo) => (
                  <TableRow key={geo.country}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {geo.flag} {geo.country}
                    </TableCell>
                    <TableCell>{geo.visitors.toLocaleString()}</TableCell>
                    <TableCell>{geo.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Attribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Total Orders from Web
              </p>
              <p className="text-3xl font-bold">
                {domainData.revenueAttribution.orders}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Total Revenue from Web
              </p>
              <p className="text-3xl font-bold text-green-600">
                ${domainData.revenueAttribution.totalValue.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
