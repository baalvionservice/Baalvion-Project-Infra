"use client";
import Link from "next/link";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  FileText,
  Activity,
  Users,
  Star,
  BarChart,
  CheckCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

interface EmployeeView {
  name: string; role: string; email: string; country: string; department: string;
  joinDate: string; employmentType: string; manager: string | null;
  directReports: unknown[]; imageId: string;
  performance: { score: number; tasksCompleted: number; attendance: number };
  business: { name: string };
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [employee, setEmployee] = useState<EmployeeView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await dashboardApi.employees();
        const list = (((res as { data?: unknown[] })?.data ?? res ?? []) as Record<string, unknown>[]);
        const e = list.find((x) => String(x.id) === id);
        if (cancelled) return;
        if (e) {
          const rawScore = Number(e.performance_score) || 0;
          // DB stores either /5 (e.g. 4.6) or /100; normalise to /100 for the gauges.
          const score = rawScore <= 5 ? Math.round(rawScore * 20) : Math.round(rawScore);
          const reports = list.filter((x) => String(x.manager_id) === id);
          const mgr = e.manager_id
            ? ((list.find((x) => String(x.id) === String(e.manager_id))?.name as string) ?? null)
            : null;
          const biz = e.business as { name?: string } | undefined;
          setEmployee({
            name: String(e.name ?? ""), role: String(e.role ?? ""), email: String(e.email ?? ""),
            country: String(e.country ?? ""), department: String(e.department ?? ""),
            joinDate: String(e.join_date ?? ""),
            employmentType: String(e.employment_type ?? "").replace(/_/g, " "),
            manager: mgr, directReports: reports, imageId: `user-${e.id}`,
            performance: {
              score,
              tasksCompleted: Number(e.tasks_completed) || 0,
              attendance: Math.round(Number(e.attendance_rate) || 0),
            },
            business: { name: String(biz?.name ?? "") },
          });
        }
      } catch { /* leave null */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading employee…</div>;
  }

  const business = employee?.business;
  if (!employee || !business) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold">404 - Employee Not Found</h1>
        <p className="text-muted-foreground">
          The employee you are looking for does not exist.
        </p>
        <Link href="/employees">
          <Button variant="link" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Employees
          </Button>
        </Link>
      </div>
    );
  }

  const userImage = PlaceHolderImages.find(
    (img) => img.id === employee.imageId
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/employees">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Employees
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary">
            {userImage && (
              <AvatarImage src={userImage.imageUrl} alt={employee.name} />
            )}
            <AvatarFallback className="text-3xl">
              {employee.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {employee.name}
            </h1>
            <p className="text-muted-foreground">{employee.role}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{business.name}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>
                Joined on {new Date(employee.joinDate).toLocaleDateString()}
              </span>
            </div>
            <Badge>{employee.employmentType}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />{" "}
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />{" "}
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />{" "}
                <span>{employee.country}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{employee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manager</span>
                <span className="font-medium">{employee.manager || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Direct Reports</span>
                <span className="font-medium">
                  {employee.directReports?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salary</span>
                <span className="font-mono">****</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Tabs defaultValue="performance">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="performance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    This quarter's performance summary.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted flex flex-col items-center justify-center text-center gap-2">
                    <div className="relative h-24 w-24">
                      <CircularProgress
                        value={employee.performance.score}
                        strokeWidth={8}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">
                          {employee.performance.score}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /100
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Overall Score</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted flex flex-col items-center justify-center text-center gap-2">
                    <div className="relative h-24 w-24">
                      <CircularProgress
                        value={(employee.performance.tasksCompleted / 80) * 100}
                        strokeWidth={8}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">
                          {employee.performance.tasksCompleted}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Tasks
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Tasks Completed</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted flex flex-col items-center justify-center text-center gap-2">
                    <div className="relative h-24 w-24">
                      <CircularProgress
                        value={employee.performance.attendance}
                        strokeWidth={8}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">
                          {employee.performance.attendance}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Attendance</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Employment_Contract.pdf</TableCell>
                        <TableCell>Contract</TableCell>
                        <TableCell>Jan 15, 2020</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>ID_Verification.pdf</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>Jan 15, 2020</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Form_W2_2023.pdf</TableCell>
                        <TableCell>Tax</TableCell>
                        <TableCell>Feb 1, 2024</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-muted-foreground" />{" "}
                      <span className="text-sm">Logged in from new device</span>{" "}
                      <span className="text-xs text-muted-foreground ml-auto">
                        2 hours ago
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />{" "}
                      <span className="text-sm">
                        Accessed Q2 Financial Report
                      </span>{" "}
                      <span className="text-xs text-muted-foreground ml-auto">
                        1 day ago
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />{" "}
                      <span className="text-sm">
                        Completed task 'Finalize Q3 Budget'
                      </span>{" "}
                      <span className="text-xs text-muted-foreground ml-auto">
                        3 days ago
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
