"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import businesses from "@/lib/data/businesses";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const gateway = searchParams.get("gateway") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const businessId = searchParams.get("businessId") ?? "all";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const date: DateRange | undefined =
    from && to ? { from: new Date(from), to: new Date(to) } : undefined;

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value) {
          params.set(name, value);
        } else {
          params.delete(name);
        }
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSelectChange = (name: string) => (value: string) => {
    const params = { [name]: value === "all" ? null : value };
    router.push(pathname + "?" + createQueryString(params));
  };

  const handleDateChange = (range: DateRange | undefined) => {
    const params = {
      from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
    };
    router.push(pathname + "?" + createQueryString(params));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <Select value={gateway} onValueChange={handleSelectChange("gateway")}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Gateway" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Gateways</SelectItem>
          <SelectItem value="Stripe">Stripe</SelectItem>
          <SelectItem value="Razorpay">Razorpay</SelectItem>
          <SelectItem value="PayPal">PayPal</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={handleSelectChange("status")}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Success">Success</SelectItem>
          <SelectItem value="Failed">Failed</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={businessId}
        onValueChange={handleSelectChange("businessId")}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Business" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Businesses</SelectItem>
          {businesses.map((biz) => (
            <SelectItem key={biz.id} value={biz.id}>
              {biz.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal sm:w-[240px]",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
