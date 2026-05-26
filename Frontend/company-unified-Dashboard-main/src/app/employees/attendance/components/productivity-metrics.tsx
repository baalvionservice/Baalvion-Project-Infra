"use client";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Target, Clock, Users, Star } from "lucide-react";
import attendanceData from "@/lib/data/attendance.json";
import employeesData from "@/lib/data/employees.json";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";

function ProductivityMetricsContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const isAdmin = !role || role === "ADMIN";

  const { productivity } = attendanceData;
  const tasksAchievement =
    (productivity.tasksCompleted / productivity.tasksTarget) * 100;

  const getEmployee = (id: string) => employeesData.find((e) => e.id === id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productivity Metrics (This Week)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" /> Tasks Completed
              </p>
              <Progress value={tasksAchievement} />
              <p className="text-xs text-muted-foreground">
                {productivity.tasksCompleted} / {productivity.tasksTarget} tasks
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg. Response Time
                </p>
                <p className="font-bold">{productivity.avgResponseTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Users className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Meetings This Week
                </p>
                <p className="font-bold">
                  {productivity.meetingsThisWeek} Total
                </p>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-2">Productivity Leaderboard</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Tasks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productivity.leaderboard.map((item, index) => {
                    const employee = getEmployee(item.employeeId);
                    if (!employee) return null;
                    const userImage = PlaceHolderImages.find(
                      (p) => p.id === employee.imageId
                    );
                    return (
                      <TableRow key={item.employeeId}>
                        <TableCell className="font-bold">{index + 1}</TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {userImage && (
                                  <AvatarImage src={userImage.imageUrl} />
                                )}
                                <AvatarFallback>
                                  {employee.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{employee.name}</span>
                            </div>
                          ) : (
                            `Employee #${item.employeeId.slice(-4)}`
                          )}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />{" "}
                          {item.score}
                        </TableCell>
                        <TableCell>{item.tasks}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductivityMetricsFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productivity Metrics (This Week)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-6 bg-muted animate-pulse rounded" />
              <div className="space-y-1">
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="h-5 w-40 bg-muted animate-pulse rounded mb-2" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <div className="h-4 w-8 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductivityMetrics() {
  return (
    <Suspense fallback={<ProductivityMetricsFallback />}>
      <ProductivityMetricsContent />
    </Suspense>
  );
}
