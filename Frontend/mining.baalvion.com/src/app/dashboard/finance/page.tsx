"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight, 
  CreditCard, 
  FileText,
  Search,
  Filter,
  Download
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { trackEvent, reportError } from "@/lib/monitoring";
import { useToast } from "@/hooks/use-toast";

const data = [
  { name: 'Mon', volume: 4000 },
  { name: 'Tue', volume: 3000 },
  { name: 'Wed', volume: 5000 },
  { name: 'Thu', volume: 2780 },
  { name: 'Fri', volume: 1890 },
  { name: 'Sat', volume: 2390 },
  { name: 'Sun', volume: 3490 },
];

const COLORS = ['#1B4498', '#21CEDD', '#64748b', '#94a3b8'];

export default function FinanceDashboard() {
  const { toast } = useToast();
  const [transactions] = useState([
    { id: "TXN-8821", order: "ORD-9921", amount: "$525,000", type: "Escrow Deposit", status: "FUNDED", date: "2024-05-18" },
    { id: "TXN-8819", order: "ORD-9915", amount: "$12,400", type: "Commission", status: "COMPLETED", date: "2024-05-17" },
    { id: "TXN-8815", order: "ORD-9882", amount: "$68,500", type: "Escrow Release", status: "COMPLETED", date: "2024-05-15" },
    { id: "TXN-8810", order: "ORD-9901", amount: "$120,000", type: "Escrow Deposit", status: "PENDING", date: "2024-05-14" },
  ]);

  const handlePayoutRequest = () => {
    try {
      trackEvent('payout_requested', { amount: 2360000 });
      toast({
        title: "Payout Initialized",
        description: "Your request is being processed by the settlement gateway.",
      });
    } catch (err) {
      reportError(err, 'Finance Payout');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Financial Command</h1>
          <p className="text-muted-foreground mt-1">Manage escrow, transactions, and commission revenue.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => trackEvent('payout_requested', { type: 'report_download' })}>
            <Download className="h-4 w-4" /> Reports
          </Button>
          <Button onClick={handlePayoutRequest} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Request Payout</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", val: "$4.82M", change: "+12%", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Escrow Balance", val: "$2.36M", change: "Safe", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Release", val: "$840k", change: "3 Orders", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Monthly Growth", val: "18.4%", change: "+2.1%", icon: ArrowUpRight, color: "text-primary", bg: "bg-primary/5" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{stat.change}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Transaction Velocity</CardTitle>
            <CardDescription>Daily financial movement across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="volume" fill="#1B4498" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Method Distribution</CardTitle>
            <CardDescription>Preferred payment channels.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Wire', value: 45 },
                    { name: 'Bank Transfer', value: 30 },
                    { name: 'LC', value: 20 },
                    { name: 'Card', value: 5 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Detailed audit of all financial actions.</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search TXN or Order..." className="pl-10 h-9" />
            </div>
            <Button variant="outline" size="sm"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id} className="hover:bg-muted/20">
                  <TableCell className="font-bold text-primary">{txn.id}</TableCell>
                  <TableCell className="font-medium">{txn.order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{txn.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{txn.amount}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      txn.status === "FUNDED" ? "bg-emerald-100 text-emerald-700" :
                      txn.status === "COMPLETED" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>{txn.status}</span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{txn.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: "INV-2024-102", amount: "$525,000", client: "China Const Ltd" },
              { id: "INV-2024-101", amount: "$68,500", client: "Blue Ridge Quarry" },
            ].map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/10">
                <div>
                  <p className="text-sm font-bold">{inv.id}</p>
                  <p className="text-[10px] text-primary-foreground/60">{inv.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{inv.amount}</p>
                  <Button variant="ghost" size="sm" onClick={() => trackEvent('payout_requested', { invoice_id: inv.id })} className="h-6 text-[10px] text-secondary hover:text-white">Download</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-rose-50 border border-rose-100">
          <CardHeader>
            <CardTitle className="text-lg text-rose-900">Escrow Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900 tracking-tight">Escrow Release Overdue</p>
                <p className="text-xs text-rose-700">ORD-9918 delivered 48h ago. Buyer confirmation pending. Automated release scheduled in 12h.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
