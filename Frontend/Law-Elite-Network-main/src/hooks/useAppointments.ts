'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAppointmentsByClient, cancelAppointment } from '@/services/appointments/appointmentService';
import { Appointment } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview useAppointments Hook
 * Synchronizes the member's consultation agenda from the network ledger.
 */
export function useAppointments(userId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAppointmentsByClient(userId);
      setAppointments(data);
    } catch (err: any) {
      console.error('Agenda sync error:', err);
      setError(err.message || 'Failed to sync professional agenda.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = async (appointmentId: string) => {
    if (!userId) return;

    try {
      await cancelAppointment(appointmentId, userId);
      toast({
        title: 'Engagement Terminated',
        description: 'The consultation has been removed from your active agenda.',
      });
      // Refresh list
      await fetchAppointments();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Termination Error',
        description: 'Unable to synchronize cancellation with the network.',
      });
    }
  };

  return { 
    appointments, 
    loading, 
    error, 
    refresh: fetchAppointments,
    cancel: handleCancel
  };
}
