
'use client';

import { useState, useMemo, useEffect } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Github, UploadCloud, File, X, Loader2, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import type { Task, SubmissionContentType, SubmissionStatus } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useSubmissions } from '@/contexts/submissions-context';
import { useRouter } from 'next/navigation';

// --- Validation Constants ---
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const SUPPORTED_FILE_EXTENSIONS = ['.pdf', '.zip', '.docx', '.pptx', '.txt'];

const formSchema = z.object({
  submissionType: z.enum(['link', 'file', 'externalLink']),
  link: z.string().optional(),
  file: z.object({
    name: z.string(),
    size: z.number(),
  }).optional(),
  externalLink: z.string().optional(),
}).superRefine((data, ctx) => {
  // --- GitHub Link Validation ---
  if (data.submissionType === 'link') {
    if (!data.link || data.link.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['link'],
        message: 'A GitHub repository URL is required.',
      });
    } else {
        try {
            const url = new URL(data.link);
            if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['link'],
                    message: 'URL must be a valid GitHub repository link (e.g., https://github.com/...).',
                });
            } else if (url.pathname.split('/').filter(Boolean).length < 2) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['link'],
                    message: 'Please include both a username and repository in the URL (e.g., .../user/repo).',
                });
            }
        } catch (e) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['link'],
                message: 'Invalid URL format. Please enter a full, valid URL.',
            });
        }
    }
  }

  // --- File Upload Validation ---
  if (data.submissionType === 'file') {
    if (!data.file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['file'],
        message: 'A file is required for this submission type.',
      });
    } else {
      if (data.file.size > MAX_FILE_SIZE_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['file'],
          message: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`,
        });
      }
      const fileExtension = data.file.name.substring(data.file.name.lastIndexOf('.')).toLowerCase();
      if (!SUPPORTED_FILE_EXTENSIONS.includes(fileExtension)) {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['file'],
              message: `File type not supported. Supported types: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`,
          });
      }
    }
  }

  // --- External Link Validation ---
  if (data.submissionType === 'externalLink') {
    if (!data.externalLink || data.externalLink.trim() === '') {
        ctx.addIssue({
            code: 'custom',
            path: ['externalLink'],
            message: 'An external link is required.'
        });
    } else {
        try {
            const url = new URL(data.externalLink);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                ctx.addIssue({
                    code: 'custom',
                    path: ['externalLink'],
                    message: 'Invalid URL. Must start with http:// or https://.'
                });
            }
        } catch (e) {
            ctx.addIssue({
                code: 'custom',
                path: ['externalLink'],
                message: 'Please enter a valid URL format.'
            });
        }
    }
  }
});


interface SubmissionFormProps {
    task: Task;
}

export function SubmissionForm({ task }: SubmissionFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const { findSubmissionByTask, updateSubmission } = useSubmissions();

    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('link');

    const submission = useMemo(() => {
        if (!user) return undefined;
        return findSubmissionByTask(task.id, user.id);
    }, [task, user, findSubmissionByTask]);

    const currentRoundNumber = useMemo(() => submission?.currentRound || 1, [submission]);
    
    const isSubmissionAllowed = useMemo(() => {
        if (!user) return false;
        // If task is not private, anyone can submit. isPrivate defaults to false if undefined.
        if (task.isPrivate !== true) return true;
        // If task is private, user must be in the assignedTo array.
        return task.assignedTo?.includes(user.id) ?? false;
    }, [task, user]);


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            submissionType: 'link',
        },
        mode: 'onChange', // Validate on change for real-time feedback
    });

    const watchedForm = form.watch();
    useEffect(() => {
        if (submission && submission.status === 'assigned') {
            const hasInput = watchedForm.link || watchedForm.externalLink || watchedForm.file;
            if(hasInput) {
                updateSubmission(submission.id, { status: 'in-progress' });
            }
        }
    }, [watchedForm, submission, updateSubmission]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        form.setValue('submissionType', value as 'link' | 'file' | 'externalLink');
        form.clearErrors(); // Clear errors when switching tabs
        form.reset({ submissionType: value as 'link' | 'file' | 'externalLink' });
    }

    const handleFileSelect = (file: { name: string, size: number }) => {
        form.setValue('file', file, { shouldValidate: true });
    }

    const clearFile = () => {
        form.resetField('file');
    }

    const { submissionDisabled, buttonText, cardDescription } = useMemo(() => {
        if (!submission) {
            return {
                submissionDisabled: true,
                buttonText: 'Submit Work',
                cardDescription: 'This task has not been assigned to you.',
            };
        }
        
        if (!isSubmissionAllowed) {
             return {
                submissionDisabled: true,
                buttonText: 'Submission Not Allowed',
                cardDescription: 'This is a private task and you have not been assigned to it.',
            };
        }

        const isReviewing = ['pending', 'in-review'].includes(submission.status);
        const isCompleted = ['shortlisted'].includes(submission.status);
        const canResubmit = ['evaluated', 'rejected', 'resubmitted'].includes(submission.status);

        const descriptions: Record<SubmissionStatus, string> = {
            assigned: 'Once you have completed the task, submit your work here.',
            'in-progress': 'Once you have completed the task, submit your work here.',
            pending: 'Your submission is awaiting review. You cannot make changes at this time.',
            'in-review': 'Your submission is currently under review. You cannot make changes at this time.',
            evaluated: 'Your submission has been evaluated. You are welcome to resubmit.',
            shortlisted: 'Congratulations! Your submission was shortlisted. No further action is needed.',
            rejected: 'Your submission did not meet the requirements. You are welcome to resubmit.',
            resubmitted: 'Your latest submission is awaiting review. You may resubmit again if you wish.',
            flagged: 'This submission has been flagged for review. You cannot make changes at this time.',
            'moved-to-next-round': 'You have advanced! No action needed here.',
        };

        return {
            submissionDisabled: isReviewing || isCompleted,
            buttonText: canResubmit ? 'Resubmit Work' : 'Submit Work',
            cardDescription: descriptions[submission.status],
        };
    }, [submission, isSubmissionAllowed]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!submission) {
            toast({ title: 'Error', description: 'Could not find submission record for this task.', variant: 'destructive'});
            return;
        }

        setIsLoading(true);
        console.log('Submitting:', values);
        
        await new Promise(resolve => setTimeout(resolve, 1500));

        const isResubmission = ['evaluated', 'rejected', 'resubmitted'].includes(submission.status);
        
        let contentValue: string | undefined;
        if (values.submissionType === 'link') contentValue = values.link;
        if (values.submissionType === 'externalLink') contentValue = values.externalLink;
        if (values.submissionType === 'file') contentValue = `/mock-uploads/${values.file?.name}`;

        if (!contentValue) {
            toast({ title: 'Error', description: 'Submission content is missing.', variant: 'destructive'});
            setIsLoading(false);
            return;
        }
        
        const submissionUpdate: Partial<any> = {
            status: isResubmission ? 'resubmitted' : 'pending',
            content: {
                type: values.submissionType as SubmissionContentType,
                value: contentValue,
                ...(values.file && { fileName: values.file.name, fileSize: values.file.size }),
            },
            submittedAt: !isResubmission ? new Date().toISOString() : submission.submittedAt,
            ...(isResubmission && { resubmittedAt: new Date().toISOString() })
        };

        updateSubmission(submission.id, submissionUpdate);

        toast({
            title: isResubmission ? 'Resubmission Successful!' : 'Submission Successful!',
            description: `Your work for "${task.title}" has been submitted.`,
        });
        
        setIsLoading(false);
        router.push(`/candidate/submissions/${submission.id}`);
    }

    if (!isSubmissionAllowed) {
         return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Private Task</CardTitle>
                    <CardDescription>{cardDescription}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    if (!submission) {
         return (
            <Card>
                <CardHeader>
                    <CardTitle>Unable to Submit</CardTitle>
                    <CardDescription>{cardDescription}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>
                    {task.multiRound ? `Submit Your Work for Round ${currentRoundNumber}` : 'Submit Your Work'}
                </CardTitle>
                <CardDescription>
                    {cardDescription}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <fieldset disabled={submissionDisabled}>
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="link">
                                        <Github className="mr-2 h-4 w-4" />
                                        GitHub Repo
                                    </TabsTrigger>
                                    <TabsTrigger value="file">
                                        <UploadCloud className="mr-2 h-4 w-4" />
                                        Upload File
                                    </TabsTrigger>
                                    <TabsTrigger value="externalLink">
                                        <LinkIcon className="mr-2 h-4 w-4" />
                                        External Link
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="link" className="pt-4">
                                    <FormField
                                        control={form.control}
                                        name="link"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>GitHub Repository URL</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="https://github.com/your-username/your-repo" className="pl-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                 <FormDescription>
                                                    Enter the full URL of your public or private (if invited) GitHub repository.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                                <TabsContent value="file" className="pt-4">
                                    <FormField
                                        control={form.control}
                                        name="file"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Project File</FormLabel>
                                                {field.value ? (
                                                    <div className="flex items-center justify-between rounded-md border p-3">
                                                        <div className="flex items-center gap-3">
                                                            <File className="h-6 w-6 text-primary" />
                                                            <div>
                                                                <p className="text-sm font-medium">{field.value.name}</p>
                                                                <p className="text-xs text-muted-foreground">{(field.value.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={clearFile} type="button">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <FormControl>
                                                        <div 
                                                            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg"
                                                        >
                                                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                                            <p className="text-sm text-muted-foreground mt-2">
                                                                Simulate a file selection to test validation.
                                                            </p>
                                                             <div className="mt-4 flex flex-wrap justify-center gap-2">
                                                                <Button type="button" size="sm" variant="secondary" onClick={() => handleFileSelect({ name: 'my-project.zip', size: 1024 * 1024 * 2.5 })}>Select valid file</Button>
                                                                <Button type="button" size="sm" variant="secondary" onClick={() => handleFileSelect({ name: 'large-video.mp4', size: 1024 * 1024 * 60 })}>Select large file</Button>
                                                                <Button type="button" size="sm" variant="secondary" onClick={() => handleFileSelect({ name: 'script.sh', size: 1024 * 5 })}>Select invalid type</Button>
                                                            </div>
                                                        </div>
                                                    </FormControl>
                                                )}
                                                <FormDescription>
                                                   Supported types: PDF, ZIP, DOCX, PPTX. Max size: {MAX_FILE_SIZE_MB}MB.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                                <TabsContent value="externalLink" className="pt-4">
                                    <FormField
                                        control={form.control}
                                        name="externalLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>External Link</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="https://example.com/your-project" className="pl-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    Provide a shareable link to your work (e.g., Google Drive, portfolio, Figma).
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                            </Tabs>
                        </fieldset>
                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="ghost" onClick={() => form.reset({ submissionType: activeTab as 'link' | 'file' | 'externalLink' })} disabled={submissionDisabled}>Clear</Button>
                            <Button type="submit" disabled={isLoading || submissionDisabled || !form.formState.isValid}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    buttonText
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
       </Card>
    )
}
