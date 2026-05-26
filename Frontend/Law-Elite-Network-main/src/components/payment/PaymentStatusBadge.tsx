"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: 'paid' | 'pending' | 'failed';
}

/**
 * @fileOverview PaymentStatusBadge
 * Standardized indicator for transaction states.
 */
export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  switch (status) {
    case 'paid':
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 rounded-full text-[9px] font-bold uppercase px-3 py-1 flex items-center gap-1.5 shadow-none">
          <CheckCircle2 className="w-3 h-3" /> Paid
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 rounded-full text-[9px] font-bold uppercase px-3 py-1 flex items-center gap-1.5 shadow-none">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-50 text-red-700 border-red-100 hover:bg-red-100 rounded-full text-[9px] font-bold uppercase px-3 py-1 flex items-center gap-1.5 shadow-none">
          <XCircle className="w-3 h-3" /> Failed
        </Badge>
      );
    default:
      return null;
  }
}
