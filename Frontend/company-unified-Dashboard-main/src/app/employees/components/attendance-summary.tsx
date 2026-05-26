'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import attendanceData from '@/lib/data/attendance.json';
import { useEffect, useState } from 'react';

export default function AttendanceSummary() {
    const { overview } = attendanceData;
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(overview.attendanceRate), 150);
        return () => clearTimeout(timer);
    }, [overview.attendanceRate]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>Across all businesses</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-around">
                <div className="relative h-24 w-24">
                    <CircularProgress value={progress} strokeWidth={8} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{Math.round(overview.attendanceRate)}%</span>
                    </div>
                </div>
                 <div className="text-center">
                    <p className="text-2xl font-bold">{overview.present}</p>
                    <p className="text-sm text-muted-foreground">Present</p>
                </div>
                 <div className="text-center">
                    <p className="text-2xl font-bold">{overview.late}</p>
                    <p className="text-sm text-muted-foreground">Late</p>
                </div>
                 <div className="text-center">
                    <p className="text-2xl font-bold">{overview.absent}</p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                </div>
            </CardContent>
        </Card>
    );
}
