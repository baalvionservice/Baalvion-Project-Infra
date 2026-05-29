'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { dashboardApi } from '@/lib/api-client';
import { useEffect, useState } from 'react';

export default function AttendanceSummary() {
    const [overview, setOverview] = useState({ attendanceRate: 0, present: 0, late: 0, absent: 0 });
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const d = await dashboardApi.attendance();
                const rows = ((d as { data?: unknown[] })?.data ?? (Array.isArray(d) ? d : [])) as Record<string, unknown>[];
                const count = (st: string) => rows.filter((r) => String(r.status ?? '').toLowerCase() === st).length;
                const present = count('present'), late = count('late'), absent = count('absent');
                const total = rows.length;
                const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
                if (!cancelled) {
                    setOverview({ attendanceRate, present, late, absent });
                    setTimeout(() => { if (!cancelled) setProgress(attendanceRate); }, 150);
                }
            } catch { /* leave at zero */ }
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today&apos;s Attendance</CardTitle>
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
