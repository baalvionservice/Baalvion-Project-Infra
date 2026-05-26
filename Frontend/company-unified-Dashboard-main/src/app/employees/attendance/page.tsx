import AttendanceOverview from './components/attendance-overview';
import AttendanceTable from './components/attendance-table';
import ProductivityMetrics from './components/productivity-metrics';
import WeeklyCalendar from './components/weekly-calendar';

export default function AttendancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance & Productivity</h1>
        <p className="text-muted-foreground">
          Monitor employee attendance and productivity metrics across the organization.
        </p>
      </div>

      <AttendanceOverview />
      <ProductivityMetrics />
      <AttendanceTable />
      <WeeklyCalendar />

    </div>
  );
}
