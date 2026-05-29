"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { dashboardApi } from "@/lib/api-client";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface Emp { id: string; name: string; role: string; businessId: string; status: string; imageId: string; }

export default function MobileEmployeeList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [er, br] = await Promise.all([dashboardApi.employees(), dashboardApi.businesses()]);
        const ea = ((er as { data?: unknown[] })?.data ?? (Array.isArray(er) ? er : [])) as Record<string, unknown>[];
        const ba = ((br as { data?: unknown[] })?.data ?? (Array.isArray(br) ? br : [])) as Record<string, unknown>[];
        if (cancelled) return;
        setEmployees(ea.map((e) => ({
          id: String(e.id), name: String(e.name ?? ""), role: String(e.role ?? ""),
          businessId: String(e.business_id ?? ""), status: String(e.status ?? ""), imageId: `user-${e.id}`,
        })));
        setBusinesses(ba.map((b) => ({ id: String(b.id), name: String(b.name ?? "") })));
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBusinessName = (businessId: string) =>
    businesses.find((b) => b.id === businessId)?.name || businessId || "—";

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        {filteredEmployees.map((employee) => {
          const image = PlaceHolderImages.find((img) => img.id === employee.imageId);
          return (
            <Card key={employee.id} className="p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  {image && <AvatarImage src={image.imageUrl} />}
                  <AvatarFallback>
                    {employee.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{employee.role}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{getBusinessName(employee.businessId)}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{employee.status}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
