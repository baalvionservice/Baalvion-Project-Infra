
import { z } from 'zod';
import { employmentTypes, experienceBands, jobStatuses, workforceTypes } from '@/types/workflow.types';
import { Job } from '@/lib/talent-acquisition/types';

const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const jobCreationSchema = z.object({
  basicInfo: z.object({
    title: z.string().min(5, "Job title must be at least 5 characters."),
    internalCode: z.string().optional(),
    departmentId: z.string().min(1, "Department is required."),
    employmentType: z.enum(employmentTypes),
    workforceType: z.enum(workforceTypes),
    countryId: z.string().min(1, "Country is required."),
    // Free text, and optional: fully-remote roles legitimately have no town.
    city: z.string().optional(),
    region: z.string().optional(),
    slug: z.string().min(3, "Slug is required.").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
    summary: z.string().max(200, "Summary cannot exceed 200 characters.").optional(),
  }),

  roleDetails: z.object({
    description: z.string().min(50, "Description must be at least 50 characters."),
    responsibilities: z.array(z.object({ value: z.string().min(10, "Responsibility must be at least 10 characters.") })).min(1),
    requiredQualifications: z.array(z.object({ value: z.string().min(10, "Qualification must be at least 10 characters.") })).min(1),
    preferredQualifications: z.array(z.object({ value: z.string() })).optional(),
    experienceBand: z.enum(experienceBands),
    education: z.string().optional(),
  }),

  skills: z.object({
    required: z.array(skillSchema).min(1, "At least one required skill is necessary."),
    preferred: z.array(skillSchema).optional(),
  }),
  
  compensation: z.object({
    currency: z.string().min(3).max(3),
    minSalary: z.coerce.number().optional(),
    maxSalary: z.coerce.number().optional(),
    frequency: z.enum(['Annual', 'Monthly', 'Hourly']),
    bonus: z.string().optional(),
    equity: z.boolean(),
    visibility: z.enum(['Public', 'Range Only', 'Hidden']),
  }).refine(data => {
    if (data.minSalary && data.maxSalary) {
      return data.maxSalary >= data.minSalary;
    }
    return true;
  }, {
    message: "Max salary must be greater than or equal to min salary.",
    path: ["maxSalary"],
  }),
  
  compliance: z.object({
    workAuth: z.boolean(),
    visaSponsorship: z.boolean(),
    gdprConsent: z.boolean(),
    relocation: z.boolean(),
  }),

  workflow: z.object({
    status: z.enum(jobStatuses),
    publishDate: z.date().optional(),
    expiryDate: z.date().optional(),
    isFeatured: z.boolean(),
    isInternalOnly: z.boolean(),
    allowExternal: z.boolean(),
    hiringManagerId: z.string().optional(),
    approvalChain: z.array(z.string()).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  }).refine(data => {
    if (data.publishDate && data.expiryDate) {
      return data.expiryDate > data.publishDate;
    }
    return true;
  }, {
    message: "Expiration date must be after the publish date.",
    path: ["expiryDate"],
  })
});

export type JobCreationData = z.infer<typeof jobCreationSchema>;

const EMPLOYMENT_TYPE_TO_API: Record<string, string> = {
  'Full-time': 'full_time',
  'Part-time': 'part_time',
  'Contract': 'contract',
  'Internship': 'internship',
  'Temporary': 'contract',
};

const EXPERIENCE_BAND_TO_API: Record<string, string> = {
  'Intern': 'entry',
  'Entry': 'entry',
  'Mid': 'mid',
  'Senior': 'senior',
  'Lead': 'lead',
  'Principal': 'lead',
};

/**
 * Form shape → jobs-service payload.
 *
 * The backend takes snake_case and its own enum vocabulary; responsibilities and
 * qualifications have no columns of their own, so they're folded into the requirements
 * text rather than dropped on the floor.
 */
export const transformToApiPayload = (data: JobCreationData) => {
  const { basicInfo, roleDetails, compensation, workflow } = data;

  const requirements = [
    roleDetails.requiredQualifications.length
      ? `Requirements:\n${roleDetails.requiredQualifications.map(q => `• ${q.value}`).join('\n')}`
      : '',
    roleDetails.responsibilities.length
      ? `Responsibilities:\n${roleDetails.responsibilities.map(r => `• ${r.value}`).join('\n')}`
      : '',
    roleDetails.preferredQualifications?.filter(q => q.value).length
      ? `Nice to have:\n${roleDetails.preferredQualifications.filter(q => q.value).map(q => `• ${q.value}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n\n');

  return {
    title: basicInfo.title,
    description: roleDetails.description,
    requirements: requirements || undefined,
    country_id: basicInfo.countryId,
    department_id: basicInfo.departmentId,
    city: basicInfo.city || undefined,
    region: basicInfo.region || undefined,
    job_type: EMPLOYMENT_TYPE_TO_API[basicInfo.employmentType] ?? 'full_time',
    experience_level: EXPERIENCE_BAND_TO_API[roleDetails.experienceBand] ?? 'mid',
    currency: compensation.currency,
    salary_min: compensation.minSalary || undefined,
    salary_max: compensation.maxSalary || undefined,
    remote_allowed: basicInfo.workforceType === 'Remote' || basicInfo.workforceType === 'Hybrid',
    deadline: workflow.expiryDate ? workflow.expiryDate.toISOString().slice(0, 10) : undefined,
  };
};
