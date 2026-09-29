"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Truck, 
  Clock, 
  Download, 
  MessageSquare, 
  ShieldCheck, 
  ExternalLink, 
  AlertCircle, 
  DollarSign,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useOrders } from "@/hooks/use-orders";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function OrdersPage() {
  const { orders, loading } = useOrders();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Order Management</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Track bulk purchases and manage escrow milestones.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none gap-2">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export Statement</span><span className="sm:hidden">Export</span>
          </Button>
          <Button className="flex-1 sm:flex-none bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Open Dispute
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase">Escrow Secured</p>
                <h2 className="text-2xl font-bold text-emerald-900">$2.36M</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-xl text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">In-Transit</p>
                <h2 className="text-2xl font-bold text-primary">04 Shipments</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase">Pending Actions</p>
                <h2 className="text-2xl font-bold text-amber-900">02 Orders</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap">
            <Table aria-label="Recent Orders and Status">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Order ID</TableHead>
                  <TableHead className="font-bold">Product / Seller</TableHead>
                  <TableHead className="font-bold">Total Amount</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Escrow Milestone</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/20">
                    <TableCell className="font-bold text-primary">{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.product}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{order.seller}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{order.amount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.status === "SHIPPED" ? <Truck className="h-3 w-3 text-primary" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                        <StatusBadge status={order.status} type="ORDER" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 w-32">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <StatusBadge status={order.escrow} type="ESCROW" />
                          <span className="text-muted-foreground">{order.escrowProgress}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full",
                              order.escrow === "HELD" ? "bg-amber-500" : "bg-emerald-500"
                            )} 
                            style={{ width: `${order.escrowProgress}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MessageSquare className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><DollarSign className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
