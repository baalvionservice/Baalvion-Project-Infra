"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, Smile, Frown, Meh, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { KpiData } from "@/lib/types";

interface KpiCardProps {
  kpi: KpiData;
}

export default function KpiCard({ kpi }: KpiCardProps) {
  const { businesses } = useDashboardRefs();
  const found = businesses.find((b) => b.id === kpi.businessId);
  const business = { name: found?.name ?? "Company-wide", country: "" };

  const image = PlaceHolderImages.find((img) => img.id === "business-default");
  const revenueAchievement = (kpi.revenue.actual / kpi.revenue.target) * 100;

  const getReturnRateColor = (rate: number) => {
    if (rate < 5) return "text-green-500";
    if (rate > 5) return "text-red-500";
    return "text-yellow-500";
  };

  const NpsIcon = kpi.nps > 70 ? Smile : kpi.nps > 50 ? Meh : Frown;
  const npsColor =
    kpi.nps > 70
      ? "text-green-500"
      : kpi.nps > 50
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            {image && <AvatarImage src={image.imageUrl} alt={business.name} />}
            <AvatarFallback>{business.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{business.name}</CardTitle>
            <CardDescription>{business.country}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Revenue</p>
          <Progress value={revenueAchievement} className="mt-1 h-2" />
          <p className="text-xs mt-1">
            <span className="font-bold">
              ${(kpi.revenue.actual / 1_000_000).toFixed(2)}M
            </span>
            <span className="text-muted-foreground">
              {" / "}${(kpi.revenue.target / 1_000_000).toFixed(2)}M (
              {revenueAchievement.toFixed(0)}%)
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Profit Margin</p>
          <div className="flex items-center gap-1 font-bold text-lg">
            {kpi.profitMargin.value.toFixed(1)}%
            {kpi.profitMargin.trend === "up" && (
              <ArrowUp className="h-4 w-4 text-green-500" />
            )}
            {kpi.profitMargin.trend === "down" && (
              <ArrowDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Customers</p>
          <div className="flex items-center gap-2 font-bold text-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            {kpi.customers.total.toLocaleString()}
            <span
              className={
                kpi.customers.change >= 0
                  ? "text-green-500 text-xs"
                  : "text-red-500 text-xs"
              }
            >
              ({kpi.customers.change >= 0 ? "+" : ""}
              {kpi.customers.change})
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Return Rate</p>
          <p
            className={`font-bold text-lg ${getReturnRateColor(
              kpi.returnRate
            )}`}
          >
            {kpi.returnRate.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">NPS</p>
          <div className="flex items-center gap-2 font-bold text-lg">
            <NpsIcon className={`h-5 w-5 ${npsColor}`} />
            {kpi.nps}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
