"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Transaction,
  PaymentGateway,
  TransactionStatus,
  Business,
  Currency,
} from "@/lib/types";
import { dashboardApi } from "@/lib/api-client";
import { FilterBar } from "./components/filter-bar";
import {
  parse,
  isWithinInterval,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";
import RevenueByGatewayDonutChart from "@/components/charts/revenue-by-gateway-donut-chart";
import MonthlyRevenueByGatewayChart from "@/components/charts/monthly-revenue-by-gateway-chart";
import GatewayPerformanceTable from "@/components/gateway-performance-table";
import TransactionDetail from "./components/transaction-detail";

type TransactionWithBusiness = Transaction & { businessName: string };

const PAGE_SIZE = 20;

const gatewayColors: Record<PaymentGateway, string> = {
  Stripe:
    "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Razorpay:
    "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300",
  PayPal:
    "border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

const statusConfig: Record<
  TransactionStatus,
  { icon: React.ElementType; color: string }
> = {
  Success: {
    icon: CheckCircle2,
    color:
      "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
  },
  Failed: {
    icon: XCircle,
    color:
      "border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300",
  },
  Pending: {
    icon: Clock,
    color:
      "border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  },
};

export default function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    gateway?: string;
    status?: string;
    businessId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithBusiness | null>(null);

  const params = searchParams ? use(searchParams) : undefined;

  const [allTransactions, setAllTransactions] = useState<TransactionWithBusiness[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [txRes, bizRes] = await Promise.all([dashboardApi.payments(), dashboardApi.businesses()]);
        const txArr = ((txRes as { data?: unknown[] })?.data ?? (Array.isArray(txRes) ? txRes : [])) as Record<string, unknown>[];
        const bizArr = ((bizRes as { data?: unknown[] })?.data ?? (Array.isArray(bizRes) ? bizRes : [])) as Record<string, unknown>[];
        if (cancelled) return;
        const bizName = (id: string) => bizArr.find((b) => String(b.id) === id)?.name as string | undefined;
        setAllTransactions(txArr.map((tx) => {
          const businessId = String(tx.business_id ?? "");
          return {
            id: String(tx.id),
            businessId,
            gateway: String(tx.gateway ?? "") as PaymentGateway,
            customer: { name: String(tx.customer_name ?? ""), email: String(tx.customer_email ?? "") },
            amount: Number(tx.amount ?? 0),
            fee: Number(tx.fee ?? 0),
            currency: String(tx.currency ?? "USD") as Currency,
            status: String(tx.status ?? "") as TransactionStatus,
            date: String(tx.created_at ?? tx.createdAt ?? new Date().toISOString()),
            businessName: bizName(businessId) ?? "N/A",
          } as TransactionWithBusiness;
        }));
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Calculate stats from all transactions
  const totalCollected = allTransactions
    .filter((tx) => tx.status === "Success")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const successfulTransactions = allTransactions.filter(
    (tx) => tx.status === "Success"
  ).length;
  const failedTransactions = allTransactions.filter(
    (tx) => tx.status === "Failed"
  ).length;
  const pendingPayouts = allTransactions
    .filter((tx) => tx.status === "Pending")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Filtering logic
  const currentPage = Number(params?.page || "1");
  const gateway = params?.gateway;
  const status = params?.status;
  const businessId = params?.businessId;
  const from = params?.from;
  const to = params?.to;

  const filteredTransactions = allTransactions.filter((tx) => {
    if (gateway && gateway !== "all" && tx.gateway !== gateway) return false;
    if (status && status !== "all" && tx.status !== status) return false;
    if (businessId && businessId !== "all" && tx.businessId !== businessId)
      return false;
    if (from && to) {
      const txDate = new Date(tx.date);
      const fromDate = startOfDay(new Date(from));
      const toDate = endOfDay(new Date(to));
      if (!isWithinInterval(txDate, { start: fromDate, end: toDate }))
        return false;
    }
    return true;
  });

  // Pagination logic
  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / PAGE_SIZE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Payments & Revenue
        </h1>
        <p className="text-muted-foreground">
          Track and manage all your transactions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Collected This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCollected.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Successful Transactions
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Transactions
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payouts
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingPayouts.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <RevenueByGatewayDonutChart transactions={allTransactions} />
        </div>
        <div className="lg:col-span-3">
          <MonthlyRevenueByGatewayChart transactions={allTransactions} />
        </div>
      </div>

      <GatewayPerformanceTable transactions={allTransactions} />

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            A list of recent transactions from all your businesses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilterBar />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((tx) => {
                  const StatusIcon = statusConfig[tx.status].icon;
                  return (
                    <TableRow
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">{tx.id}</TableCell>
                      <TableCell>{tx.businessName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(gatewayColors[tx.gateway])}
                        >
                          {tx.gateway}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{tx.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.customer.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.currency} {tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "flex items-center gap-2",
                            statusConfig[tx.status].color
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span>{tx.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(tx.date), "PPpp")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedTransaction(tx)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Issue Refund</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing{" "}
            <strong>
              {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, totalTransactions)}
            </strong>{" "}
            of <strong>{totalTransactions}</strong> transactions
          </div>
          <div className="flex items-center gap-2">
            <Link href={`?page=${Math.max(1, currentPage - 1)}`} passHref>
              <Button variant="outline" size="sm" disabled={currentPage <= 1}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </Link>
            <Link
              href={`?page=${Math.min(totalPages, currentPage + 1)}`}
              passHref
            >
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
      <TransactionDetail
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedTransaction(null);
        }}
      />
    </div>
  );
}
