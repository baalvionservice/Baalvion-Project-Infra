
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Scale, 
  MessageSquare, 
  AlertCircle, 
  Plus, 
  ArrowRight, 
  FileText, 
  History,
  ShieldAlert,
  HelpCircle,
  FileSearch,
  Loader2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const disputeSchema = z.object({
  orderId: z.string().min(1, "Please select an affected order"),
  category: z.string().min(1, "Please select a dispute category"),
  description: z.string().min(20, "Please provide a detailed description (minimum 20 characters)"),
});

export default function UserDisputesPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof disputeSchema>>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      orderId: "",
      category: "",
      description: "",
    },
  });

  const onSubmit = (data: z.infer<typeof disputeSchema>) => {
    setIsSubmitting(true);
    // Simulate dispute filing and escrow lockdown
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Dispute Filed",
        description: `Case for ${data.orderId} has been opened and escrow funds are locked. An administrator will review your evidence within 24 hours.`,
        variant: "destructive"
      });
      setOpen(false);
      form.reset();
    }, 1500);
  };

  const [disputes] = useState([
    { id: "DSP-1001", order: "ORD-9921", type: "Quality Mismatch", status: "UNDER_REVIEW", date: "May 18, 2024" },
    { id: "DSP-0982", order: "ORD-8790", type: "Shipment Delay", status: "RESOLVED", date: "Apr 12, 2024" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Trade Disputes</h1>
          <p className="text-muted-foreground mt-1">Resolution center for quality, delivery, or payment conflicts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2 font-bold shadow-lg">
              <Plus className="h-4 w-4" /> Open New Dispute
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-rose-600">
                <AlertCircle className="h-6 w-6" />
                Initiate Trade Dispute
              </DialogTitle>
              <DialogDescription>Filing a dispute will automatically trigger an escrow lockdown for the linked order.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 border-y my-4">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affected Order</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Search recent orders..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ORD-9921">ORD-9921 - Iron Ore (62% Fe) - $525,000</SelectItem>
                          <SelectItem value="ORD-9918">ORD-9918 - Copper Cathodes - $1.8M</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Only orders within the 30-day post-delivery window are eligible for formal dispute.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dispute Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select primary reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="quality">Quality / Specification Mismatch</SelectItem>
                          <SelectItem value="quantity">Quantity Discrepancy</SelectItem>
                          <SelectItem value="delay">Critical Delivery Delay</SelectItem>
                          <SelectItem value="damage">Material Damage during Transit</SelectItem>
                          <SelectItem value="payment">Escrow Milestone Release Issue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Summary</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the discrepancy in detail. Reference specific points in your contract or inspection report." className="min-h-[120px] bg-slate-50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                  <p className="text-xs text-rose-700 font-bold">
                    Escrow funds will be frozen immediately upon submission. Actions are irreversible until Admin mediation.
                  </p>
                </div>
                <DialogFooter className="gap-3">
                  <Button type="button" variant="outline" className="font-bold" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button disabled={isSubmitting} type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 shadow-sm">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Formal Dispute"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Claims", val: "01", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Funds Frozen", val: "$525,000", icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Resolved Cases", val: "12", icon: History, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Win Rate", val: "84%", icon: Scale, color: "text-primary", bg: "bg-primary/5" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl transition-colors", stat.bg, stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-xl font-bold text-slate-900">{stat.val}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold">Dispute ID</TableHead>
                <TableHead className="font-bold">Order ID</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Filed Date</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="font-bold text-primary group-hover:text-primary/80">{dispute.id}</TableCell>
                  <TableCell className="font-medium text-slate-700">{dispute.order}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider h-5">
                      {dispute.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">{dispute.date}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                      dispute.status === "UNDER_REVIEW" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {dispute.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="gap-2 group/btn font-bold text-primary">
                        View Thread <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary transition-colors"><ArrowRight className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Resolution Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-xl border border-dashed">
              <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Evidence is Key</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Ensure all claims are backed by authorized third-party inspection reports (SGS, Bureau Veritas) or clear visual documentation. Incomplete evidence may result in case dismissal.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-xl border border-dashed">
              <FileSearch className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Neutral Mediation</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Baalvion Mining Inc. admins act as impartial trade mediators. Decisions are based strictly on contract terms, verified lab reports, and platform policies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <ShieldAlert className="h-48 w-48" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg">Escrow Shield Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Our automated Escrow Shield ensures that neither party can unilaterally release or withdraw funds once a dispute is active. Funds are held in a secure, non-interest-bearing platform account until resolution is finalized.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4 text-secondary" /> ICC IncoTerms 2020 Compliant
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4 text-secondary" /> Secure Holding Active
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";
