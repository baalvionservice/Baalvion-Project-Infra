
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  ThumbsUp, 
  Flag, 
  CheckCircle2, 
  Clock, 
  Award,
  Filter,
  Search,
  AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState("received");

  const recentReviews = [
    {
      id: "REV-101",
      author: "China Const Ltd",
      role: "Buyer",
      order: "ORD-9921",
      rating: 5,
      comment: "Excellent grade consistency. The Iron Ore met all specifications and delivery was ahead of schedule.",
      date: "2 days ago",
      categories: { quality: 5, delivery: 5, comms: 4, prof: 5 }
    },
    {
      id: "REV-098",
      author: "Blue Ridge Logistics",
      role: "Logistics",
      order: "SHP-105",
      rating: 4,
      comment: "Loading process was efficient, though documentation took slightly longer than expected.",
      date: "1 week ago",
      categories: { quality: 0, delivery: 4, comms: 3, prof: 4 }
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Reputation & Reviews</h1>
          <p className="text-muted-foreground mt-1">Manage your platform standing and feedback from trade partners.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Rank</p>
            <p className="text-lg font-bold text-primary">Top 5% Platinum</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 border-primary text-primary font-bold text-sm bg-primary/5">
            Trust Score: 94/100
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Reputation Summary</CardTitle>
            <CardDescription>Aggregate performance across all verified categories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6 bg-muted/30 rounded-xl border border-dashed">
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-6 w-6 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h3 className="text-4xl font-bold text-primary">4.8 <span className="text-lg text-muted-foreground">/ 5.0</span></h3>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Based on 142 reviews</p>
            </div>

            <div className="space-y-5">
              {[
                { label: "Product Quality", val: 98, color: "bg-primary" },
                { label: "Delivery Reliability", val: 92, color: "bg-secondary" },
                { label: "Communication", val: 88, color: "bg-amber-500" },
                { label: "Professionalism", val: 100, color: "bg-emerald-500" },
              ].map((stat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="text-primary">{stat.val}%</span>
                  </div>
                  <Progress value={stat.val} className="h-1.5" />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <Award className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-700">Platinum Partner</p>
                  <p className="text-[10px] text-emerald-600 leading-tight">Your Trust Score is in the top 2% of reliable sellers globally.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="bg-muted/50 w-full justify-start p-1 h-auto gap-1">
              <TabsTrigger value="received" className="px-6 py-2">Reviews Received</TabsTrigger>
              <TabsTrigger value="pending" className="px-6 py-2">Pending Your Feedback (2)</TabsTrigger>
              <TabsTrigger value="given" className="px-6 py-2">Reviews Given</TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4 pt-4">
              <div className="flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm mb-6 border">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input placeholder="Search comments..." className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-none focus:ring-0" />
                </div>
                <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" /> Filter By Rating</Button>
              </div>

              {recentReviews.map((rev) => (
                <Card key={rev.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg border border-primary/20">
                          {rev.author[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-slate-900">{rev.author}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{rev.role} • Order {rev.order}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn(
                              "h-4 w-4",
                              i < rev.rating ? "fill-amber-400 text-amber-400" : "text-muted"
                            )} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed italic bg-muted/20 p-4 rounded-lg border-l-4 border-l-primary/30">
                      "{rev.comment}"
                    </p>
                    <div className="flex items-center justify-between pt-4 mt-2">
                      <div className="flex gap-6">
                        <button className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors">
                          <ThumbsUp className="h-3.5 w-3.5" /> Helpful (12)
                        </button>
                        <button className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-rose-500 transition-colors">
                          <Flag className="h-3.5 w-3.5" /> Report Integrity Issue
                        </button>
                      </div>
                      <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-100">
                        <CheckCircle2 className="h-2 w-2 mr-1" /> Verified Trade
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="pt-4 space-y-4">
              {[
                { order: "ORD-9918", partner: "Atlas Mining Co", date: "May 12", type: "Seller" },
                { order: "SHP-1021", partner: "Global Freight Ltd", date: "May 14", type: "Logistics" }
              ].map((item, idx) => (
                <Card key={idx} className="border-none shadow-sm bg-primary/5 border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-1">
                        <h4 className="font-bold text-primary flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Rate Your Recent Trade
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Order <strong>{item.order}</strong> with <strong>{item.partner}</strong> ({item.type}) was completed on {item.date}.
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold px-8 shadow-sm">
                            Write Verified Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-headline font-bold text-primary">Review: {item.partner}</DialogTitle>
                            <CardDescription>Verified Review for Order {item.order}. Constructive feedback improves marketplace safety.</CardDescription>
                          </DialogHeader>
                          <div className="space-y-8 py-6">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                              {[
                                { label: "Material Quality", key: "quality" },
                                { label: "Delivery Speed", key: "delivery" },
                                { label: "Communication", key: "comms" },
                                { label: "Professionalism", key: "prof" },
                              ].map((cat) => (
                                <div key={cat.key} className="space-y-3">
                                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat.label}</Label>
                                  <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} className="h-6 w-6 text-muted hover:text-amber-400 cursor-pointer transition-colors hover:fill-amber-400" />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed Experience</Label>
                              <Textarea placeholder="Describe the material grade consistency, transit transparency, or overall professionalism..." className="min-h-[120px] bg-muted/30" />
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-700 leading-relaxed">
                                Reviews are immutable once published. Ensure all technical grade specifications mentioned match the final inspection report.
                              </p>
                            </div>
                          </div>
                          <DialogFooter className="gap-3">
                            <Button variant="outline" className="font-bold">Discard Draft</Button>
                            <Button className="bg-primary font-bold px-8">Publish Verified Review</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
