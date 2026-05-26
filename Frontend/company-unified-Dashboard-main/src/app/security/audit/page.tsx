"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileWarning } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import auditLogsData from "@/lib/data/audit-logs.json";
import usersData from "@/lib/data/users.json";
import { Calendar } from "@/components/ui/calendar";

type Severity = "Info" | "Warning" | "Critical";
type Action =
  | "LOGIN"
  | "LOGOUT"
  | "VIEW"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "EXPORT"
  | "PERMISSION_CHANGE"
  | "FAILED_LOGIN";
type Status = "Success" | "Failed";

const severityColors: Record<Severity, string> = {
  Critical:
    "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300",
  Warning:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
  Info: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
};

const actionTypes: Action[] = [
  "LOGIN",
  "LOGOUT",
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "EXPORT",
  "PERMISSION_CHANGE",
  "FAILED_LOGIN",
];
const severities: Severity[] = ["Info", "Warning", "Critical"];
const statuses: Status[] = ["Success", "Failed"];

export default function AuditLogPage() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [filters, setFilters] = useState({
    user: "all",
    action: "all",
    severity: "all",
    status: "all",
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (filterName: string) => (value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const securityEvents = useMemo(() => {
    return auditLogsData.filter(
      (log) => log.severity === "Critical" || log.severity === "Warning"
    );
  }, []);

  const filteredLogs = useMemo(() => {
    return auditLogsData.filter((log) => {
      if (filters.user !== "all" && log.user !== filters.user) return false;
      if (filters.action !== "all" && log.action !== filters.action)
        return false;
      if (filters.severity !== "all" && log.severity !== filters.severity)
        return false;
      if (filters.status !== "all" && log.status !== filters.status)
        return false;
      if (date?.from && new Date(log.timestamp) < date.from) return false;
      if (date?.to && new Date(log.timestamp) > date.to) return false;
      return true;
    });
  }, [filters, date]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track and review all user activity across the platform.
        </p>
      </div>

      <Tabs defaultValue="all-logs">
        <TabsList>
          <TabsTrigger value="all-logs">All Logs</TabsTrigger>
          <TabsTrigger value="security-events">Security Events</TabsTrigger>
        </TabsList>
        <TabsContent value="all-logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Audit Trail</CardTitle>
              <CardDescription>
                A detailed record of all actions performed within the
                application. Last updated:{" "}
                {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 pb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Select
                  value={filters.user}
                  onValueChange={handleFilterChange("user")}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {[...new Set(usersData.map((u) => u.name))].map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.action}
                  onValueChange={handleFilterChange("action")}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.severity}
                  onValueChange={handleFilterChange("severity")}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    {severities.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={handleFilterChange("status")}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.timestamp), "PPpp")}
                        </TableCell>
                        <TableCell>
                          {log.user}{" "}
                          {log.role && (
                            <span className="text-muted-foreground text-xs">
                              ({log.role})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.resource}
                        </TableCell>
                        <TableCell>
                          {log.ipAddress}{" "}
                          <span className="text-muted-foreground text-xs">
                            ({log.location})
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.status === "Success"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              severityColors[log.severity as Severity]
                            )}
                          >
                            {log.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security-events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                A focused view of potentially critical security-related events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert
                variant="destructive"
                className="bg-red-100 border-red-300 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-300 [&>svg]:text-red-800 dark:[&>svg]:text-red-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">
                  Account Locked: Unknown User
                </AlertTitle>
                <AlertDescription>
                  3 failed login attempts from Belarus IP 192.168.1.101. The
                  account has been temporarily locked.
                </AlertDescription>
              </Alert>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityEvents.map((event) => (
                      <TableRow
                        key={event.id}
                        className={
                          event.severity === "Critical"
                            ? "bg-red-50 dark:bg-red-950/50"
                            : "bg-orange-50 dark:bg-orange-950/50"
                        }
                      >
                        <TableCell>
                          {format(new Date(event.timestamp), "PPpp")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {event.action}
                        </TableCell>
                        <TableCell>{event.resource}</TableCell>
                        <TableCell>
                          {event.ipAddress} ({event.location})
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
