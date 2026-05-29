'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, View, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useBilling } from '@/hooks/use-billing';
import { safeFormatDate } from '@/lib/utils';
import type { Invoice } from '@/lib/types';
import InvoiceDetailModal from './invoice-detail-modal';
import { useToast } from '@/hooks/use-toast';

export default function InvoiceHistory() {
  const invoicesData = { invoices: useBilling().invoices };
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownload = (invoiceId: string) => {
    setDownloadingId(invoiceId);
    setTimeout(() => {
        setDownloadingId(null);
        toast({
            title: "Download Complete",
            description: `Invoice ${invoiceId}.pdf has been downloaded.`,
        });
    }, 1500);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>View and download your past invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesData.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.period}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="default" className="bg-green-100 text-green-800">{invoice.status}</Badge></TableCell>
                    <TableCell>{safeFormatDate(invoice.paymentDate, 'PP')}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setSelectedInvoice(invoice as Invoice)}>
                            <View className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(invoice.id)} disabled={downloadingId === invoice.id}>
                            {downloadingId === invoice.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {downloadingId === invoice.id ? 'Downloading...' : 'Download PDF'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onOpenChange={() => setSelectedInvoice(null)}
      />
    </>
  );
}
