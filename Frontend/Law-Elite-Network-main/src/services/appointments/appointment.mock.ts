/**
 * @fileOverview Mock Appointment Implementation
 */

import { Appointment } from "@/types/appointment";

const STORAGE_KEY = "law_elite_appointments";

export const mockCreateAppointment = async (data: Omit<Appointment, "status" | "createdAt" | "id" | "appointmentId">) => {
  // Simulate network synchronization latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  const id = `mock_apt_${Date.now()}`;
  const newAppointment: Appointment = {
    ...data,
    id,
    appointmentId: id,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // Persist to local mock storage
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newAppointment]));

  return newAppointment;
};

export const mockGetAppointmentsByClient = async (userId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  return all.filter((a: Appointment) => a.clientId === userId);
};

export const mockCancelAppointment = async (appointmentId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const updated = all.map((a: Appointment) => 
    (a.id === appointmentId || a.appointmentId === appointmentId) 
      ? { ...a, status: "cancelled", updatedAt: new Date().toISOString() } 
      : a
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return { success: true };
};
