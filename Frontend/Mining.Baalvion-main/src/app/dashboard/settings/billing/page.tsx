
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Download, 
  ArrowRight,
  History,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function UserBillingPage() {
  const [currentPlan] = useState({
    name: "Premium Enterprise",
    price: "$199/mo",
    status: "Active",
    nextBilling: "June 12, 2024",
    usage: {
      aiReports: 12,
      maxAiReports: 50,
      activeListings: 14,
      maxListings: "Unlimited"
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your platform subscription and premium service usage.</p>
        </div>
        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold gap-2 h-11 px-8 shadow-sm">
          <Zap className="h-4 w-4" /> Compare All Plans
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Current Plan */}
          <Card className="border-none shadow-sm overflow-hidden border-l-8 border-l-primary">
            <CardHeader className="bg-primary/5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold">{currentPlan.name}</CardTitle>
                    <Badge className="bg-emerald-500">ACTIVE</Badge>
                  </div>
                  <CardDescription>Professional industrial trading and intelligence.</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{currentPlan.price}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Per Month</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Premium Features Enabled</h4>
                  <ul className="space-y-3">
                    {[
                      "AI Market Intelligence Forecasts",
                      "Priority RFQ Placement",
                      "Reduced Transaction Fees (2.0%)",
                      "24/7 Dedicated Support Lead",
                      "Unlimited Product Listings"
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Monthly Usage</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>AI Market Reports</span>
                        <span className="text-primary">{currentPlan.usage.aiReports} / {currentPlan.usage.maxAiReports}</span>
                      </div>
                      <Progress value={(currentPlan.usage.aiReports / currentPlan.usage.maxAiReports) * 100} className="h-1.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Industrial Listings</span>
                        <span className="text-primary">{currentPlan.usage.activeListings} / {currentPlan.usage.maxListings}</span>
                      </div>
                      <Progress value={10} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Next billing cycle: <strong>{currentPlan.nextBilling}</strong>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="font-bold border-rose-200 text-rose-600 hover:bg-rose-50">Cancel Plan</Button>
                  <Button className="bg-primary font-bold px-8">Update Payment Method</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  { id: "INV-8821", date: "May 12, 2024", amount: "$199.00", status: "PAID" },
                  { id: "INV-8790", date: "Apr 12, 2024", amount: "$199.00", status: "PAID" },
                  { id: "INV-8752", date: "Mar 12, 2024", amount: "$199.00", status: "PAID" },
                ].map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{inv.id}</p>
                        <p className="text-xs text-slate-500">{inv.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <p className="text-sm font-bold text-slate-900">{inv.amount}</p>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-bold">
                        {inv.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="h-48 w-48" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Fee Advantage</CardTitle>
              <CardDescription className="text-slate-400">Premium Benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Trade Fee Saved</span>
                  <span className="font-bold text-emerald-400">$12,420 YTD</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Standard Rate</span>
                  <span className="line-through text-slate-500">3.5%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Your Current Rate</span>
                  <Badge className="bg-emerald-500 font-bold">2.0%</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-11 text-xs">
                View Savings Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-bold">Visa •••• 4242</p>
                    <p className="text-[10px] text-slate-500">Exp: 12/26</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold border-primary text-primary bg-white">DEFAULT</Badge>
              </div>
              <Button variant="ghost" className="w-full text-xs font-bold gap-2 text-primary hover:bg-primary/5">
                Add New Method <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
