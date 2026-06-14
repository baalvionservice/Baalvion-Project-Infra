
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory, TrendingUp, AlertCircle, CheckCircle2, History, ArrowRight, Loader2, Gem, ClipboardCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const productionSchema = z.object({
  mineId: z.string().min(1, "Please select an extraction site"),
  quantity: z.string().min(1, "Output quantity is required"),
  grade: z.string().min(1, "Material grade must be specified for quality tracking"),
  logDate: z.string().min(1, "Log date is required"),
  notes: z.string().optional(),
});

export default function ProductionTracking() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof productionSchema>>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      mineId: "",
      quantity: "",
      grade: "",
      logDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof productionSchema>) => {
    setIsSubmitting(true);
    // Simulate industrial output logging
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    
    toast({
      title: "Output Logged Successfully",
      description: `${data.quantity} MT of ${data.grade} has been added to the production ledger for site ${data.mineId}.`,
    });
    setOpen(false);
    form.reset();
  };

  const reports = [
    { id: "REP-991", mine: "Blue Ridge Quarry", date: "2024-05-18", qty: "4,820 MT", grade: "62.4% Fe", status: "Verified" },
    { id: "REP-990", mine: "Summit Lithium Site", date: "2024-05-18", qty: "1,150 MT", grade: "SC 6.1", status: "Verified" },
    { id: "REP-989", mine: "Blue Ridge Quarry", date: "2024-05-17", qty: "5,010 MT", grade: "62.1% Fe", status: "Verified" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Production Tracking</h1>
          <p className="text-muted-foreground mt-1">Log daily extraction results and quality grade output across sites.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none gap-2 border-slate-200">
            <History className="h-4 w-4" /> Historical Reports
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 font-bold shadow-sm">
                <Factory className="h-4 w-4" /> Log Daily Output
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Gem className="h-6 w-6 text-secondary" />
                  Daily Extraction Report
                </DialogTitle>
                <DialogDescription>Submit daily output for inventory reconciliation and trade fulfillment.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 border-y my-4">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="mineId"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Extraction Site</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select active mine site" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="m1">Blue Ridge Quarry (Iron Ore)</SelectItem>
                              <SelectItem value="m2">Summit Lithium (Spodumene)</SelectItem>
                              <SelectItem value="m3">Valley Copper Pit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Net Weight (MT)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Grade</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 62.5% Fe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="logDate"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Reporting Period (Date)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl border border-dashed flex items-center gap-3">
                    <ClipboardCheck className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-wider">
                      Reporting is subject to regular third-party lab audits. Discrepancies will affect your platform Trust Score.
                    </p>
                  </div>
                  <DialogFooter className="gap-3">
                    <Button type="button" variant="outline" className="font-bold" onClick={() => setOpen(false)} disabled={isSubmitting}>Discard</Button>
                    <Button disabled={isSubmitting} type="submit" className="bg-primary font-bold px-8 shadow-lg">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Log Output"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Recent Output Ledger</CardTitle>
              <CardDescription>Verified daily extraction reports from your active sites.</CardDescription>
            </CardHeader>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Log Date</TableHead>
                    <TableHead className="font-bold">Mine Site</TableHead>
                    <TableHead className="font-bold">Quantity</TableHead>
                    <TableHead className="font-bold">Quality Grade</TableHead>
                    <TableHead className="font-bold">Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="cursor-pointer hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="text-xs font-bold text-slate-500">{report.date}</TableCell>
                      <TableCell className="font-bold text-slate-900">{report.mine}</TableCell>
                      <TableCell className="font-bold text-primary">{report.qty}</TableCell>
                      <TableCell>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">{report.grade}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                          <CheckCircle2 className="h-3 w-3" /> {report.status}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <Factory className="h-32 w-32" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Yield Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                  <p className="text-[9px] text-primary-foreground/60 uppercase font-bold tracking-widest">Total Monthly Extracted</p>
                  <h3 className="text-3xl font-bold">142,500 MT</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary font-bold">+12.4%</p>
                  <p className="text-[8px] opacity-40 uppercase">vs Last Month</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span>Quota: 150,000 MT</span>
                  <span>95% Utilization</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[95%] transition-all duration-1000" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-rose-600 uppercase tracking-widest font-bold">
                <AlertCircle className="h-4 w-4" />
                Operational Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3">
                <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-700">Abnormal Production Dip</p>
                  <p className="text-[10px] text-rose-600 leading-relaxed mt-1">
                    Blue Ridge Quarry output dropped 15% below the 7-day moving average. Immediate internal review required.
                  </p>
                </div>
              </div>
              <Button variant="ghost" className="w-full text-[10px] text-primary font-bold group h-8 uppercase tracking-widest">
                Deep Diagnostics <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
