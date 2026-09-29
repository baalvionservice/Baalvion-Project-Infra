
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileStack, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  FileText, 
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const uploadSchema = z.object({
  category: z.string().min(1, "Please select a document category"),
  orderId: z.string().min(1, "Please link this document to an active order or shipment"),
});

export default function ExportDocuments() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      category: "",
      orderId: "",
    },
  });

  const onSubmit = (data: z.infer<typeof uploadSchema>) => {
    setIsSubmitting(true);
    // Simulate document processing and AI extraction
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Document Uploaded",
        description: `Successfully linked to ${data.orderId}. System is now verifying metadata authenticity.`,
      });
      setOpen(false);
      form.reset();
    }, 1500);
  };

  const docs = [
    { id: "DOC-1021", order: "ORD-9921", type: "Bill of Lading", date: "2024-05-18", status: "VERIFIED", size: "1.2 MB" },
    { id: "DOC-1020", order: "ORD-9921", type: "Commercial Invoice", date: "2024-05-18", status: "VERIFIED", size: "450 KB" },
    { id: "DOC-1019", order: "ORD-9915", type: "Cert of Origin", date: "2024-05-15", status: "PENDING_REVIEW", size: "890 KB" },
    { id: "DOC-1018", order: "ORD-9912", type: "Packing List", date: "2024-05-14", status: "VERIFIED", size: "320 KB" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Compliance & Export Docs</h1>
          <p className="text-muted-foreground mt-1">Manage essential documentation for international mineral shipments.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 font-bold h-11 px-6 shadow-lg transition-all active:scale-95">
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <FileStack className="h-6 w-6 text-secondary" />
                Submit Trade Document
              </DialogTitle>
              <DialogDescription>Supported formats: PDF, High-resolution JPG/PNG. Files are scanned for tampering and OCR extraction.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6 border-y my-4">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="inv">Commercial Invoice</SelectItem>
                            <SelectItem value="pl">Packing List</SelectItem>
                            <SelectItem value="bl">Bill of Lading</SelectItem>
                            <SelectItem value="co">Certificate of Origin</SelectItem>
                            <SelectItem value="qc">Quality Inspection Report</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Order / Shipment</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Search recent items..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="o1">ORD-9921 (Iron Ore Fine)</SelectItem>
                            <SelectItem value="o2">ORD-9918 (Copper Cathodes)</SelectItem>
                            <SelectItem value="s1">SHP-1021 (Durban Port Transit)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2 space-y-2">
                    <Label>File Selection</Label>
                    <div className="h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 hover:bg-slate-50 transition-all cursor-pointer border-slate-200 group hover:border-primary/40">
                      <Upload className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors mb-2" />
                      <p className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Click to upload or drag & drop</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 font-medium">
                    All documents are encrypted at rest and processed through our <strong>AI Integrity Scan</strong> to identify potential metadata tampering or OCR discrepancies.
                  </p>
                </div>
                <DialogFooter className="gap-3">
                  <Button type="button" variant="outline" className="font-bold" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button disabled={isSubmitting} type="submit" className="bg-primary font-bold px-8 shadow-md">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload for Review"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by Order ID or Doc Type..." className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> Filters</Button>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Tier 3 Verified Account</span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold">Doc ID</TableHead>
                <TableHead className="font-bold">Order / Shipment</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="font-bold text-primary group-hover:text-primary/80">{doc.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-xs">{doc.order}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{doc.size}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <FileText className="h-4 w-4 text-slate-400" />
                      {doc.type}
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] text-slate-500 font-bold">{doc.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-bold px-2 py-0.5 uppercase tracking-tighter",
                      doc.status === "VERIFIED" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"
                    )}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary transition-colors" title="Download Document"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary transition-colors" title="Open Externally"><ExternalLink className="h-4 w-4" /></Button>
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
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Compliance Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-4">
              <Clock className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700">ORD-9915: Mismatched Vessel Name</p>
                <p className="text-xs text-amber-600 leading-relaxed mt-1">
                  The Bill of Lading shows 'MV Global Star' but your Commercial Invoice lists 'MV Ocean Pride'. Please rectify and re-upload both documents to ensure customs clearance at Durban Port.
                </p>
                <Button variant="link" className="text-[10px] font-bold text-amber-700 p-0 h-auto mt-2 uppercase tracking-widest">View Full Audit Trail <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <ShieldCheck className="h-48 w-48" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg">Customs Pre-Clearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-sm text-slate-400 leading-relaxed">
              Baalvion Mining Inc. now supports automated customs pre-clearance for major trade hubs in Rotterdam, Shanghai, and Durban. Ensure all Tier 3 documents are 'VERIFIED' to enable auto-filing.
            </p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Electronic filing active
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> ICC Compliant
              </div>
            </div>
            <Button variant="outline" className="w-full font-bold mt-4 border-white/20 bg-white/5 hover:bg-white/10 text-white">Manage Auto-Filing Rules</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
