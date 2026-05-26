/**
 * @fileOverview Core Lawyer Type definitions for the Law Elite Network.
 */

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  experience: number; // years
  consultationFee: number;
  currency: string;
  bio?: string;
  available: boolean;
  avatar?: string;
  rating?: number;
  totalConsultations?: number;
}
