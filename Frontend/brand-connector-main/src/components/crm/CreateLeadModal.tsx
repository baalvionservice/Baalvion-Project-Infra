
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Building2, Mail, Instagram, Globe, Plus } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useToast } from '@/hooks/use-toast';
import { CREATOR_NICHES } from '@/constants';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const leadSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  niche: z.string().min(1, "Select a niche"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  instagramHandle: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
});

interface CreateLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLeadModal({ open, onOpenChange }: CreateLeadModalProps) {
  const { createLead } = useLeadStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      companyName: '',
      niche: 'Tech & Gadgets',
      email: '',
      instagramHandle: '',
      website: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof leadSchema>) => {
    setIsSubmitting(true);
    try {
      await createLead(values);
      toast({ title: "Lead Created", description: "The new brand has been added to your CRM." });
      form.reset();
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create lead." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-50 p-8 border-b">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Add New Lead</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">Add a high-potential brand to your acquisition funnel.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Company Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input placeholder="e.g. Lumina Tech" {...field} className="pl-10 rounded-xl h-11" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Primary Niche</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-11">
                            <SelectValue placeholder="Select Niche" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CREATOR_NICHES.slice(0, 10).map(n => (
                            <SelectItem key={n} value={n} className="font-bold">{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Work Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input placeholder="name@brand.com" {...field} className="pl-10 rounded-xl h-11" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instagramHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Instagram</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input placeholder="@handle" {...field} className="pl-10 rounded-xl h-11" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input placeholder="https://..." {...field} className="pl-10 rounded-xl h-11" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl shadow-primary/20">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create CRM Entry
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
