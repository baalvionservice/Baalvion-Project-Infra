import DepartmentsTable from './components/departments-table';

export default function DepartmentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground">
          Explore and manage departments across your organization.
        </p>
      </div>

      <DepartmentsTable />
    </div>
  );
}