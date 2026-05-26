
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createCase } from '@/services/cases/caseService';
import { Briefcase, Loader2, PlusCircle, ShieldCheck } from 'lucide-react';

const caseSchema = z.object({
  title: z.string().min(5, 'Brief title must be descriptive (min 5 chars).'),
  description: z.string().min(20, 'Provide sufficient context for counsel (min 20 chars).'),
  category: z.string().min(1, 'Please select a legal domain.'),
  priority: z.enum(['low', 'medium', 'high']),
});

type CaseFormValues = z.infer<typeof caseSchema>;

interface CreateCaseModalProps {
  userId: string;
  onSuccess?: () => void;
}

export default function CreateCaseModal({ userId, onSuccess }: CreateCaseModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (values: CaseFormValues) => {
    setIsLoading(true);
    try {
      await createCase(values, userId);
      
      toast({
        title: 'Brief Initialized',
        description: 'Your legal matter has been committed to the network dossier.',
      });
      
      setOpen(false);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Protocol Error',
        description: error.message || 'Unable to sync brief.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-6 font-bold shadow-lg shadow-accent/10">
          <PlusCircle className="w-4 h-4 mr-2" /> Initialize Legal Brief
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-white/10 text-white max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-headline text-2xl italic">New Legal Brief</DialogTitle>
              <DialogDescription className="text-muted-foreground italic">Establish parameters for executive counsel engagement.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Matter Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Intellectual Property Audit 2024" className="glass-panel border-white/10 h-11" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legal Domain</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-panel border-white/10 h-11">
                          <SelectValue placeholder="Select Domain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-panel border-white/10 text-white">
                        <SelectItem value="corporate">Corporate Law</SelectItem>
                        <SelectItem value="criminal">Criminal Defense</SelectItem>
                        <SelectItem value="family">Family Law</SelectItem>
                        <SelectItem value="civil">Civil Litigation</SelectItem>
                        <SelectItem value="ip">Intellectual Property</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Strategic Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-panel border-white/10 h-11">
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-panel border-white/10 text-white">
                        <SelectItem value="low">Standard</SelectItem>
                        <SelectItem value="medium">Elevated</SelectItem>
                        <SelectItem value="high">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Brief Context</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the legal challenge or objective..." 
                      className="glass-panel border-white/10 min-h-[120px] italic" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-400" />
                </FormItem>
              )}
            />

            <div className="pt-2 border-t border-white/5">
              <Button 
                type="submit" 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold rounded-xl shadow-lg shadow-accent/10 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    SYNCHRONIZING BRIEF...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    COMMIT TO NETWORK
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
