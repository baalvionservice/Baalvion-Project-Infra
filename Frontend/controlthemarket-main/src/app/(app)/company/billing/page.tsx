
'use client';
import { getInvoicesByCompanyId } from "@/lib/api";
import { BillingDashboard } from "./billing-dashboard";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import type { Invoice } from "@/lib/types";
import { Loader2 } from "lucide-react";

// Never statically prerender: this is a per-user authenticated billing dashboard, not shareable
// static HTML. Static generation here also trips a Next.js App Router bug where a page.tsx whose
// own default export is a Client Component fails to resolve its layout's client boundary
// (AuthProvider) in the React Client Manifest during prerendering.
export const dynamic = 'force-dynamic';


export default function BillingPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.companyId) {
      getInvoicesByCompanyId(user.companyId).then(res => {
        setInvoices(res.data);
        setLoading(false);
      });
    } else if (user) { // User exists but no companyId
        setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <BillingDashboard initialInvoices={invoices} />
  );
}
