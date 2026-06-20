
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Bell, 
  Send, 
  Search, 
  Filter, 
  Plus,
  BarChart3,
  MoreVertical,
  Loader2,
  MailCheck,
  MousePointer2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const broadcastSchema = z.object({
  title: z.string().min(5, "Title is too short"),
  target: z.string().min(1, "Please select a target group"),
  priority: z.string().min(1, "Priority is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export default function AdminNotificationManagement() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      target: "all",
      priority: "medium",
      content: "",
    },
  });

  const onSubmit = (data: z.infer<typeof broadcastSchema>) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Broadcast Dispatched",
        description: `Announcement "${data.title}" is now being delivered.`,
      });
      setOpen(false);
      form.reset();
    }, 1500);
  };

  const [broadcasts] = useState([
    { id: "AN-102", title: "Q3 Platform Maintenance", target: "All Users", status: "SCHEDULED", reach: "12.4k", openRate: "---", ctr: "---", date: "Jun 12, 2024" },
    { id: "AN-101", title: "New Compliance Standard (v4.2)", target: "Mining Companies", status: "SENT", reach: "2.8k", openRate: "94.2%", ctr: "12.4%", date: "May 18, 2024" },
    { id: "AN-098", title: "Regional Port Lockdown Notice", target: "Logistics Providers", status: "SENT", reach: "142", openRate: "100%", ctr: "42.8%", date: "May 10, 2024" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Communication Control
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage automated dispatches, broadcast alerts, and delivery intelligence.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white font-bold gap-2 h-12 px-8 shadow-lg">
              <Plus className="h-4 w-4" /> Create Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Send className="h-6 w-6 text-primary" />
                New System Announcement
              </DialogTitle>
              <DialogDescription>Draft a message to be broadcasted to platform users via dashboard and push notifications.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6 border-y my-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Announcement Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Important Update to Mining License Verification" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Recipient Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="sellers">Mining Companies (Sellers)</SelectItem>
                            <SelectItem value="buyers">Industrial Buyers</SelectItem>
                            <SelectItem value="logistics">Logistics Providers</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low (Info)</SelectItem>
                            <SelectItem value="medium">Medium (Important)</SelectItem>
                            <SelectItem value="high">High (Critical)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the announcement in detail..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Push to Mobile Devices</Label>
                    <p className="text-[10px] text-slate-500">Enable real-time push for users with the mobile app.</p>
                  </div>
                  <Badge className="bg-emerald-500">Active</Badge>
                </div>
                <DialogFooter className="gap-3">
                  <Button type="button" variant="outline" className="font-bold" onClick={() => setOpen(false)}>Save Draft</Button>
                  <Button disabled={isSubmitting} type="submit" className="bg-primary font-bold px-8">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dispatch Alert"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Emails Dispatched", val: "48.2k", icon: MailCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Avg. Open Rate", val: "92.4%", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "PDF Download CTR", val: "18.2%", icon: MousePointer2, color: "text-primary", bg: "bg-primary/5" },
          { label: "Failed Deliveries", val: "08", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
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

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
          <div>
            <CardTitle className="text-lg">Communication Audit Ledger</CardTitle>
            <CardDescription>Track the performance of all outbound system dispatches.</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search broadcasts..." className="pl-10 h-10 border-slate-200" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> Filters</Button>
          </div>
        </CardHeader>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Anno ID</TableHead>
                <TableHead className="font-bold">Broadcast Details</TableHead>
                <TableHead className="font-bold">Target Audience</TableHead>
                <TableHead className="font-bold">Open Rate</TableHead>
                <TableHead className="font-bold">CTR (%)</TableHead>
                <TableHead className="font-bold">Reach</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((anno) => (
                <TableRow key={anno.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-primary">{anno.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{anno.title}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Published {anno.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {anno.target}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-emerald-600">{anno.openRate}</TableCell>
                  <TableCell className="font-bold text-primary">{anno.ctr}</TableCell>
                  <TableCell className="font-bold text-slate-700">{anno.reach}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-primary font-bold">Detailed Analytics</Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
