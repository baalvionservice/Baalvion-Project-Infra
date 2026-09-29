import TaskBoard from './components/task-board';

export default function TasksPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
        <p className="text-muted-foreground">
          Coordinate and track tasks across all your businesses.
        </p>
      </div>

      <TaskBoard />
    </div>
  );
}