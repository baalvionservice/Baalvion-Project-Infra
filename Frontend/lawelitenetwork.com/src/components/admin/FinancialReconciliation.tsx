
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, 
  IndianRupee, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCcw,
  TrendingUp,
  Loader2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

/**
 * @fileOverview FinancialReconciliation
 * High-fidelity financial audit module for platform commissions and payouts.
 */
export default function FinancialReconciliation() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const simulateAudit = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setData([
        { id: "TX_9921", expected: 5000, actual: 5000, commission: 500, status: "Verified" },
        { id: "TX_9922", expected: 8000, actual: 7950, commission: 800, status: "Mismatch" },
        { id: "TX_9923", expected: 12000, actual: 12000, commission: 1200, status: "Verified" },
        { id: "TX_9924", expected: 4500, actual: 4500, commission: 450, status: "Verified" },
      ]);
      setLoading(false);
    };
    simulateAudit();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 font-headline italic">
            <Scale className="w-6 h-6 text-emerald-600" /> Economic Reconciliation Ledger
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Auditing marketplace commission correctness and payout integrity.</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-[10px] font-bold uppercase tracking-widest h-10 px-6">
            <FileText className="w-4 h-4 mr-2" /> Export Audit Report
          </Button>
          <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl h-10 px-6 font-bold uppercase text-[10px] tracking-widest">
            <RefreshCcw className="w-4 h-4 mr-2" /> Execute Reconciliation
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Audit Coverage" value="100%" sub="Unified Ledger" color="text-blue-600" />
        <StatCard label="Discrepancy Rate" value="0.04%" sub="System Anomaly" color="text-amber-600" />
        <StatCard label="Escrow Variance" value="₹0.00" sub="Settled Delta" color="text-emerald-600" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reconciling Ledger Entries...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Transaction Ref</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Expected Value</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Actual Settlement</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Commission Ledger</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Audit Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-slate-50 transition-colors group">
                  <TableCell className="font-mono text-[10px] font-bold text-slate-900">{tx.id}</TableCell>
                  <TableCell className="text-xs font-medium text-slate-600">₹{tx.expected.toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">₹{tx.actual.toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-bold text-emerald-600">₹{tx.commission.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={`text-[8px] uppercase tracking-widest font-bold border-none shadow-none ${
                      tx.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {tx.status === 'Verified' ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : <AlertCircle className="w-2.5 h-2.5 mr-1" />}
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">{sub}</p>
    </div>
  );
}
