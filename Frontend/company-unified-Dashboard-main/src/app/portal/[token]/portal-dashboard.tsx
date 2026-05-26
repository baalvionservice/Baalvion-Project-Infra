"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DollarSign, TrendingUp, Percent, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import RoiChart from "@/components/charts/roi-chart";
import EquityPieChart from "@/components/charts/equity-pie-chart";

import businessesData from "@/lib/data/businesses";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { PortalConfig } from "./page";

interface PortalDashboardProps {
  portal: PortalConfig;
}

export default function PortalDashboard({ portal }: PortalDashboardProps) {
  const myBusinesses = businessesData.filter((b) =>
    portal.includedBusinesses.includes(b.id)
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Investor Portfolio &mdash; {portal.investorName}
        </h1>
        <p className="text-muted-foreground">Prepared by Baalvion</p>
        <Badge
          variant="destructive"
          className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-300"
        >
          Disclaimer: Data is delayed by 24 hours. For informational purposes
          only.
        </Badge>
      </header>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portfolio Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3.2M</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
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
            <div className="text-2xl font-bold">{myBusinesses.length}</div>
            <p className="text-xs text-muted-foreground">
              Across your portfolio
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+18.7%</div>
            <p className="text-xs text-muted-foreground">Annualized return</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Equity Share
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25%</div>
            <p className="text-xs text-muted-foreground">
              Average equity holding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RoiChart />
        </div>
        <div className="lg:col-span-2">
          <EquityPieChart />
        </div>
      </div>

      {/* Businesses */}
      <div>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">
          Portfolio Businesses
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myBusinesses.map((biz) => {
            const image = PlaceHolderImages.find(
              (img) => img.id === biz.imageId
            );
            const equity = biz.equitySplit.find(
              (e) => e.name === portal.investorName
            )?.percentage;
            return (
              <Card key={biz.id}>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <Avatar>
                    <AvatarImage src={image?.imageUrl} alt={biz.name} />
                    <AvatarFallback>{biz.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <CardTitle className="text-lg">{biz.name}</CardTitle>
                    <CardDescription>{biz.country}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <div className="text-sm text-muted-foreground">
                    Your Equity:{" "}
                    <span className="font-bold text-foreground">
                      {equity || "N/A"}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Revenue (Ann.):{" "}
                    <span className="font-bold text-foreground">
                      {biz.currency}{" "}
                      {(biz.currentMetrics.revenue / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <Separator className="mb-4" />
        <p>Last updated: 3 hours ago</p>
        <p>Powered by Baalvion</p>
      </footer>
    </div>
  );
}
