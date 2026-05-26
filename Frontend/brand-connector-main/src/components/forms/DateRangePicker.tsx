'use client';

import React from 'react';
import { format, subDays, addDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const presets = [
    { label: 'Next 7 Days', range: { from: new Date(), to: addDays(new Date(), 7) } },
    { label: 'Next 30 Days', range: { from: new Date(), to: addDays(new Date(), 30) } },
    { label: 'Full Quarter', range: { from: new Date(), to: addDays(new Date(), 90) } },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-between h-12 rounded-xl text-left font-bold bg-slate-50/50 border-slate-200",
              !value && "text-muted-foreground"
            )}
          >
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              {value?.from ? (
                value.to ? (
                  <>
                    {format(value.from, "LLL dd, y")} -{" "}
                    {format(value.to, "LLL dd, y")}
                  </>
                ) : (
                  format(value.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-[2rem] border-none shadow-2xl overflow-hidden" align="start">
          <div className="flex flex-col md:flex-row">
            <div className="p-4 bg-slate-50/50 border-r w-full md:w-48 space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Quick Presets</p>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="w-full justify-start text-xs font-bold hover:bg-white rounded-lg h-9"
                  onClick={() => onChange(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
