"use client";
import EmployeeStats from "./components/employee-stats";
import EmployeeTable from "./components/employee-table";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState, useEffect, use } from "react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import AttendanceSummary from "./components/attendance-summary";
import MobileEmployeeList from "./components/mobile-employee-list";

function EmployeePageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <TableSkeleton columns={7} rows={10} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    business?: string;
    country?: string;
    department?: string;
    status?: string;
    page?: string;
    role?: string;
  }>;
}) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const params = searchParams ? use(searchParams) : undefined;
  const role = params?.role;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    const isDemo = localStorage.getItem("baalvion_demo_mode") === "true";
    const setupComplete = localStorage.getItem("setup_complete") === "true";
    if (!isDemo && !setupComplete) {
      setIsNewUser(true);
    }
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <EmployeePageSkeleton />;
  }

  if (isNewUser) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage and view all personnel across your businesses.
          </p>
        </div>
        <EmptyState
          title="Add your first employee"
          description="Your employee directory is empty. Invite your team members to get started with managing payroll, roles, and permissions."
          imageSeed="team-working"
          imageHint="people working office"
          actionButton={
            <Button size="lg">
              <PlusCircle className="mr-2" /> Add Employee
            </Button>
          }
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your team on the go.</p>
        </div>
        {role === "EMPLOYEE" && (
          <Button size="lg" className="w-full h-16 text-lg">
            Clock In
          </Button>
        )}
        {role !== "EMPLOYEE" && <AttendanceSummary />}
        <MobileEmployeeList />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage and view all personnel across your businesses.
        </p>
      </div>

      <EmployeeStats />

      <EmployeeTable searchParams={params} />
    </div>
  );
}
