import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DollarSign, Briefcase, TrendingUp, PieChart } from "lucide-react";
import { RoleWelcomeBanner } from "@/components/role-welcome-banner";
import RoiChart from "@/components/charts/roi-chart";
import EquityPieChart from "@/components/charts/equity-pie-chart";
import businesses from "@/lib/data/businesses";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Business } from "@/lib/types";

export default function InvestorView() {
  const investorBusinessIds = ["biz_1", "biz_3", "biz_5"];
  const myBusinesses: Business[] = businesses.filter((b) =>
    investorBusinessIds.includes(b.id)
  );

  return (
    <div className="space-y-8 min-w-0">
      <RoleWelcomeBanner />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Investor Dashboard
        </h1>
        <p className="text-muted-foreground">Your portfolio at a glance.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">My Businesses</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myBusinesses.length}</div>
            <p className="text-xs text-muted-foreground">
              Investments across your portfolio
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
            <CardTitle className="text-sm font-medium">Equity Share</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25%</div>
            <p className="text-xs text-muted-foreground">
              Average equity holding
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RoiChart />
        </div>
        <div className="lg:col-span-2">
          <EquityPieChart />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">
          My Businesses
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {myBusinesses.map((biz) => {
            const image = PlaceHolderImages.find(
              (img) => img.id === biz.imageId
            );
            const equity = biz.equitySplit.find(
              (e) => e.name === "John Smith"
            )?.percentage;
            return (
              <Card key={biz.id}>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <Avatar>
                    {image && (
                      <AvatarImage src={image.imageUrl} alt={biz.name} />
                    )}
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
                      {equity || 25}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Revenue:{" "}
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
    </div>
  );
}
