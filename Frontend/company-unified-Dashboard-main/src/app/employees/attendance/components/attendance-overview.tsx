
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserCheck, Clock, UserX } from 'lucide-react';
import attendanceData from '@/lib/data/attendance.json';

const BusinessAttendanceItem = ({ biz }: { biz: (typeof attendanceData.businessAttendance)[0] }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate the progress bar on mount
    const timer = setTimeout(() => setProgress(biz.rate), 150);
    return () => clearTimeout(timer);
  }, [biz.rate]);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{biz.name}</span>
        <span className="font-semibold">{biz.rate}%</span>
      </div>
      <Progress value={progress} className="transition-all duration-1000 ease-in-out" />
    </div>
  );
};

export default function AttendanceOverview() {
  const { overview, businessAttendance } = attendanceData;

  const overviewCards = [
    { title: "Today's Attendance", value: `${overview.attendanceRate}%`, description: `${overview.present}/${overview.totalEmployees} employees`, icon: UserCheck },
    { title: "On Time", value: overview.onTime, description: "vs 33 Late", icon: Clock },
    { title: "Absent", value: overview.absent, description: "Today", icon: UserX },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Attendance Snapshot</CardTitle>
        <CardDescription>As of the current time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {overviewCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <h3 className="text-md font-medium mb-2">Attendance by Business</h3>
          <div className="space-y-4">
            {businessAttendance.map(biz => (
              <BusinessAttendanceItem key={biz.businessId} biz={biz} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
