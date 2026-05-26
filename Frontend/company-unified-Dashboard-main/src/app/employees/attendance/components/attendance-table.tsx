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
import { cn } from "@/lib/utils";
import attendanceData from "@/lib/data/attendance.json";
import employeesData from "@/lib/data/employees.json";
import businessesData from "@/lib/data/businesses";

type Status = "Present" | "Late" | "Absent" | "Remote" | "On Leave";

const statusColors: Record<Status, string> = {
  Present:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
  Late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300",
  Absent:
    "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300",
  Remote:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
  "On Leave":
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300",
};

export default function AttendanceTable() {
  const todayLog = attendanceData.todayLog;

  const getEmployeeName = (id: string) =>
    employeesData.find((e) => e.id === id)?.name || "Unknown";
  const getBusinessName = (id: string) =>
    businessesData.find((b) => b.id === id)?.name || "Unknown";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Attendance Log</CardTitle>
        <CardDescription>
          A detailed log of employee clock-in and clock-out times for today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayLog.map((log) => (
                <TableRow key={log.employeeId}>
                  <TableCell className="font-medium">
                    {getEmployeeName(log.employeeId)}
                  </TableCell>
                  <TableCell>{getBusinessName(log.businessId)}</TableCell>
                  <TableCell>{log.clockIn || "—"}</TableCell>
                  <TableCell>{log.clockOut || "—"}</TableCell>
                  <TableCell>{log.hours}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(statusColors[log.status as Status])}
                    >
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
