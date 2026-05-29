'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAttendanceSummary } from '@/hooks/use-attendance-summary';
import { useDashboardRefs } from '@/hooks/use-dashboard-refs';

type Status = 'Present' | 'Late' | 'Absent' | 'Remote' | 'Holiday';

const statusColors: Record<Status, string> = {
  Present: 'bg-green-500',
  Late: 'bg-yellow-400',
  Absent: 'bg-red-500',
  Remote: 'bg-blue-500',
  Holiday: 'bg-gray-300',
};

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function WeeklyCalendar() {
  const [showAll, setShowAll] = useState(false);
  const { weeklyCalendar } = useAttendanceSummary();
  const { employees } = useDashboardRefs();
  const displayData = showAll ? weeklyCalendar : weeklyCalendar.slice(0, 5);

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Weekly Attendance Calendar</CardTitle>
                <CardDescription>Visual overview of employee attendance for the current week.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Show Fewer' : 'Show All Employees'}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
            <div className="rounded-md border p-4">
                <div className="grid grid-cols-6 gap-2">
                    <div />
                    {days.map(day => <div key={day} className="font-bold text-center text-sm">{day}</div>)}
                </div>
                <div className="mt-2 space-y-2">
                     {displayData.map(emp => (
                        <div key={emp.employeeId} className="grid grid-cols-6 gap-2 items-center">
                            <div className="text-sm font-medium truncate pr-2 text-right">{getEmployeeName(emp.employeeId)}</div>
                            {emp.week.map((status, dayIndex) => (
                                <Tooltip key={dayIndex}>
                                    <TooltipTrigger asChild>
                                        <div className="flex justify-center">
                                            <div className={cn("h-6 w-6 rounded-full", statusColors[status as Status])} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{status}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
