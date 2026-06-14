
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Pickaxe, 
  Plus, 
  MapPin, 
  Activity, 
  Database, 
  ShieldCheck, 
  MoreVertical,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const mineSchema = z.object({
  name: z.string().min(3, "Mine name must be at least 3 characters"),
  mineralType: z.string().min(1, "Mineral type is required"),
  location: z.string().min(5, "Full location details required"),
  coordinates: z.string().regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, "Coordinates must be in format: Lat, Long"),
  capacity: z.string().min(1, "Daily capacity is required"),
  reserves: z.string().min(1, "Estimated reserves required"),
});

export default function MineManagement() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof mineSchema>>({
    resolver: zodResolver(mineSchema),
    defaultValues: {
      name: "",
      mineralType: "",
      location: "",
      coordinates: "",
      capacity: "",
      reserves: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof mineSchema>) => {
    setIsSubmitting(true);
    // Simulate industrial verification
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    
    toast({
      title: "Mine Registered",
      description: `${data.name} has been submitted for industrial verification. Our compliance team will audit the coordinates provided.`,
    });
    setOpen(false);
    form.reset();
  };

  const mines = [
    { 
      id: "MINE-01", 
      name: "Blue Ridge Quarry", 
      type: "Iron Ore", 
      location: "Carajás, Brazil", 
      capacity: "5,000 MT/day",
      reserves: "12.4M MT",
      status: "OPERATIONAL" 
    },
    { 
      id: "MINE-02", 
      name: "Summit Lithium Site", 
      type: "Lithium", 
      location: "Pilbara, Australia", 
      capacity: "1,200 MT/day",
      reserves: "4.8M MT",
      status: "OPERATIONAL" 
    },
    { 
      id: "MINE-03", 
      name: "Valley Copper Pit", 
      type: "Copper", 
      location: "Katanga, DRC", 
      capacity: "2,800 MT/day",
      reserves: "8.1M MT",
      status: "MAINTENANCE" 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Mine Management</h1>
          <p className="text-muted-foreground mt-1">Register and monitor your global mineral extraction sites.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 font-bold">
              <Plus className="h-4 w-4" /> Register New Mine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Pickaxe className="h-6 w-6 text-primary" />
                Register Industrial Extraction Site
              </DialogTitle>
              <DialogDescription>Submit your mine site details for Tier 3 export eligibility verification.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 border-y my-4">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mine Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Iron Mountain" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mineralType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mineral Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Copper Concentrate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coordinates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coordinates (Lat, Long)</FormLabel>
                        <FormControl>
                          <Input placeholder="-15.793, -47.882" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Capacity (MT)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reserves"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Est. Reserves (MT)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 12.4M" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Location / Region</FormLabel>
                        <FormControl>
                          <Input placeholder="Country, State, City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    Coordinates will be cross-referenced with satellite imagery and local mining license boundaries.
                  </p>
                </div>
                <DialogFooter className="gap-3">
                  <Button type="button" variant="outline" className="font-bold" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                  <Button disabled={isSubmitting} type="submit" className="bg-primary font-bold px-8 shadow-lg">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Verification"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mines.map((mine) => (
          <Card key={mine.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <Pickaxe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{mine.name}</CardTitle>
                  <CardDescription className="font-mono text-[10px]">{mine.id}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Type</p>
                  <p className="text-sm font-semibold">{mine.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</p>
                  <Badge variant={mine.status === "OPERATIONAL" ? "default" : "secondary"} className={cn(
                    "text-[9px] font-bold uppercase",
                    mine.status === "OPERATIONAL" ? "bg-emerald-50" : "bg-amber-500"
                  )}>
                    {mine.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 p-2 rounded-lg border border-slate-100">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{mine.location}</span>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span className="font-bold text-slate-600">Daily Capacity</span>
                  </div>
                  <span className="font-bold text-primary">{mine.capacity}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span className="font-bold text-slate-600">Est. Reserves</span>
                  </div>
                  <span className="font-bold text-primary">{mine.reserves}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" className="w-full text-xs font-bold group border-slate-200 hover:bg-primary hover:text-white transition-all">
                  View Operational Logs
                  <ChevronRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
