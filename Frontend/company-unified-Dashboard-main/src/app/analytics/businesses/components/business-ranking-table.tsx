"use client";

import React, { useState } from "react";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUp, ArrowDown, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import analyticsData from "@/lib/data/analytics-businesses.json";
import businessesData from "@/lib/data/businesses.json";
import countriesData from "@/lib/data/countries.json";
import DeepDive from "./deep-dive";
import type { Business, Currency, BusinessStatus } from "@/lib/types";

const rankingData = analyticsData.ranking as RankingItem[];
const allBusinesses: Business[] = businessesData.map((biz) => ({
  ...biz,
  currency: biz.currency as Currency,
  status: biz.status as BusinessStatus,
}));

type RankingItem = (typeof analyticsData.ranking)[0];
type SortableKey = "rank" | "revenue" | "growth" | "profit" | "score";

const getTrendIcon = (trend: "up" | "down" | "flat") => {
  if (trend === "up") return <ArrowUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <ArrowDown className="h-4 w-4 text-red-500" />;
  return <ArrowRight className="h-4 w-4 text-gray-500" />;
};

export default function BusinessRankingTable() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKey;
    direction: "asc" | "desc";
  }>({ key: "score", direction: "desc" });

  const sortedData = React.useMemo(() => {
    const sortableItems = [...rankingData];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [sortConfig]);

  const requestSort = (key: SortableKey) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKey) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const toggleRow = (businessId: string) => {
    setExpandedRow(expandedRow === businessId ? null : businessId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Ranking</CardTitle>
        <CardDescription>
          Businesses ranked by a composite performance score. Click a column
          header to sort.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-16 cursor-pointer hover:bg-muted/50"
                  onClick={() => requestSort("rank")}
                >
                  <div className="flex items-center">
                    Rank {getSortIndicator("rank")}
                  </div>
                </TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Country</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => requestSort("revenue")}
                >
                  <div className="flex items-center justify-end">
                    Revenue (MoM) {getSortIndicator("revenue")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => requestSort("growth")}
                >
                  <div className="flex items-center justify-end">
                    Growth {getSortIndicator("growth")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => requestSort("profit")}
                >
                  <div className="flex items-center justify-end">
                    Profit Margin {getSortIndicator("profit")}
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => requestSort("score")}
                >
                  <div className="flex items-center justify-end">
                    Score {getSortIndicator("score")}
                  </div>
                </TableHead>
                <TableHead className="w-24 text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => {
                const business = allBusinesses.find(
                  (b) => b.id === item.businessId
                );
                const country = countriesData.find(
                  (c) => c.name === business?.country
                );
                if (!business) return null;
                const isExpanded = expandedRow === item.businessId;

                return (
                  <React.Fragment key={item.businessId}>
                    <TableRow
                      onClick={() => toggleRow(item.businessId)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-bold">{item.rank}</TableCell>
                      <TableCell className="font-medium">
                        {business.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {country?.flag}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(item.revenue / 1000).toFixed(0)}K
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{item.growth}%
                      </TableCell>
                      <TableCell className="text-right">
                        {item.profit}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {item.score}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getTrendIcon(item.trend as any)}
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        <TableCell colSpan={8} className="p-0">
                          <DeepDive businessId={item.businessId} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
