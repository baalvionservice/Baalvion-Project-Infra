"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { dashboardApi } from "@/lib/api-client";

type Status = "Present" | "Late" | "Absent" | "Remote" | "On Leave";

const statusColors: Record<Status, string> = {
  Present: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
  Late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300",
  Absent: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300",
  Remote: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
  "On Leave": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300",
};

interface Row { id: number; name: string; department: string; hours: string | number; status: string; }

const labelStatus = (s: string): string =>
  s === "on_leave" ? "On Leave" : s.charAt(0).toUpperCase() + s.slice(1);

export default function AttendanceTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.attendance();
        const arr = ((d as { data?: unknown[] })?.data ?? (Array.isArray(d) ? d : [])) as Record<string, unknown>[];
        if (!cancelled) {
          setRows(arr.map((r) => {
            const emp = r.employee as { name?: string; department?: string } | undefined;
            return {
              id: Number(r.id),
              name: emp?.name ?? "Unknown",
              department: emp?.department ?? "—",
              hours: (r.hours_worked as string | number) ?? "—",
              status: labelStatus(String(r.status ?? "")),
            };
          }));
        }
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Attendance Log</CardTitle>
        <CardDescription>
          A detailed log of employee attendance for today. {loading ? "(loading…)" : `(${rows.length} live records)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.name}</TableCell>
                  <TableCell>{log.department}</TableCell>
                  <TableCell>{log.hours}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(statusColors[log.status as Status])}>
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
