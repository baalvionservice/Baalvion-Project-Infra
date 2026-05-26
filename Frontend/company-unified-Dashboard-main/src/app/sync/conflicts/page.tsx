"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import allConflicts from "@/lib/data/conflicts.json";
import resolvedConflicts from "@/lib/data/resolved-conflicts.json";
import businessesData from "@/lib/data/businesses";

export default function ConflictResolutionPage() {
  const [conflicts, setConflicts] = useState(allConflicts);
  const { toast } = useToast();

  const handleResolve = (conflictId: string, resolution: string) => {
    setConflicts(conflicts.filter((c) => c.id !== conflictId));
    toast({
      title: "Conflict Resolved",
      description: `The conflict has been resolved by selecting: ${resolution}.`,
      className:
        "bg-green-100 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-300",
    });
  };

  const getBusinessName = (businessId: string) => {
    return businessesData.find((b) => b.id === businessId)?.name || businessId;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Conflict Resolution
        </h1>
        <p className="text-muted-foreground">
          Review and resolve data synchronization conflicts between online and
          offline sources.
        </p>
      </div>

      <Alert
        variant="destructive"
        className="bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-300 [&>svg]:text-orange-800 dark:[&>svg]:text-orange-300"
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-bold">
          {conflicts.length} Data Conflicts Need Resolution
        </AlertTitle>
        <AlertDescription>
          Last conflict detected: 35 minutes ago. Please review the items below.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Active Conflicts</CardTitle>
          <CardDescription>
            Select an action to resolve each data mismatch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 sm:w-[50px]">#</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Offline Value</TableHead>
                  <TableHead>Online Value</TableHead>
                  <TableHead>Detected At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflicts.length > 0 ? (
                  conflicts.map((conflict, index) => (
                    <TableRow key={conflict.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {getBusinessName(conflict.businessId)}
                      </TableCell>
                      <TableCell>{conflict.field}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {conflict.offlineValue}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {conflict.onlineValue}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(conflict.detectedAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() =>
                            handleResolve(conflict.id, "Kept Offline")
                          }
                        >
                          Keep Offline
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() =>
                            handleResolve(conflict.id, "Kept Online")
                          }
                        >
                          Keep Online
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleResolve(conflict.id, "Merge / Review")
                          }
                        >
                          Merge / Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <p className="font-medium">All conflicts resolved!</p>
                        <p className="text-sm text-muted-foreground">
                          No active data conflicts to display.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolution History</CardTitle>
          <CardDescription>
            A log of the 10 most recently resolved conflicts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Action Taken</TableHead>
                  <TableHead>Resolved By</TableHead>
                  <TableHead>Resolved At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedConflicts.slice(0, 10).map((resolved) => (
                  <TableRow key={resolved.id}>
                    <TableCell className="font-medium">
                      {resolved.field}
                    </TableCell>
                    <TableCell>
                      {getBusinessName(resolved.businessId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{resolved.action}</Badge>
                    </TableCell>
                    <TableCell>{resolved.resolvedBy}</TableCell>
                    <TableCell>
                      {format(new Date(resolved.resolvedAt), "PPpp")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
