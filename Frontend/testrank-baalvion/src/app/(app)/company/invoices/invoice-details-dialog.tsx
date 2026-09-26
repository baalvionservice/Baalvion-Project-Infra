
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InvoiceDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  invoice: Invoice | null;
}

const getStatusVariant = (status: InvoiceStatus): 'default' | 'destructive' | 'warning' | 'secondary' => {
  switch (status) {
    case 'Paid': return 'default';
    case 'Failed':
    case 'Overdue': return 'destructive';
    case 'Due': return 'warning';
    case 'Pending': return 'secondary';
    default: return 'secondary';
  }
};

export function InvoiceDetailsDialog({ isOpen, onOpenChange, invoice }: InvoiceDetailsDialogProps) {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl uppercase">Invoice {invoice.id}</DialogTitle>
              <DialogDescription>
                Issued on {format(new Date(invoice.date), 'PPP')}
              </DialogDescription>
            </div>
            <Badge variant={getStatusVariant(invoice.status)} className="text-base">{invoice.status}</Badge>
          </div>
        </DialogHeader>
        <div className="grid gap-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="font-medium mb-1">Billed To</h4>
                    <p className="text-sm text-muted-foreground">
                        TechCorp <br />
                        123 Market St. <br />
                        San Francisco, CA 94105
                    </p>
                </div>
                <div className="text-right">
                    <h4 className="font-medium mb-1">Payment Details</h4>
                    <p className="text-sm text-muted-foreground">
                        Due Date: {format(new Date(invoice.dueDate), 'PPP')} <br />
                        Plan: {invoice.planName}
                    </p>
                </div>
            </div>
            <div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.lineItems.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableCell className="text-right">${invoice.subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead className="text-right">Tax</TableHead>
                            <TableCell className="text-right">${invoice.tax.toFixed(2)}</TableCell>
                        </TableRow>
                         <TableRow className="font-bold text-lg">
                            <TableHead className="text-right">Total</TableHead>
                            <TableCell className="text-right">${invoice.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
        <DialogFooter className="mt-6">
            <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
