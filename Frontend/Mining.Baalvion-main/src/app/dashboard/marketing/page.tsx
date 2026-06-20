
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, 
  Plus, 
  TrendingUp, 
  Eye, 
  BarChart3, 
  CheckCircle2,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const campaignSchema = z.object({
  name: z.string().min(5, "Campaign name must be at least 5 characters"),
  type: z.enum(['featured', 'banner', 'sponsored'], { required_error: "Please select a campaign type" }),
  targetId: z.string().min(1, "Please select a target product or profile"),
  duration: z.string().min(1, "Select campaign duration"),
  startDate: z.string().min(1, "Start date is required"),
});

const performanceData = [
  { day: 'Mon', views: 1200, clicks: 45 },
  { day: 'Tue', views: 1500, clicks: 58 },
  { day: 'Wed', views: 1100, clicks: 32 },
  { day: 'Thu', views: 1800, clicks: 74 },
  { day: 'Fri', views: 2200, clicks: 92 },
  { day: 'Sat', views: 1400, clicks: 41 },
  { day: 'Sun', views: 1600, clicks: 55 },
];

export default function SupplierMarketingPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCampaigns] = useState([
    { id: "CMP-001", name: "Iron Ore Q3 Boost", type: "Featured Listing", status: "ACTIVE", reach: "12.4k", clicks: 420, ctr: "3.4%" },
    { id: "CMP-002", name: "Lithium Brand Awareness", type: "Homepage Banner", status: "PENDING", reach: "-", clicks: 0, ctr: "0%" },
  ]);

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      type: "featured",
      targetId: "",
      duration: "30",
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: z.infer<typeof campaignSchema>) => {
    setIsSubmitting(true);
    // API ENDPOINT: POST /api/marketing/campaigns
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    toast({ title: "Campaign Submitted", description: "Your promotion is under review by the platform team." });
    setOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-secondary" />
            Marketing & Promotions
          </h1>
          <p className="text-muted-foreground mt-1">Boost your product visibility and reach global buyers through targeted ads.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white font-bold gap-2 shadow-lg h-11 px-6">
              <Plus className="h-4 w-4" /> Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-secondary" />
                Initialize Promotion
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6 border-y my-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Q4 Copper Spotlight" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placement Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="featured">Featured Listing</SelectItem>
                            <SelectItem value="banner">Homepage Banner</SelectItem>
                            <SelectItem value="sponsored">Sponsored Profile</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset to Promote</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="p1">Iron Ore (62% Fe)</SelectItem>
                            <SelectItem value="p2">Copper Cathodes</SelectItem>
                            <SelectItem value="profile">Main Company Profile</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="7">7 Days ($450)</SelectItem>
                            <SelectItem value="30">30 Days ($1,500)</SelectItem>
                            <SelectItem value="90">90 Days ($4,000)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Start</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ad Creative</Label>
                  <div className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 hover:bg-slate-50 transition-colors cursor-pointer border-slate-200 group">
                    <ImageIcon className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors mb-2" />
                    <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Select Banner Assets</p>
                    <p className="text-[9px] text-slate-400 uppercase">1200x400px (Max 5MB)</p>
                  </div>
                </div>
                <DialogFooter className="gap-3 pt-4 border-t">
                  <div className="flex-1 flex items-center gap-2 text-[10px] text-slate-500 italic">
                    <CheckCircle2 className="h-3 w-3" /> Campaigns go live after compliance audit.
                  </div>
                  <Button type="button" variant="outline" className="font-bold" onClick={() => setOpen(false)}>Discard</Button>
                  <Button disabled={isSubmitting} type="submit" className="bg-primary font-bold px-8">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Approval"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Promos", val: "02", icon: Megaphone, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Reach", val: "48.2k", icon: Eye, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Inquiry Lift", val: "+24%", icon: TrendingUp, color: "text-primary", bg: "bg-primary/5" },
          { label: "Ad Spend (MTD)", val: "$2,400", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Engagement Analytics</CardTitle>
              <CardDescription>Daily performance across active campaigns.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-white border-slate-200">Last 7 Days</Badge>
          </CardHeader>
          <CardContent className="h-[350px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4498" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1B4498" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="views" stroke="#1B4498" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="clicks" stroke="#21CEDD" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="h-48 w-48" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Most Engaged Region</span>
                  <span className="font-bold text-primary">Western Europe</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Peak Reach Time</span>
                  <span className="font-bold text-emerald-400">10 AM - 2 PM GMT</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Growth Tip</p>
                <p className="text-sm font-medium leading-relaxed">Promoting your "Responsible Sourcing" badge increases click-through rates by 18%.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
