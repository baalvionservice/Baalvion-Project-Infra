
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileSignature, 
  Repeat, 
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState("active");

  const contracts = [
    {
      id: "CTR-2024-001",
      seller: "Zambia Copper Ltd",
      mineral: "Copper Concentrate",
      volume: "5,000 MT / Month",
      delivered: "15,000 MT",
      total: "60,000 MT",
      expiry: "Dec 2025",
      status: "ACTIVE",
      progress: 25
    },
    {
      id: "CTR-2024-005",
      seller: "Atlas Mining Co",
      mineral: "Lithium Spodumene",
      volume: "200 MT / Month",
      delivered: "1,200 MT",
      total: "2,400 MT",
      expiry: "Jun 2026",
      status: "ACTIVE",
      progress: 50
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Contract Framework</h1>
          <p className="text-muted-foreground mt-1">Strategic supply agreements and recurring fulfillment tracking.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><FileText className="h-4 w-4" /> Legal Templates</Button>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <Plus className="h-4 w-4" /> Draft Supply Agreement
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Agreements", val: "08", icon: FileSignature, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Monthly Value", val: "$12.4M", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Fulfillment Rate", val: "98.2%", icon: Repeat, color: "text-primary", bg: "bg-primary/5" },
          { label: "Pending Review", val: "02", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</p>
                  <h3 className="text-xl font-bold">{stat.val}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="active">Active Agreements</TabsTrigger>
          <TabsTrigger value="pending">Drafts & Review</TabsTrigger>
          <TabsTrigger value="completed">Archive</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {contracts.map((contract) => (
              <Card key={contract.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <FileSignature className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contract.seller}</CardTitle>
                      <CardDescription>{contract.id} • {contract.mineral}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">ACTIVE</Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Monthly Quota</p>
                      <p className="text-sm font-bold text-primary">{contract.volume}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">End Date</p>
                      <p className="text-sm font-bold">{contract.expiry}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-muted-foreground">Cumulative Fulfillment</span>
                      <span className="text-primary">{contract.delivered} / {contract.total}</span>
                    </div>
                    <Progress value={contract.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground font-bold">Deliveries</p>
                      <p className="text-sm font-bold">12/48</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground font-bold">Quality</p>
                      <p className="text-sm font-bold text-emerald-600">99%</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground font-bold">Escrow</p>
                      <p className="text-sm font-bold text-primary">Verified</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 text-xs font-bold">View Schedule</Button>
                    <Button className="bg-primary flex-1 text-xs font-bold group">
                      Order Management
                      <ArrowUpRight className="ml-2 h-3 w-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <ShieldCheck className="h-48 w-48" />
        </div>
        <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <h3 className="text-2xl font-bold">Legal & Compliance Shield</h3>
            <p className="text-primary-foreground/80 leading-relaxed">
              Every contract on Baalvion Mining Inc. is legally binding and governed by international trade laws. Our platform provides smart-contract enforcement for penalty clauses and automated milestone payments.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-secondary" /> ICC IncoTerms 2020 Compliant
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-secondary" /> Dispute Resolution Integrated
              </div>
            </div>
          </div>
          <Button variant="secondary" className="px-8 h-12 font-bold shadow-lg">Upgrade to Enterprise</Button>
        </CardContent>
      </Card>
    </div>
  );
}
