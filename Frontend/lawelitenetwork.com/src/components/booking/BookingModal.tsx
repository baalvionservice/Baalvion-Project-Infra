'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { createAppointment } from '@/services/appointments/appointmentService';
import { getCasesByClient } from '@/services/cases/caseService';
import { getSlotsForDate, isSlotBooked } from '@/services/availability/availabilityService';
import { CalendarCheck, Loader2, ShieldCheck, Briefcase, Clock, AlertCircle } from 'lucide-react';

const bookingSchema = z.object({
  caseId: z.string().min(1, 'Please select a legal matter.'),
  date: z.string().min(1, 'Please select a date.'),
  time: z.string().min(1, 'Please select an available slot.'),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawyer: any;
  userId: string;
}

export default function BookingModal({ isOpen, onClose, lawyer, userId }: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{time: string, isBooked: boolean}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      caseId: '',
      date: '',
      time: '',
      notes: '',
    },
  });

  const selectedDate = form.watch("date");

  useEffect(() => {
    if (isOpen && userId) {
      const loadCases = async () => {
        try {
          const data = await getCasesByClient(userId);
          setCases(data || []);
        } catch (error) {
          console.error("Failed to load matters", error);
        }
      };
      loadCases();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (selectedDate && lawyer.id) {
      const loadSlots = async () => {
        setLoadingSlots(true);
        form.setValue("time", ""); // Reset time on date change
        try {
          const slots = await getSlotsForDate(lawyer.id, selectedDate);
          setAvailableSlots(slots);
        } catch (error) {
          console.error("Failed to load slots", error);
        } finally {
          setLoadingSlots(false);
        }
      };
      loadSlots();
    }
  }, [selectedDate, lawyer.id, form]);

  const onSubmit = async (values: BookingFormValues) => {
    setIsLoading(true);
    try {
      // Final availability check to prevent race conditions
      const stillAvailable = !(await isSlotBooked(lawyer.id, values.date, values.time));
      if (!stillAvailable) {
        throw new Error("This slot was just secured by another member. Please select another interval.");
      }

      const selectedCase = cases.find(c => (c.id === values.caseId || c.caseId === values.caseId));

      await createAppointment({
        ...values,
        clientId: userId,
        lawyerId: lawyer.id,
        lawyerName: lawyer.name,
        caseTitle: selectedCase?.title || 'Unknown Matter'
      });
      
      toast({
        title: 'Engagement Initialized',
        description: 'Your consultation session has been synchronized with the network.',
      });
      
      onClose();
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Booking Failure',
        description: error.message || 'Unable to schedule consultation.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/10 text-white max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-headline text-2xl italic text-white">Schedule Consultation</DialogTitle>
              <DialogDescription className="text-muted-foreground italic text-xs">Establish a secure professional engagement with {lawyer.name}.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="caseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-3 h-3" /> Target Legal Brief
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass-panel border-white/10 h-11 bg-white/5">
                        <SelectValue placeholder="Select a Briefing Matter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass-panel border-white/10 text-white bg-background/95">
                      {cases.length > 0 ? (
                        cases.map((c) => (
                          <SelectItem key={c.id || c.caseId} value={c.id || c.caseId} className="cursor-pointer">
                            {c.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No active legal briefs detected</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px] text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Calendar Date</FormLabel>
                  <FormControl>
                    <Input type="date" min={new Date().toISOString().split('T')[0]} className="glass-panel border-white/10 h-11 bg-white/5" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-400" />
                </FormItem>
              )}
            />

            {selectedDate && (
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Available Executive Slots
                    </FormLabel>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Syncing availability...
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            type="button"
                            disabled={slot.isBooked}
                            variant={field.value === slot.time ? "default" : "outline"}
                            onClick={() => field.onChange(slot.time)}
                            className={`text-[10px] font-bold uppercase tracking-widest h-9 rounded-xl border-white/5 transition-all ${
                              field.value === slot.time 
                                ? "bg-accent text-accent-foreground border-accent shadow-lg" 
                                : "hover:bg-white/5"
                            }`}
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-tight">No active slots defined for this day.</p>
                      </div>
                    )}
                    <FormMessage className="text-[10px] text-red-400" />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Consultation Briefing (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Specify objectives for the session..." 
                      className="glass-panel border-white/10 min-h-[80px] italic bg-white/5 text-sm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
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
                    SYNCHRONIZING...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    COMMIT CONSULTATION
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
