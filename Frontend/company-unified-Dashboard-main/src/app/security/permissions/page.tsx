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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import permissionsData from "@/lib/data/permissions.json";
import { useToast } from "@/hooks/use-toast";

type Role = "Admin" | "Investor" | "Co-Founder" | "Employee";
const roles: Role[] = ["Admin", "Investor", "Co-Founder", "Employee"];

export default function PermissionsPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [permissions, setPermissions] = useState(permissionsData.roles);
  const { toast } = useToast();

  const handlePermissionChange = (
    role: Role,
    permission: string,
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: value,
      },
    }));
  };

  const handleSaveChanges = () => {
    setModalOpen(false);
    toast({
      title: "Permissions Updated",
      description: "Role access levels have been successfully saved.",
    });
  };

  const renderPermissionCell = (permissionValue: boolean | string) => {
    if (typeof permissionValue === "boolean") {
      return permissionValue ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-red-500" />
      );
    }
    return (
      <span className="text-xs text-muted-foreground">{permissionValue}</span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Role Access Matrix
        </h1>
        <p className="text-muted-foreground">
          Define and manage what each role can see and do.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Permission Overview</CardTitle>
            <CardDescription>
              A detailed grid of permissions for each role in the organization.
            </CardDescription>
          </div>
          <Button onClick={() => setModalOpen(true)}>Edit Permissions</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 sm:w-[250px]">
                    Permission
                  </TableHead>
                  {roles.map((role) => (
                    <TableHead key={role} className="text-center">
                      {role}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionsData.permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      {permission.module}
                    </TableCell>
                    {roles.map((role) => (
                      <TableCell key={role} className="text-center">
                        <div className="flex justify-center">
                          {renderPermissionCell(
                            permissions[role][
                              permission.module.toLowerCase() as keyof (typeof permissions)[Role]
                            ]
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions</DialogTitle>
            <DialogDescription>
              Toggle permissions for each role. Changes will apply immediately
              after saving.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 sm:w-[250px]">
                    Permission
                  </TableHead>
                  {roles.map((role) => (
                    <TableHead key={role} className="text-center">
                      {role}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionsData.permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium text-sm">
                      {permission.module}
                    </TableCell>
                    {roles.map((role) => (
                      <TableCell key={role} className="text-center">
                        <div className="flex justify-center">
                          {typeof permissions[role][
                            permission.module.toLowerCase() as keyof (typeof permissions)[Role]
                          ] === "boolean" ? (
                            <Switch
                              checked={
                                permissions[role][
                                  permission.module.toLowerCase() as keyof (typeof permissions)[Role]
                                ] as boolean
                              }
                              onCheckedChange={(value) =>
                                handlePermissionChange(
                                  role,
                                  permission.module.toLowerCase(),
                                  value
                                )
                              }
                            />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
