"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Filter, 
  ClipboardList, 
  Clock, 
  MessageSquare,
  Gem,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowUpDown,
  History
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { trackEvent, reportError } from "@/lib/monitoring";

const rfqSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  mineralType: z.string().min(1, "Select a mineral type"),
  grade: z.string().min(1, "Grade requirement is required"),
  quantity: z.string().min(1, "Specify quantity"),
  destination: z.string().min(1, "Destination is required"),
  deadline: z.string().min(1, "Select a deadline"),
  visibility: z.string().default("public"),
});

type RfqFormValues = z.infer<typeof rfqSchema>;

export default function RFQPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-rfqs");
  const [open, setOpen] = useState(false);

  const form = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      title: "",
      mineralType: "",
      grade: "",
      quantity: "",
      destination: "",
      deadline: "",
      visibility: "public",
    }
  });

  const onSubmit = (data: RfqFormValues) => {
    try {
      trackEvent('rfq_created', {
        mineral: data.mineralType, 
        qty: data.quantity,
        visibility: data.visibility 
      });
      toast({
        title: "RFQ Published",
        description: "Your procurement request is now visible to matched suppliers.",
      });
      setOpen(false);
      form.reset();
    } catch (err) {
      reportError(err, 'RFQ Submission');
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred while publishing your RFQ.",
        variant: "destructive"
      });
    }
  };

  const myRfqs = [
    { id: "RFQ-2024-001", mineral: "Copper Concentrate", volume: "10,000 MT", deadline: "May 25, 2024", bids: 12, status: "Open" },
    { id: "RFQ-2024-002", mineral: "Gold Dore Bar", volume: "50kg", deadline: "May 28, 2024", bids: 5, status: "Open" },
    { id: "RFQ-2024-003", mineral: "Iron Ore", volume: "50,000 MT", deadline: "May 15, 2024", bids: 3, status: "Reviewing" },
    { id: "RFQ-2023-098", mineral: "Lithium Hydroxide", volume: "100 MT", deadline: "Closed", bids: 22, status: "Awarded" },
  ];

  const marketplaceRfqs = [
    { id: "RFQ-7721", buyer: "China Const Ltd", mineral: "Iron Ore Fine", grade: "62% Fe", quantity: "25,000 MT", deadline: "2 days", value: "$2.6M" },
    { id: "RFQ-7725", buyer: "Global Infra Group", mineral: "Silica Sand", grade: "99.2% SiO2", quantity: "5,000 MT", deadline: "5 days", value: "$450k" },
    { id: "RFQ-7730", buyer: "Atlas Mining Co", mineral: "Bauxite", grade: "45% Al2O3", quantity: "15,000 MT", deadline: "12 hours", value: "$1.2M" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">RFQ Marketplace</h1>
          <p className="text-muted-foreground mt-1">Participate in competitive procurement or manage your own supply requests.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 font-bold h-11 px-6 shadow-lg">
              <Plus className="h-4 w-4" /> Create New RFQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <ClipboardList className="h-6 w-6 text-secondary" />
                Publish Procurement Request
              </DialogTitle>
              <DialogDescription>Your RFQ will be matched with verified global suppliers.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6 border-y my-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFQ Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Q3 Iron Ore Supply - Rotterdam Port" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="mineralType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mineral Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Mineral" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="iron">Iron Ore</SelectItem>
                            <SelectItem value="copper">Copper Concentrate</SelectItem>
                            <SelectItem value="lithium">Lithium Spodumene</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Grade</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 62% Fe Minimum" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (MT)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Port / Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Durban, ZA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public (All verified suppliers)</SelectItem>
                            <SelectItem value="private">Private (Invited only)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="gap-3">
                  <Button type="button" variant="outline" className="font-bold" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary font-bold px-8">Publish to Marketplace</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Marketplace Total", val: "142", icon: Gem, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active My Bids", val: "08", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "New Proposals", val: "12", icon: MessageSquare, color: "text-primary", bg: "bg-primary/5" },
          { label: "Expiring Soon", val: "05", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
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

      <Tabs defaultValue="my-rfqs" className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b pb-1">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger 
              value="my-rfqs" 
              className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-sm"
            >
              My Procurement
            </TabsTrigger>
            <TabsTrigger 
              value="opportunities" 
              className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-sm"
            >
              Trade Opportunities
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search RFQs..." className="pl-9 h-9 text-xs" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-bold border-slate-200">
              <Filter className="h-3.5 w-3.5" /> Filters
            </Button>
          </div>
        </div>

        <TabsContent value="my-rfqs">
          <Card className="border-none shadow-sm overflow-hidden">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold">RFQ ID</TableHead>
                    <TableHead className="font-bold">Mineral Details</TableHead>
                    <TableHead className="font-bold">Proposals</TableHead>
                    <TableHead className="font-bold">Deadline</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRfqs.map((rfq) => (
                    <TableRow key={rfq.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-primary">{rfq.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{rfq.mineral}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{rfq.volume}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 gap-1.5 font-bold">
                          <Gem className="h-3 w-3" /> {rfq.bids} Bids
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-medium">{rfq.deadline}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          rfq.status === "Open" ? "bg-emerald-100 text-emerald-700" : 
                          rfq.status === "Awarded" ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"
                        )}>
                          {rfq.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="font-bold text-primary gap-2" onClick={() => trackEvent('bid_submitted', { rfq_id: rfq.id })}>
                          Analyze Bids <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <div className="grid lg:grid-cols-3 gap-6">
            {marketplaceRfqs.map((rfq) => (
              <Card key={rfq.id} className="border-none shadow-sm hover:shadow-md transition-all group flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[10px] tracking-widest uppercase">
                      New Request
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                      <Clock className="h-3.5 w-3.5" /> {rfq.deadline} left
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{rfq.mineral}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {rfq.buyer} (Tier 3 Buyer)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Target Quantity</p>
                      <p className="text-sm font-bold text-slate-900">{rfq.quantity}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Grade Required</p>
                      <p className="text-sm font-bold text-slate-900">{rfq.grade}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Estimated Value</p>
                      <p className="text-lg font-bold text-primary">{rfq.value}</p>
                    </div>
                    <Button 
                      className="bg-primary hover:bg-primary/90 font-bold gap-2"
                      onClick={() => trackEvent('bid_submitted', { rfq_id: rfq.id, buyer: rfq.buyer })}
                    >
                      Submit Quote <TrendingUp className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
