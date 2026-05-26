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
import { FileText, IndianRupee, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { InvoiceData } from '@/services/invoices/invoiceService';
import Link from 'next/link';
import PaymentStatusBadge from '@/components/payment/PaymentStatusBadge';

interface InvoiceListProps {
  invoices: InvoiceData[];
}

/**
 * @fileOverview InvoiceList
 * High-fidelity financial ledger for member billing history.
 */
export default function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 opacity-60">
        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No billing records located.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Invoice ID</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Generation Date</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Settlement</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors group">
              <TableCell className="font-mono text-[10px] text-slate-900 font-bold">
                {inv.id}
              </TableCell>
              <TableCell className="text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  {format(inv.date, "MMM d, yyyy")}
                </span>
              </TableCell>
              <TableCell className="font-bold text-slate-900">
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-emerald-600" />
                  {inv.totalAmount.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={inv.status === 'paid' ? 'paid' : 'pending'} />
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/billing/${inv.id}`}>
                  <button className="flex items-center gap-1 ml-auto text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">
                    View Audit <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
