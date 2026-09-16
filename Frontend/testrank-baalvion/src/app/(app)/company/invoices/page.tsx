
'use client';
import { getInvoicesByCompanyId } from "@/lib/api";
import { InvoiceList } from "./invoice-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import type { Invoice } from "@/lib/types";

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.companyId) {
      getInvoicesByCompanyId(user.companyId).then(res => {
        setInvoices(res.data);
        setLoading(false);
      });
    } else {
        setLoading(false);
    }
  }, [user]);


  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Invoices
            </h2>
            <p className="text-muted-foreground">
                Manage your invoices and billing history.
            </p>
        </div>
        <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export All
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
                An overview of all your past and present invoices.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <InvoiceList initialData={invoices} />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
