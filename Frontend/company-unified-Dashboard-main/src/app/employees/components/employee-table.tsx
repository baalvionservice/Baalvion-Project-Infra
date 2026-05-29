"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  ArrowLeft,
  ArrowRight,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { dashboardApi } from "@/lib/api-client";

interface EmpRow { id: string; name: string; email: string; role: string; businessId: string; country: string; status: string; joinDate: string; imageId: string; department: string; }
interface NameRef { id: string; name: string; }

const PAGE_SIZE = 10;

type EmployeeTableProps = {
  searchParams?: {
    q?: string;
    business?: string;
    country?: string;
    department?: string;
    status?: string;
    page?: string;
  };
};

function Filters({
  searchParams,
  onFilterChange,
  onSearchChange,
  businesses,
  countries,
  departments,
  statuses,
}: {
  searchParams: EmployeeTableProps["searchParams"];
  onFilterChange: (name: string) => (value: string) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  businesses: NameRef[];
  countries: NameRef[];
  departments: string[];
  statuses: string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          className="pl-8 w-full"
          defaultValue={searchParams?.q}
          onChange={onSearchChange}
        />
      </div>
      <Select
        value={searchParams?.business || "all"}
        onValueChange={onFilterChange("business")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Business" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Businesses</SelectItem>
          {businesses.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams?.country || "all"}
        onValueChange={onFilterChange("country")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {countries.map((c) => (
            <SelectItem key={c.id} value={c.name}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams?.department || "all"}
        onValueChange={onFilterChange("department")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams?.status || "all"}
        onValueChange={onFilterChange("status")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function EmployeeTable({ searchParams }: EmployeeTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const [employees, setEmployees] = useState<EmpRow[]>([]);
  const [businesses, setBusinesses] = useState<NameRef[]>([]);
  const [countries, setCountries] = useState<NameRef[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [empRes, bizRes, ctyRes] = await Promise.all([
          dashboardApi.employees(), dashboardApi.businesses(), dashboardApi.countries(),
        ]);
        const empArr = ((empRes as { data?: unknown[] })?.data ?? (Array.isArray(empRes) ? empRes : [])) as Record<string, unknown>[];
        const bizArr = ((bizRes as { data?: unknown[] })?.data ?? (Array.isArray(bizRes) ? bizRes : [])) as Record<string, unknown>[];
        const ctyArr = (Array.isArray(ctyRes) ? ctyRes : (ctyRes as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[];
        if (cancelled) return;
        setEmployees(empArr.map((e) => ({
          id: String(e.id), name: String(e.name ?? ""), email: String(e.email ?? ""),
          role: String(e.role ?? ""), businessId: String(e.business_id ?? ""), country: String(e.country ?? ""),
          status: String(e.status ?? ""), joinDate: String(e.join_date ?? e.joinDate ?? new Date().toISOString()),
          imageId: `user-${e.id}`, department: String(e.department ?? ""),
        })));
        setBusinesses(bizArr.map((b) => ({ id: String(b.id), name: String(b.name ?? "") })));
        setCountries(ctyArr.map((c) => ({ id: String(c.code ?? c.name ?? ""), name: String(c.name ?? "") })));
      } catch { /* leave empty on error */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))], [employees]);
  const statuses = useMemo(() => [...new Set(employees.map((e) => e.status).filter(Boolean))], [employees]);

  const getBusinessName = (businessId: string) =>
    businesses.find((b) => b.id === businessId)?.name || businessId || "—";

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const query = searchParams?.q?.toLowerCase() || "";
      const business = searchParams?.business;
      const country = searchParams?.country;
      const department = searchParams?.department;
      const status = searchParams?.status;

      if (query && !employee.name.toLowerCase().includes(query)) return false;
      if (business && business !== "all" && employee.businessId !== business)
        return false;
      if (country && country !== "all" && employee.country !== country)
        return false;
      if (
        department &&
        department !== "all" &&
        employee.department !== department
      )
        return false;
      if (status && status !== "all" && employee.status !== status)
        return false;

      return true;
    });
  }, [searchParams, employees]);

  const currentPage = Number(searchParams?.page || "1");
  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalEmployees / PAGE_SIZE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | null>) => {
      const params = new URLSearchParams(currentSearchParams.toString());
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value) {
          params.set(name, String(value));
        } else {
          params.delete(name);
        }
      }
      return params.toString();
    },
    [currentSearchParams]
  );

  const handleFilterChange = (name: string) => (value: string) => {
    const params = { [name]: value === "all" ? null : value, page: 1 };
    router.push(pathname + "?" + createQueryString(params));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const params = { q: event.target.value || null, page: 1 };
    router.push(pathname + "?" + createQueryString(params));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Directory</CardTitle>
        <CardDescription>
          Browse and manage your organization's personnel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile Filters */}
        <div className="pb-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Employees</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <Filters
                  searchParams={searchParams}
                  onFilterChange={handleFilterChange}
                  onSearchChange={handleSearchChange}
                  businesses={businesses}
                  countries={countries}
                  departments={departments}
                  statuses={statuses}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Desktop Filters */}
        <div className="hidden md:flex flex-wrap items-center gap-2 pb-4">
          <Filters
            searchParams={searchParams}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            businesses={businesses}
            countries={countries}
            departments={departments}
            statuses={statuses}
          />
        </div>

        {/* Mobile Card View */}
        <div className="space-y-4 md:hidden">
          {paginatedEmployees.map((employee) => {
            const image = PlaceHolderImages.find(
              (img) => img.id === employee.imageId
            );
            return (
              <Card key={employee.id} className="p-4">
                <div className="flex items-start justify-between">
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
                    <div>
                      <Link
                        href={`/employees/${employee.id}`}
                        className="font-medium hover:underline"
                      >
                        {employee.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {employee.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/employees/${employee.id}`} passHref>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p>{employee.role}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Business</p>
                    <p>{getBusinessName(employee.businessId)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Country</p>
                    <p>{employee.country}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="outline">{employee.status}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.map((employee) => {
                const image = PlaceHolderImages.find(
                  (img) => img.id === employee.imageId
                );
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Link
                        href={`/employees/${employee.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar>
                          {image && <AvatarImage src={image.imageUrl} />}
                          <AvatarFallback>
                            {employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium group-hover:underline">
                            {employee.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.email}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>
                      {getBusinessName(employee.businessId)}
                    </TableCell>
                    <TableCell>{employee.country}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(employee.joinDate), "PP")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/employees/${employee.id}`} passHref>
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Showing{" "}
          <strong>
            {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, totalEmployees)}
          </strong>{" "}
          of <strong>{totalEmployees}</strong> employees
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={
              pathname +
              "?" +
              createQueryString({
                page: currentPage > 1 ? currentPage - 1 : null,
              })
            }
          >
            <Button variant="outline" size="sm" disabled={currentPage <= 1}>
              Previous
            </Button>
          </Link>
          <Link
            href={
              pathname +
              "?" +
              createQueryString({
                page: currentPage < totalPages ? currentPage + 1 : null,
              })
            }
          >
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
