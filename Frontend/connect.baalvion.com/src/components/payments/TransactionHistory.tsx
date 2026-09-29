"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  FileText,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  History,
  X,
  ExternalLink,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Transaction, TransactionStatus } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, fromBase } from "@/lib/currency";

interface TransactionHistoryProps {
  data: Transaction[];
  loading?: boolean;
  title?: string;
  description?: string;
  emptyMessage?: string;
  currency?: string;
}

export function TransactionHistory({
  data,
  loading = false,
  title = "Transaction History",
  description = "A detailed ledger of all financial movements on the platform.",
  emptyMessage = "No transactions found matching your filters.",
  currency = "INR",
}: TransactionHistoryProps) {
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || tx.status === statusFilter;

      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const txDate = new Date(tx.createdAt);
        matchesDate = txDate >= dateRange.from && txDate <= dateRange.to;
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [data, searchQuery, typeFilter, statusFilter, dateRange]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleExportCSV = () => {
    const headers = "Date,ID,Description,Type,Amount,Status\n";
    const rows = filteredData
      .map(
        (tx) =>
          `${format(new Date(tx.createdAt), "yyyy-MM-dd")},${tx.id},${
            tx.description
          },${tx.type},${tx.amount},${tx.status}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baalvion_ledger_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast({
      title: "Ledger Exported",
      description: "Your transaction history has been downloaded as CSV.",
    });
  };

  const handleDownloadInvoice = (tx: Transaction) => {
    if (tx.receiptUrl) {
      window.open(tx.receiptUrl, "_blank");
      toast({
        title: "Opening Statement",
        description: "Retrieving official PDF documentation...",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Statement Unavailable",
        description:
          "Official documentation is still being processed for this transaction.",
      });
    }
  };

  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "Settled",
          color: "bg-emerald-100 text-emerald-600",
          icon: CheckCircle2,
        };
      case "PENDING":
        return {
          label: "Processing",
          color: "bg-orange-100 text-orange-600",
          icon: Clock,
        };
      case "FAILED":
        return {
          label: "Failed",
          color: "bg-red-100 text-red-600",
          icon: AlertCircle,
        };
      case "REFUNDED":
        return {
          label: "Refunded",
          color: "bg-blue-100 text-blue-600",
          icon: History,
        };
      default:
        return {
          label: status,
          color: "bg-slate-100 text-slate-500",
          icon: History,
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ESCROW_LOCK":
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case "ESCROW_RELEASE":
        return <Zap className="h-4 w-4 text-emerald-500" />;
      case "PAYOUT":
        return <ArrowUpRight className="h-4 w-4 text-primary" />;
      case "DEPOSIT":
        return <Plus className="h-4 w-4 text-emerald-500" />;
      case "REFUND":
        return <ArrowDownLeft className="h-4 w-4 text-orange-500" />;
      case "FEE":
        return <Zap className="h-4 w-4 text-slate-400" />;
      default:
        return <History className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by description or ID..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold">
                  All Types
                </SelectItem>
                <SelectItem value="ESCROW_LOCK" className="font-bold">
                  Escrow Locks
                </SelectItem>
                <SelectItem value="ESCROW_RELEASE" className="font-bold">
                  Escrow Release
                </SelectItem>
                <SelectItem value="PAYOUT" className="font-bold">
                  Withdrawals
                </SelectItem>
                <SelectItem value="DEPOSIT" className="font-bold">
                  Deposits
                </SelectItem>
                <SelectItem value="FEE" className="font-bold">
                  Platform Fees
                </SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs min-w-[180px] justify-start px-3"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} -{" "}
                        {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Select Dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 border-none rounded-2xl shadow-2xl"
                align="start"
              >
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range: any) =>
                    setDateRange({ from: range?.from, to: range?.to })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold border-slate-200 h-11 px-6 bg-white"
            onClick={handleExportCSV}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Ledger Card */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
              <CardDescription className="font-medium mt-1">
                {description}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/5 text-primary border-none font-bold text-[10px] tracking-widest px-3 h-6"
              >
                {filteredData.length} RECORDS ({currency})
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">
                  Date
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                  Transaction Details
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                  Type
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                  Amount
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">
                  Status
                </TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
                  Statement
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-20">
                    <TableCell colSpan={6} className="px-8">
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {paginatedData.map((tx, idx) => {
                    const statusConfig = getStatusConfig(tx.status);
                    const isCredit =
                      tx.type === "CREDIT" ||
                      tx.type === "DEPOSIT" ||
                      tx.type === "ESCROW_RELEASE" ||
                      tx.type === "REFUND";

                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-20"
                      >
                        <TableCell className="pl-8 font-bold text-slate-500">
                          {format(new Date(tx.createdAt), "dd MMM, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 truncate max-w-[250px]">
                              {tx.description}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              ID: {tx.id.substring(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                            {getTypeIcon(tx.type)}
                            <span className="text-[10px] font-black uppercase text-slate-600">
                              {tx.type.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "text-lg font-black",
                              isCredit ? "text-emerald-600" : "text-slate-900"
                            )}
                          >
                            {isCredit ? "+" : "-"}{" "}
                            {formatCurrency(
                              fromBase(tx.amount, currency),
                              currency
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase border-none shadow-sm",
                              statusConfig.color
                            )}
                          >
                            <statusConfig.icon className="h-3 w-3 mr-1.5" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-9 w-9 rounded-xl transition-all",
                              tx.receiptUrl
                                ? "text-primary hover:bg-primary/5"
                                : "text-slate-200 cursor-not-allowed"
                            )}
                            onClick={() => handleDownloadInvoice(tx)}
                          >
                            {tx.receiptUrl ? (
                              <FileText className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <History className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        {emptyMessage}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="p-6 border-t bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9 w-9 p-0 bg-white border-slate-200"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "primary" : "ghost"}
                    size="sm"
                    className={cn(
                      "rounded-xl h-9 w-9 p-0 font-bold",
                      currentPage === i + 1
                        ? "shadow-lg shadow-primary/20"
                        : "text-slate-400 hover:text-primary"
                    )}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9 w-9 p-0 bg-white border-slate-200"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
