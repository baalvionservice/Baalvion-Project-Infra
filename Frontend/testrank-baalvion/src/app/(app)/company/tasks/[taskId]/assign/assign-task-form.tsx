
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { User, Task } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSubmissions } from '@/contexts/submissions-context';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, UserPlus } from 'lucide-react';
import { assignTask } from '@/lib/write-api';

const formSchema = z.object({
  candidateIds: z.array(z.string()).optional(),
});

interface AssignTaskFormProps {
  candidates: User[];
  task: Task;
  assignedCandidateIds: string[];
}

export function AssignTaskForm({ candidates, task, assignedCandidateIds }: AssignTaskFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { assignTaskToUser, findSubmissionByTask } = useSubmissions();
  
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateIds: assignedCandidateIds,
    },
  });
  
  const handleAddEmail = () => {
    if (currentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail) && !manualEmails.includes(currentEmail)) {
        setManualEmails(prev => [...prev, currentEmail]);
        setCurrentEmail('');
    } else {
        toast({
            title: 'Invalid or duplicate email',
            description: 'Please enter a valid, unique email address.',
            variant: 'destructive',
        });
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setManualEmails(prev => prev.filter(email => email !== emailToRemove));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedCandidateIds = values.candidateIds || [];
    
    if (selectedCandidateIds.length === 0 && manualEmails.length === 0) {
        toast({
            title: 'No Candidates Selected',
            description: 'Please select at least one candidate from the list or add an email to send an invitation.',
            variant: 'destructive',
        });
        return;
    }

    const newAssignments = selectedCandidateIds.filter(
        id => !findSubmissionByTask(task.id, id)
    );

    for (const candidateId of newAssignments) {
        await assignTaskToUser({
            taskId: task.id,
            userId: candidateId,
        });
    }
    
    let message = '';
    if (newAssignments.length > 0) {
        message += `Assigned task to ${newAssignments.length} existing candidate(s). `;
    }
    if (manualEmails.length > 0) {
        message += `Sent invitations to ${manualEmails.length} new candidate(s).`;
        console.log('Inviting new users:', manualEmails);
    }
    
    if (!message) {
        message = 'All selected candidates were already assigned this task.';
    }

    toast({
        title: 'Assignments Processed',
        description: message.trim(),
    });
    
    router.push('/company/tasks');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section for existing candidates */}
          <div className="space-y-4">
             <h3 className="text-lg font-medium">Assign to Existing Candidates</h3>
            <FormField
              control={form.control}
              name="candidateIds"
              render={() => (
                <FormItem>
                  <ScrollArea className="h-72 w-full rounded-md border">
                    <div className="p-4 space-y-3">
                      {candidates.map((candidate) => (
                        <FormField
                          key={candidate.id}
                          control={form.control}
                          name="candidateIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={candidate.id}
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:bg-accent/50"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(candidate.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), candidate.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== candidate.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    {candidate.name}
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    {candidate.email}
                                  </p>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section for inviting new candidates */}
          <div className="space-y-4">
             <h3 className="text-lg font-medium">Invite by Email</h3>
             <div className="flex items-center gap-2">
                <Input 
                    type="email" 
                    placeholder="candidate@example.com"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                />
                <Button type="button" onClick={handleAddEmail} variant="outline">
                   Add
                </Button>
            </div>
            <div className="space-y-2">
                <FormLabel>Pending Invitations</FormLabel>
                <div className="rounded-md border min-h-[5rem] p-3 space-y-2">
                     {manualEmails.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {manualEmails.map(email => (
                                <Badge key={email} variant="secondary" className="text-base p-2">
                                    {email}
                                    <button type="button" onClick={() => handleRemoveEmail(email)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground p-2">No new candidates invited yet.</p>
                    )}
                </div>
            </div>
          </div>
        </div>
        
        <Separator />

        <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">
                <UserPlus className="mr-2 h-4 w-4" />
                Assign & Invite
            </Button>
        </div>
      </form>
    </Form>
  );
}
