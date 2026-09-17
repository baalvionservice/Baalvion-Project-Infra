import { CreateTaskForm } from './create-task-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CreateTaskPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Create a New Task
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>
            Fill out the form below to design a new skill assessment for candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTaskForm />
        </CardContent>
      </Card>
    </div>
  );
}
