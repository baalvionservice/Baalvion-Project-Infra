"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Globe, Briefcase } from "lucide-react";
import { dashboardApi } from "@/lib/api-client";

export default function EmployeeStats() {
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.employees();
        const arr = ((d as { data?: unknown[] })?.data ?? (Array.isArray(d) ? d : [])) as Record<string, unknown>[];
        if (!cancelled) setEmployees(arr);
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const isActive = (s: unknown) => ["active", "remote"].includes(String(s ?? "").toLowerCase());

  const totalEmployees = employees.length;
  const activeNow = employees.filter((e) => isActive(e.status)).length;
  const countryCount = new Set(employees.map((e) => e.country).filter(Boolean)).size;
  const openPositions = employees.filter((e) => String(e.status ?? "").toLowerCase() === "open").length;

  const stats = [
    { title: "Total Employees", value: totalEmployees, icon: Users },
    { title: "Active Now", value: activeNow, icon: UserCheck },
    { title: "Countries", value: countryCount, icon: Globe },
    { title: "Open Positions", value: openPositions, icon: Briefcase },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
