
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  Package, 
  Truck, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ExternalLink,
  BarChart4, 
  ClipboardList, 
  Settings, 
  ShieldCheck, 
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecommendationSection } from "@/components/dashboard/RecommendationSection";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const stats = [
    { title: "Active Orders", value: "12", change: "+2", isUp: true, icon: <Package className="h-5 w-5" /> },
    { title: "Pending RFQs", value: "08", change: "+1", isUp: true, icon: <TrendingUp className="h-5 w-5" /> },
    { title: "In-Transit", value: "04", change: "-1", isUp: false, icon: <Truck className="h-5 w-5" /> },
    { title: "Compliance Status", value: "98%", change: "Good", isUp: true, icon: <AlertCircle className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Overview Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, John. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Download Report</Button>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">New Listing</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  {stat.icon}
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold",
                  stat.isUp ? "text-emerald-500" : "text-rose-500"
                )}>
                  {stat.isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold text-primary mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RecommendationSection />

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest transactions and updates across your portfolio.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-secondary">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: "New Bid Received", desc: "For RFQ #7281 - Iron Ore 62% Fe", time: "2 hours ago", status: "Urgent" },
                { label: "Shipment Update", desc: "M.V. Global Leader has left Port of Durban", time: "5 hours ago", status: "Info" },
                { label: "Payment Confirmed", desc: "Order #9921 - Gold Ore 98% Purity", time: "1 day ago", status: "Success" },
                { label: "Listing Published", desc: "Copper Concentrate - 500 MT", time: "2 days ago", status: "Success" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4 pb-6 border-b last:border-none last:pb-0">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold truncate">{activity.label}</p>
                      <span className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{activity.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{activity.desc}</p>
                    <p className="text-[10px] text-muted-foreground/60">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="relative z-10 space-y-4">
                <CardTitle className="text-xl">Market Intelligence</CardTitle>
                <p className="text-sm text-primary-foreground/70">
                  AI-powered insights show a 5.2% projected increase in Copper demand next quarter.
                </p>
                <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white border-none group">
                  View Full Report <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BarChart4 className="h-24 w-24" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <ShoppingBag className="h-5 w-5 text-secondary" />
                <span className="text-xs font-bold">Buy Now</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <ClipboardList className="h-5 w-5 text-secondary" />
                <span className="text-xs font-bold">New RFQ</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                <span className="text-xs font-bold">Verify Doc</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <Settings className="h-5 w-5 text-secondary" />
                <span className="text-xs font-bold">Settings</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
