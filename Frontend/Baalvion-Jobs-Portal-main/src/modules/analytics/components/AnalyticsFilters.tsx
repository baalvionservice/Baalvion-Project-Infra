
'use client';

import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FilterX } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnalyticsFilters as IAnalyticsFilters } from '../domain/analytics.entity';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { talentService } from '@/services/talent.service';

interface AnalyticsFiltersProps {
    filters: IAnalyticsFilters;
    setFilters: React.Dispatch<React.SetStateAction<IAnalyticsFilters>>;
}

export function AnalyticsFilters({ filters, setFilters }: AnalyticsFiltersProps) {
    const [date, setDate] = useState<DateRange | undefined>(filters.dateRange as DateRange | undefined);
    // Real reference data from the backend (was mock countries/departments).
    const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    useEffect(() => {
        talentService.getCountries({ isActive: true }).then((c: any[]) => setCountries(c || [])).catch(() => {});
        talentService.getDepartments({ isActive: true }).then((d: any[]) => setDepartments(d || [])).catch(() => {});
    }, []);

    const handleApply = () => {
        setFilters(prev => ({ ...prev, dateRange: date }));
    };

    const handleReset = () => {
        setDate(undefined);
        setFilters({ dateRange: undefined, countries: [], departmentIds: [] });
    };

    const handleCountryChange = (value: string) => {
        setFilters(prev => ({ ...prev, countries: value === 'all' ? [] : [value] }));
    }

    const handleDepartmentChange = (value: string) => {
        setFilters(prev => ({ ...prev, departmentIds: value === 'all' ? [] : [value] }));
    }

    return (
        <div className="p-4 bg-card border rounded-lg flex flex-wrap items-center gap-4">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
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
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            <div className="w-full md:w-auto min-w-[200px]">
                <Select onValueChange={handleCountryChange} value={filters.countries?.[0] || 'all'}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by country..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {countries.map((c, i) => <SelectItem key={`${c.id}-${i}`} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full md:w-auto min-w-[200px]">
                <Select onValueChange={handleDepartmentChange} value={filters.departmentIds?.[0] || 'all'}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by department..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((d, i) => <SelectItem key={`${d.id}-${i}`} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-grow" />

            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleReset}><FilterX className="mr-2 h-4 w-4" /> Reset</Button>
                <Button onClick={handleApply}>Apply Filters</Button>
            </div>
        </div>
    );
}
