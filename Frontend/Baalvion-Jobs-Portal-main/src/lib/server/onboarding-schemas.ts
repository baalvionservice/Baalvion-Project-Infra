/**
 * Zod schemas + types shared by the public onboarding forms, the API route
 * handlers, and the admin review queue. Pure data — safe to import from both
 * client and server. (Persistence lives in `onboarding-store.ts`, server-only.)
 */
import { z } from 'zod';

export const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const COLLEGE_TIERS = ['1', '2', '3', 'unsure'] as const;

// ─── College onboarding ──────────────────────────────────────────────────────
export const collegeApplicationSchema = z.object({
  institutionName: z.string().min(2, 'Enter the institution name.').max(160),
  institutionType: z
    .enum(['university', 'engineering', 'management', 'arts_science', 'polytechnic', 'other'])
    .default('other'),
  accreditation: z.string().max(120).optional().or(z.literal('')),
  tier: z.enum(COLLEGE_TIERS).default('unsure'),
  website: z
    .string()
    .url('Enter a valid URL (including https://).')
    .max(200)
    .optional()
    .or(z.literal('')),
  city: z.string().min(2, 'Enter your city.').max(80),
  state: z.string().min(2, 'Enter your state / region.').max(80),
  country: z.string().min(2, 'Enter your country.').max(80).default('India'),
  studentCount: z.coerce.number().int().min(0).max(1_000_000).optional(),
  // Placement-cell contact
  contactName: z.string().min(2, 'Enter the contact person’s name.').max(120),
  contactRole: z.string().max(120).optional().or(z.literal('')),
  contactEmail: z.string().email('Enter a valid work email.').max(160),
  contactPhone: z.string().min(6, 'Enter a valid phone number.').max(30),
  message: z.string().max(2000).optional().or(z.literal('')),
  agreeToVerification: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm the details are accurate.' }),
  }),
});

export type CollegeApplicationInput = z.infer<typeof collegeApplicationSchema>;

export interface CollegeApplication extends CollegeApplicationInput {
  id: string;
  referenceId: string;
  status: ApplicationStatus;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Student onboarding ──────────────────────────────────────────────────────
export const studentApplicationSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name.').max(120),
  email: z.string().email('Enter a valid email address.').max(160),
  phone: z.string().min(6, 'Enter a valid phone number.').max(30),
  collegeName: z.string().min(2, 'Enter your college / university name.').max(160),
  course: z.string().min(2, 'Enter your course / degree.').max(120),
  branch: z.string().max(120).optional().or(z.literal('')),
  graduationYear: z.coerce
    .number()
    .int()
    .min(2000, 'Enter a valid graduation year.')
    .max(2035, 'Enter a valid graduation year.'),
  cgpa: z.string().max(20).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  skills: z.string().max(500).optional().or(z.literal('')),
  // Optional links — students may not have them yet.
  portfolioUrl: z
    .string()
    .url('Enter a valid URL (including https://).')
    .max(200)
    .optional()
    .or(z.literal('')),
  resumeUrl: z
    .string()
    .url('Enter a valid URL (including https://).')
    .max(200)
    .optional()
    .or(z.literal('')),
  interest: z
    .enum(['internship', 'full_time', 'both'])
    .default('both'),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to continue.' }),
  }),
});

export type StudentApplicationInput = z.infer<typeof studentApplicationSchema>;

export interface StudentApplication extends StudentApplicationInput {
  id: string;
  referenceId: string;
  status: ApplicationStatus;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Admin status-update payload
export const statusUpdateSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  reviewNotes: z.string().max(2000).optional(),
});
