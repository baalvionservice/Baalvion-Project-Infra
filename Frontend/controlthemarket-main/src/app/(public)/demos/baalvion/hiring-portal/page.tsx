
import { getCompany, getTasks } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default async function BaalvionHiringPortal() {
  const companyId = 'company-3';
  const company = await getCompany(companyId);
  const allTasks = await getTasks();
  
  // Filter for Baalvion's specific backend tasks
  const baalvionTaskIds = [
    'task-17',
    'task-19',
    'task-20',
    'task-21',
    'task-22',
    'task-23',
  ];
  
  const portalTasks = allTasks
    .filter(task => baalvionTaskIds.includes(task.id))
    .sort((a, b) => baalvionTaskIds.indexOf(a.id) - baalvionTaskIds.indexOf(b.id));

  return (
    <div className="flex-1 bg-muted/20 pb-20">
      <div className="container py-12 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
            {company?.name || 'Baalvion Inc.'}
          </h1>
           <p className="mt-2 text-xl font-semibold text-primary">Senior Backend Engineer Virtual Job Simulation</p>
          <p className="mt-4 text-lg text-muted-foreground">
            Welcome. This is a multi-module assessment designed to simulate the real-world challenges you would face as a Senior Backend Engineer at Baalvion. Your mission is to build the core components of our next-generation investor relations platform.
          </p>
        </div>

        <div className="mt-12 mx-auto max-w-3xl space-y-8">
            <h2 className="text-2xl font-bold text-center">Project Modules</h2>
            {portalTasks.map((task, index) => (
                <Card key={task.id} className="relative overflow-hidden">
                    <CardHeader>
                        <div className="absolute left-0 top-0 h-full w-1.5 bg-primary" />
                        <p className="text-sm font-semibold text-primary">Module {index + 1}</p>
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild>
                            <Link href={`/candidate/tasks/${task.id}`}>
                                View Challenge <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            
            <Card className="border-green-500/50 bg-green-500/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600"/>
                        Completion
                    </CardTitle>
                    <CardDescription>
                        Upon successful completion of all modules, your profile will be fast-tracked for a final interview with our engineering leadership.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
      </div>
    </div>
  );
}
