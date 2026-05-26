import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Globe, Briefcase } from "lucide-react";
import employeesData from "@/lib/data/employees.json";
import businessesData from "@/lib/data/businesses";

export default function EmployeeStats() {
  const totalEmployees = employeesData.length;
  const activeNow = employeesData.filter(
    (e) => e.status === "Active" || e.status === "Remote"
  ).length;
  const countryCount = new Set(employeesData.map((e) => e.country)).size;
  const openPositions = 8; // Mock data

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
