"use client";

import { useState } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronsUpDown,
  Users,
  Briefcase,
  DollarSign,
  BarChart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

import departmentsData from "@/lib/data/departments.json";
import employeesData from "@/lib/data/employees.json";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import HeadcountSparkline from "./headcount-sparkline";
import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/types";

export default function DepartmentsTable() {
  const [openDepartment, setOpenDepartment] = useState<string | null>(
    departmentsData[0].id
  );

  const getEmployee = (id: string) => employeesData.find((e) => e.id === id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Departments Overview</CardTitle>
        <CardDescription>
          An overview of all departments across the organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 sm:w-[50px]"></TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Businesses</TableHead>
                <TableHead>Avg. Salary</TableHead>
                <TableHead>Open Roles</TableHead>
                <TableHead>Headcount Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentsData.map((dept) => {
                const head = getEmployee(dept.headId);
                const headImage = head
                  ? PlaceHolderImages.find((p) => p.id === head.imageId)
                  : null;
                const isExpanded = openDepartment === dept.id;

                return (
                  <Collapsible
                    asChild
                    key={dept.id}
                    open={isExpanded}
                    onOpenChange={() =>
                      setOpenDepartment(isExpanded ? null : dept.id)
                    }
                  >
                    <>
                      <TableRow className="cursor-pointer">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronsUpDown className="h-4 w-4" />
                              <span className="sr-only">Toggle</span>
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">
                          {dept.name}
                        </TableCell>
                        <TableCell>
                          {head && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {headImage && (
                                  <AvatarImage src={headImage.imageUrl} />
                                )}
                                <AvatarFallback>
                                  {head.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{head.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{dept.employeeCount}</TableCell>
                        <TableCell>{dept.businessCount}</TableCell>
                        <TableCell>
                          ${dept.avgSalary.toLocaleString()}
                        </TableCell>
                        <TableCell>{dept.openRoles}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "flex items-center",
                              dept.headcountChange > 0
                                ? "text-green-500"
                                : "text-red-500"
                            )}
                          >
                            {dept.headcountChange > 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {dept.headcountChange}
                          </span>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <tr className="bg-muted/50 hover:bg-muted/50">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-1">
                                <h4 className="font-semibold mb-2">
                                  Employee Roster
                                </h4>
                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                  {dept.employees.map((empId) => {
                                    const emp = getEmployee(empId);
                                    if (!emp) return null;
                                    const empImage = PlaceHolderImages.find(
                                      (p) => p.id === emp.imageId
                                    );
                                    return (
                                      <div
                                        key={empId}
                                        className="flex items-center gap-2"
                                      >
                                        <Avatar className="h-6 w-6">
                                          {empImage && (
                                            <AvatarImage
                                              src={empImage.imageUrl}
                                            />
                                          )}
                                          <AvatarFallback>
                                            {emp.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-sm font-medium">
                                            {emp.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {emp.role}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="md:col-span-1">
                                <h4 className="font-semibold mb-2">Budget</h4>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Allocated
                                      </p>
                                      <p className="font-bold">
                                        $
                                        {dept.budget.allocated.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Spent
                                      </p>
                                      <p className="font-bold">
                                        ${dept.budget.spent.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="md:col-span-1">
                                <h4 className="font-semibold mb-2">
                                  Headcount Trend (6 Mo)
                                </h4>
                                <HeadcountSparkline
                                  data={dept.headcountTrend}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
