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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Settings, PlusCircle } from "lucide-react";
import { useEffect } from "react";
import { dashboardApi } from "@/lib/api-client";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import { format } from "date-fns";

interface Portal { id: string; name: string; url: string; pin: string; includedBusinesses: string[]; expires: string; investorName: string }

export default function PortalGeneratorPage() {
  const { toast } = useToast();
  const { businesses: businessesData } = useDashboardRefs();
  const [portalsData, setPortalsData] = useState<Portal[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.portals();
        const arr = (Array.isArray(d) ? d : (d as { data?: unknown[] })?.data ?? []) as Portal[];
        if (!cancelled) setPortalsData(arr);
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${url}`);
    toast({
      title: "Link Copied",
      description: "The portal link has been copied to your clipboard.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investor Portals</h1>
        <p className="text-muted-foreground">
          Create and manage secure, read-only portals for your investors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle /> Create New Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portal-name">Portal Name</Label>
                <Input
                  id="portal-name"
                  placeholder="e.g., Q4 Investor Update"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investor-name">Investor Name</Label>
                <Input
                  id="investor-name"
                  placeholder="e.g., General Partners"
                />
              </div>
              <div className="space-y-2">
                <Label>Included Businesses</Label>
                <div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">
                  {businessesData.map((biz) => (
                    <div key={biz.id} className="flex items-center gap-2">
                      <Checkbox id={`biz-${biz.id}`} />
                      <Label htmlFor={`biz-${biz.id}`} className="font-normal">
                        {biz.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry</Label>
                <Select>
                  <SelectTrigger id="expiry">
                    <SelectValue placeholder="Select expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pin-protect" />
                <Label htmlFor="pin-protect">Protect with PIN</Label>
              </div>
              <Button className="w-full">Generate Portal</Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Portals</CardTitle>
              <CardDescription>
                Manage previously created investor portals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>PIN</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portalsData.map((portal) => (
                      <TableRow key={portal.id}>
                        <TableCell className="font-medium">
                          {portal.name}
                        </TableCell>
                        <TableCell>{portal.investorName}</TableCell>
                        <TableCell>
                          {portal.expires
                            ? format(new Date(portal.expires), "PP")
                            : "Never"}
                        </TableCell>
                        <TableCell>{portal.pin ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(portal.url)}
                          >
                            <Copy className="mr-2 h-3 w-3" /> Copy Link
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
