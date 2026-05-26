"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Github,
  Webhook,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type { IntegrationLogSource } from "@/lib/types";
import type { IntegrationLogWithDetails } from "./page";

const sources: (IntegrationLogSource | "All")[] = [
  "All",
  "GitHub",
  "Webhook",
  "Jira",
  "Slack",
  "Sentry",
  "Vercel",
];
const statuses: ("All" | "Success" | "Warning" | "Error")[] = [
  "All",
  "Success",
  "Warning",
  "Error",
];

const getStatusVariant = (status: "Success" | "Warning" | "Error") => {
  switch (status) {
    case "Success":
      return "default";
    case "Error":
      return "destructive";
    case "Warning":
      return "warning";
    default:
      return "outline";
  }
};

const getSourceIcon = (source: IntegrationLogSource) => {
  switch (source) {
    case "GitHub":
      return <Github className="h-4 w-4" />;
    case "Webhook":
      return <Webhook className="h-4 w-4" />;
    // Add more icons for Jira, Slack, etc. if available
    default:
      return <Webhook className="h-4 w-4" />;
  }
};

export function IntegrationLogList({
  data,
}: {
  data: IntegrationLogWithDetails[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<
    IntegrationLogSource | "All"
  >("All");
  const [statusFilter, setStatusFilter] = useState<
    "Success" | "Warning" | "Error" | "All"
  >("All");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = (item.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSource =
        sourceFilter === "All" || item.source === sourceFilter;
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [data, searchTerm, sourceFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
        <div className="relative flex-1 md:grow-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search log descriptions..."
            className="pl-10 min-w-[200px] md:min-w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={sourceFilter}
          onValueChange={(value) =>
            setSourceFilter(value as IntegrationLogSource | "All")
          }
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "Success" | "Warning" | "Error" | "All")
          }
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {getSourceIcon(item.source)}
                      <span>{item.source}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.eventType}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {item.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.timestamp), "PPp")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No integration logs found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
