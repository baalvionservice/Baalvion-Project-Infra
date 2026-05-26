
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const initialTasks = [
  { id: 'create_account', text: 'Create your account', completed: true },
  { id: 'add_business', text: 'Add your first business', completed: false },
  { id: 'connect_gateway', text: 'Connect a payment gateway', completed: false },
  { id: 'invite_member', text: 'Invite a team member', completed: false },
  { id: 'set_alert', text: 'Set up your first KPI alert', completed: false },
  { id: 'generate_report', text: 'Generate your first report', completed: false },
];

export default function SetupChecklist() {
  const [tasks, setTasks] = useState(initialTasks);
  const { toast } = useToast();

  const handleActionClick = (taskId: string) => {
    toast({
      title: 'Navigating to setup...',
      description: 'This would take you to the relevant page to complete the task.',
    });
    // In a real app, you'd navigate. Here, we'll just mark it as complete for demo purposes.
    setTimeout(() => {
        setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: true } : task));
        if (taskId === 'add_business') {
            window.dispatchEvent(new CustomEvent('celebrate', { detail: { message: 'Your first business is live on Baalvion!' } }));
        }
    }, 1000);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Let's get you set up</CardTitle>
        <CardDescription>Your setup is {Math.round(progress)}% complete. Complete the steps below to get the most out of Baalvion.</CardDescription>
        <Progress value={progress} className="w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className={cn("flex items-center justify-between p-3 rounded-md", task.completed ? "bg-green-50 dark:bg-green-950" : "bg-muted/50")}>
              <div className="flex items-center gap-3">
                {task.completed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                <span className={cn("font-medium", task.completed && "text-muted-foreground line-through")}>{task.text}</span>
              </div>
              {!task.completed && (
                <Button size="sm" variant="outline" onClick={() => handleActionClick(task.id)}>
                  {task.text.split(' ')[0]}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
