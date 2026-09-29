
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Filter, 
  Gavel, 
  Clock, 
  Building2, 
  MapPin, 
  Gem,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TenderMarketplace() {
  const [tenders] = useState([
    {
      id: "TND-7721",
      buyer: "Global Infrastructure Group",
      mineral: "Iron Ore Fine (62% Fe)",
      quantity: "250,000 MT",
      deadline: "24h left",
      type: "OPEN",
      location: "Rotterdam, NL",
      status: "OPEN"
    },
    {
      id: "TND-7725",
      buyer: "Asia Pacific Steel",
      mineral: "Coking Coal",
      quantity: "100,000 MT",
      deadline: "3 days",
      type: "PRIVATE",
      location: "Shanghai, CN",
      status: "OPEN"
    },
    {
      id: "TND-7730",
      buyer: "Ministry of Energy (Gov)",
      mineral: "Lithium Hydroxide",
      quantity: "15,000 MT",
      deadline: "5 days",
      type: "GOVERNMENT",
      location: "Oslo, NO",
      status: "OPEN"
    }
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Tender Marketplace</h1>
          <p className="text-muted-foreground mt-1">Participate in large-scale procurement and competitive bidding.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><ShieldAlert className="h-4 w-4" /> Bidding Rules</Button>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <Plus className="h-4 w-4" /> Issue New Tender
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Gavel className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary-foreground/60 uppercase">Active Tenders</p>
                <h3 className="text-2xl font-bold">42 Tenders</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Tenders Won</p>
                <h3 className="text-2xl font-bold text-emerald-700">08</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Bids Pending</p>
                <h3 className="text-2xl font-bold text-amber-700">14</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tenders (ID, Mineral, Location)..." className="pl-10" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
          <div className="h-8 w-px bg-border mx-2" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <ShieldAlert className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Verified Bidders Only</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all">Marketplace</TabsTrigger>
          <TabsTrigger value="my-bids">My Active Bids</TabsTrigger>
          <TabsTrigger value="private">Private Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {tenders.map((tender) => (
              <Card key={tender.id} className="border-none shadow-sm hover:shadow-md transition-all group flex flex-col">
                <CardHeader className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[10px] font-bold border-primary text-primary">
                      {tender.type} TENDER
                    </Badge>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Clock className="h-3 w-3" /> {tender.deadline}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-primary group-hover:text-secondary transition-colors">
                      {tender.mineral}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" /> {tender.buyer}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Volume</p>
                      <p className="text-sm font-bold flex items-center gap-1">
                        <Gem className="h-3 w-3 text-secondary" /> {tender.quantity}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Destination</p>
                      <p className="text-sm font-bold flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" /> {tender.location}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-auto">
                    <div className="flex items-center justify-between mb-4 text-xs">
                      <span className="text-muted-foreground">Current Bids: <span className="font-bold text-primary">12</span></span>
                      <span className="text-muted-foreground">Est. Value: <span className="font-bold text-primary">$15M - $18M</span></span>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 gap-2 group">
                      Review & Submit Bid
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <Card className="border-none shadow-sm bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Tender Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { event: "Government Zinc Auction", date: "Jun 12, 2024", type: "Gov" },
              { event: "Rio Tinto Quarterly Bidding", date: "Jun 15, 2024", type: "Private" },
              { event: "Durban Port Storage Tender", date: "Jun 18, 2024", type: "Open" }
            ].map((e, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-card border shadow-sm">
                <div>
                  <p className="text-sm font-bold text-primary">{e.event}</p>
                  <p className="text-[10px] text-muted-foreground">{e.date}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{e.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-emerald-50/50 border border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-900">Success Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between items-center text-emerald-800">
              <span>Avg. Bid Accuracy</span>
              <span className="font-bold">94%</span>
            </div>
            <div className="flex justify-between items-center text-emerald-800">
              <span>Win Ratio (Last 90d)</span>
              <span className="font-bold">1:4</span>
            </div>
            <div className="flex justify-between items-center text-emerald-800">
              <span>Total Contracted Value</span>
              <span className="font-bold">$42.1M</span>
            </div>
            <Button variant="outline" className="w-full bg-white border-emerald-200 text-emerald-700 font-bold mt-2">
              Download Performance Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
