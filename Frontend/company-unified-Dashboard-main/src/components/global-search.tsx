"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FileText, Building, Users, Banknote, SearchX } from "lucide-react";
import { navItems } from "@/lib/nav-config";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import { dashboardApi } from "@/lib/api-client";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({
  open,
  onOpenChange,
}: GlobalSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { businesses, employees } = useDashboardRefs();
  const [reports, setReports] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await dashboardApi.financeReports();
        const raw = ((res as { data?: unknown }).data ?? res) as unknown;
        const list = (Array.isArray(raw) ? raw : ((raw as { reports?: unknown[] })?.reports ?? [])) as Record<string, unknown>[];
        if (!cancelled) setReports(list.map((r) => ({ id: String(r.id ?? r.name), name: String(r.name ?? "") })));
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  const searchResults = {
    businesses: businesses
      .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 3),
    employees: employees
      .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 3),
    pages: navItems
      .filter((p) => p.label.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 3),
    reports: reports
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 3),
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search businesses, employees, pages..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm">
            <SearchX className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-semibold">No results found</p>
            <p className="mt-1 text-muted-foreground">
              Try searching for something else.
            </p>
          </div>
        </CommandEmpty>

        {searchResults.businesses.length > 0 && (
          <CommandGroup heading="Businesses">
            {searchResults.businesses.map((biz) => (
              <CommandItem
                key={biz.id}
                onSelect={() => handleSelect(`/businesses`)}
              >
                <Building className="mr-2 h-4 w-4" />
                <span>{biz.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults.employees.length > 0 && (
          <CommandGroup heading="Employees">
            {searchResults.employees.map((emp) => (
              <CommandItem
                key={emp.id}
                onSelect={() => handleSelect(`/employees/${emp.id}`)}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{emp.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults.pages.length > 0 && (
          <CommandGroup heading="Pages">
            {searchResults.pages.map((page) => (
              <CommandItem
                key={page.href}
                onSelect={() => handleSelect(page.href)}
              >
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults.reports.length > 0 && (
          <CommandGroup heading="Reports">
            {searchResults.reports.map((report) => (
              <CommandItem
                key={report.id}
                onSelect={() => handleSelect(`/finance/reports`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{report.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
