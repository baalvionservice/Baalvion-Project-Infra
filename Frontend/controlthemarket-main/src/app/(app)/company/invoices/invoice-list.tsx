
'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Calendar as CalendarIcon, Download, Eye } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { InvoiceDetailsDialog } from './invoice-details-dialog';
import { cn } from '@/lib/utils';

const statuses: (InvoiceStatus | 'All')[] = ["All", "Paid", "Pending", "Due", "Overdue", "Failed"];

const getStatusVariant = (status: InvoiceStatus): 'default' | 'destructive' | 'warning' | 'secondary' | 'outline' => {
  switch (status) {
    case 'Paid': return 'default';
    case 'Failed': return 'destructive';
    case 'Overdue': return 'destructive';
    case 'Due': return 'warning';
    case 'Pending': return 'secondary';
    default: return 'outline';
  }
};

export function InvoiceList({ initialData }: { initialData: Invoice[] }) {
  const [data, setData] = useState<Invoice[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesDate = (() => {
        if (!dateRange?.from) return true;
        const itemDate = new Date(item.date);
        itemDate.setHours(0,0,0,0);
        if (dateRange.to) {
            return itemDate >= dateRange.from && itemDate <= dateRange.to;
        }
        return itemDate.getTime() === dateRange.from.getTime();
      })();

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, searchTerm, statusFilter, dateRange]);
  
  const handlePayNow = (invoiceId: string) => {
      toast({
          title: "Payment Initiated (Mock)",
          description: `Attempting to pay invoice ${invoiceId}.`
      })
      setTimeout(() => {
          setData(prev => prev.map(inv => inv.id === invoiceId ? {...inv, status: 'Paid'} : inv));
          toast({
              title: "Payment Successful!",
              description: `Invoice ${invoiceId} has been paid.`
          })
      }, 1500)
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
            <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by Invoice ID..."
                    className="pl-10 min-w-[200px] md:min-w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'All')}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
            <Popover>
                <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal md:w-[240px]", !dateRange && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Filter by date</span>)}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                </PopoverContent>
            </Popover>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium uppercase">{item.id}</TableCell>
                    <TableCell>{format(new Date(item.billingPeriod.start), 'LLL yyyy')} - {format(new Date(item.billingPeriod.end), 'LLL yyyy')}</TableCell>
                    <TableCell>{format(new Date(item.dueDate), 'PPP')}</TableCell>
                    <TableCell>${item.amount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(item.status)}>{item.status}</Badge></TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" onClick={() => setViewingInvoice(item)}><Eye className="mr-2 h-4 w-4"/>View</Button>
                       <Button variant="ghost" size="sm"><Download className="mr-2 h-4 w-4"/>Download</Button>
                       {(item.status === 'Due' || item.status === 'Overdue') && (
                           <Button variant="default" size="sm" onClick={() => handlePayNow(item.id)}>Pay Now</Button>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No invoices found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <InvoiceDetailsDialog
        isOpen={!!viewingInvoice}
        onOpenChange={() => setViewingInvoice(null)}
        invoice={viewingInvoice}
      />
    </>
  );
}
