
"use client";

import { Investor, CapOpsRole } from "@/lib/capital-ops/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Send, ShieldAlert } from "lucide-react";

interface InvestorPanelProps {
  investors: Investor[];
  role: CapOpsRole;
  onInitiateWire: (investorId: string) => void;
  onConfirmWire: (investorId: string) => void;
}

export function InvestorPanel({ investors, role, onInitiateWire, onConfirmWire }: InvestorPanelProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <Card className="border-border/50 bg-card/30">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          Investor Commitment Registry
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase text-muted-foreground pl-6">Entity</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Total Commitment</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Pending Call</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Wire Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-muted-foreground text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investors.map((inv) => (
              <TableRow key={inv.id} className="border-border/50">
                <TableCell className="pl-6 py-4">
                  <p className="font-bold text-sm tracking-tight">{inv.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{inv.id}</p>
                </TableCell>
                <TableCell className="text-sm font-medium">{formatCurrency(inv.commitmentAmount)}</TableCell>
                <TableCell>
                  <span className={inv.pendingCallAmount > 0 ? "text-primary font-bold" : "text-muted-foreground"}>
                    {formatCurrency(inv.pendingCallAmount)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] font-bold uppercase tracking-tighter ${
                      inv.wireStatus === 'Confirmed' ? 'border-green-500 text-green-500 bg-green-500/5' :
                      inv.wireStatus === 'Initiated' ? 'border-primary text-primary bg-primary/5' :
                      'border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {inv.wireStatus === 'Confirmed' && <CheckCircle2 className="h-2 w-2 mr-1" />}
                    {inv.wireStatus === 'Initiated' && <Clock className="h-2 w-2 mr-1 animate-pulse" />}
                    {inv.wireStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  {role === 'Investor' && inv.wireStatus === 'Not Initiated' && inv.pendingCallAmount > 0 && (
                    <Button size="sm" className="h-7 text-[10px] font-bold px-3" onClick={() => onInitiateWire(inv.id)}>
                      <Send className="h-3 w-3 mr-1" /> Initiate Wire
                    </Button>
                  )}
                  {role === 'Admin' && inv.wireStatus === 'Initiated' && (
                    <Button size="sm" className="h-7 text-[10px] font-bold px-3 bg-green-600 hover:bg-green-700" onClick={() => onConfirmWire(inv.id)}>
                      Confirm Receipt
                    </Button>
                  )}
                  {(inv.wireStatus === 'Confirmed' || inv.pendingCallAmount === 0) && (
                    <span className="text-[10px] text-muted-foreground font-bold italic opacity-50">Settled</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
