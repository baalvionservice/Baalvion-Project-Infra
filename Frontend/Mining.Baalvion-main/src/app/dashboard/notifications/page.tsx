
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  Archive, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Truck,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationHistoryPage() {
  const [notifications] = useState([
    { id: "1", type: "FINANCE", priority: "HIGH", title: "Escrow Release Confirmed", msg: "Funds for ORD-9921 have been transferred to your connected bank account.", time: "2h ago", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "2", type: "SHIPMENT", priority: "MEDIUM", title: "Delayed Arrival", msg: "M.V. Blue Star arrival at Belem Port delayed by 24h due to weather.", time: "5h ago", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
    { id: "3", type: "RFQ", priority: "MEDIUM", title: "Proposal Expiration", msg: "Your quotation for 'Iron Ore 62% Fe' will expire in 12 hours.", time: "1d ago", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { id: "4", type: "SYSTEM", priority: "LOW", title: "New Feature: AI Compliance", msg: "You can now auto-verify mining licenses using our new AI tool.", time: "2d ago", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/5" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
            <Bell className="h-8 w-8 text-secondary" />
            Trade Alert Center
          </h1>
          <p className="text-muted-foreground mt-1">Audit and manage your historical marketplace notifications.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-200">
            <Archive className="h-4 w-4" /> Archive All
          </Button>
          <Button variant="outline" className="gap-2 text-rose-600 border-rose-100 hover:bg-rose-50 hover:text-rose-700">
            <Trash2 className="h-4 w-4" /> Clear History
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search alerts (ID, Order, Msg)..." className="pl-10 border-none bg-muted/30 focus-visible:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Categories</Button>
          <div className="h-8 w-px bg-border mx-2" />
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold px-3 py-1">
            42 Total Alerts
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="px-8">Everything</TabsTrigger>
          <TabsTrigger value="unread" className="px-8">Unread (2)</TabsTrigger>
          <TabsTrigger value="important" className="px-8">Priority (High)</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {notifications.map((note) => (
            <Card key={note.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={cn("w-1.5", note.priority === "HIGH" ? "bg-rose-500" : note.priority === "MEDIUM" ? "bg-amber-500" : "bg-blue-500")} />
                  <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className={cn("p-4 rounded-2xl shrink-0", note.bg, note.color)}>
                        <note.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{note.title}</h4>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest h-4">{note.type}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 max-w-2xl">{note.msg}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> {note.time}</span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Delivery Verified</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Button variant="outline" size="sm" className="font-bold text-xs gap-2 border-slate-200">
                        Take Action <ArrowUpRight className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-500"><Archive className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Bell className="h-48 w-48" />
        </div>
        <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <h3 className="text-2xl font-bold">Intelligent Delivery Controls</h3>
            <p className="text-primary-foreground/80 leading-relaxed">
              Don't miss a single trade update. You can synchronize your in-platform alerts with your mobile device and designated email addresses for critical supply chain updates.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-secondary" /> Push Notifications Active
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-secondary" /> SMS Failover Ready
              </div>
            </div>
          </div>
          <Button variant="secondary" className="px-10 h-12 font-bold shadow-lg" onClick={() => window.location.href='/dashboard/settings?tab=alerts'}>
            Manage Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
