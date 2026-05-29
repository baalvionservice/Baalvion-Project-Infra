"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { dashboardApi } from "@/lib/api-client";

// The backend RBAC model uses SYSTEM roles (admin/manager/viewer) with per-module action arrays.
// This page renders that live matrix faithfully (was a static business-role boolean grid).
interface ModulePerm { module: string; actions: string[] }
type Matrix = Record<string, ModulePerm[]>;

const actionColor: Record<string, string> = {
  read: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
  write: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300",
};

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<Matrix>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.permissionMatrix();
        const obj = ((d as { data?: unknown })?.data ?? d) as Matrix;
        if (!cancelled && obj) setMatrix(obj);
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const roles = Object.keys(matrix);
  // Union of all modules across roles, stable order.
  const modules = Array.from(
    new Set(roles.flatMap((r) => (matrix[r] ?? []).map((m) => m.module)))
  );
  const actionsFor = (role: string, module: string): string[] =>
    (matrix[role] ?? []).find((m) => m.module === module)?.actions ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Access Matrix</h1>
        <p className="text-muted-foreground">
          Live permissions for each system role across modules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Overview</CardTitle>
          <CardDescription>
            A detailed grid of allowed actions per role and module (from the live RBAC policy).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 sm:w-[250px]">Module</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role} className="text-center capitalize">
                      {role.replace("_", " ")}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module}>
                    <TableCell className="font-medium capitalize">{module}</TableCell>
                    {roles.map((role) => {
                      const actions = actionsFor(role, module);
                      return (
                        <TableCell key={role} className="text-center">
                          {actions.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-1">
                              {actions.map((a) => (
                                <Badge key={a} variant="outline" className={actionColor[a] ?? ""}>
                                  {a}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {modules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={roles.length + 1} className="text-center text-muted-foreground py-8">
                      <Check className="mx-auto h-6 w-6 mb-2 text-muted-foreground/40" />
                      Loading permission matrix…
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
