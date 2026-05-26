"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import employeesData from "@/lib/data/employees.json";
import businessesData from "@/lib/data/businesses";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function MobileEmployeeList() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employeesData.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBusinessName = (businessId: string) =>
    businessesData.find((b) => b.id === businessId)?.name || businessId;

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
          const image = PlaceHolderImages.find(
            (img) => img.id === employee.imageId
          );
          return (
            <Card key={employee.id} className="p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  {image && <AvatarImage src={image.imageUrl} />}
                  <AvatarFallback>
                    {employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.role}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    {getBusinessName(employee.businessId)}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {employee.status}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
