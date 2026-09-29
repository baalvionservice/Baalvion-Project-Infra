"use client";

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { IndianRupee, Calendar, Download, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import PaymentStatusBadge from "./PaymentStatusBadge";

interface TransactionHistoryProps {
  transactions: any[];
}

/**
 * @fileOverview TransactionHistory
 * High-fidelity financial audit trail for member billing.
 */
export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 opacity-60">
        <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No transaction history located.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transaction ID</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Scheduled Date</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Method</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="hover:bg-slate-50 transition-colors group">
              <TableCell className="font-mono text-[10px] text-slate-900 font-bold">
                {tx.id}
              </TableCell>
              <TableCell className="text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  {format(tx.createdAt, "MMM d, yyyy")}
                </span>
              </TableCell>
              <TableCell className="text-[10px] font-bold uppercase text-slate-400">
                {tx.method}
              </TableCell>
              <TableCell className="font-bold text-slate-900">
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-emerald-600" />
                  {tx.amount.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={tx.status} />
              </TableCell>
              <TableCell className="text-right">
                <button className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-blue-600">
                  <Download className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
