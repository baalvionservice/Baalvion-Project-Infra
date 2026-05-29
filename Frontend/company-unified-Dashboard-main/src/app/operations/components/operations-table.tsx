"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOperations } from "@/hooks/use-operations";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessStatus } from "@/lib/types";

const statusColors: Record<BusinessStatus, string> = {
  Active:
    "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
  Growth:
    "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Review:
    "border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
};

export default function OperationsTable() {
  const { view } = useOperations();
  const businessTodayData = view?.businessToday ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Businesses Today</CardTitle>
        <CardDescription>
          A real-time overview of business performance for today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead className="text-right">Revenue Today</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Employees In</TableHead>
                <TableHead className="text-right">Profit Today</TableHead>
                <TableHead className="text-right">vs Yesterday</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessTodayData.map((data) => {
                return (
                  <TableRow key={data.businessId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{data.countryCode}</span>
                        <span>{data.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {data.currency} {data.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{data.orders}</TableCell>
                    <TableCell className="text-right">
                      {data.employeesIn}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {data.currency} {data.profit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "flex items-center justify-end gap-1",
                          data.changeVsYesterday > 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {data.changeVsYesterday > 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {data.changeVsYesterday > 0 ? "+" : ""}
                        {data.changeVsYesterday.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          statusColors[data.status as BusinessStatus]
                        )}
                      >
                        {data.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
