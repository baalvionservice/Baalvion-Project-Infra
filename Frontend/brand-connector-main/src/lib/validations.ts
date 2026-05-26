
import * as z from 'zod';

/**
 * @fileOverview Baalvion Centralized Validation Schemas
 * 
 * Provides unified Zod schemas for all marketplace forms.
 * Integrated with React Hook Form and used for client-side/logic validation.
 */

// --- AUTH SCHEMAS ---

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export const brandSignupSchema = z.object({
  // Step 1: Basics
  companyName: z.string().min(2, "Company name is required"),
  website: z.string().url("Enter a valid URL (e.g., https://acme.com)"),
  industry: z.string().min(1, "Select an industry"),
  teamSize: z.string().min(1, "Select team size"),
  // Step 2: Credentials
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Invalid phone number"),
  // Step 3: Plan
  plan: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]),
});

export const creatorSignupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  bio: z.string().max(160, "Bio must be under 160 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  socials: z.object({
    instagram: z.boolean().default(false),
    youtube: z.boolean().default(false),
    tiktok: z.boolean().default(false),
  }).refine(data => Object.values(data).some(v => v === true), {
    message: "Connect at least one social account"
  }),
  niches: z.array(z.string()).min(1, "Select at least one niche").max(5, "Max 5 niches"),
  rates: z.object({
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
  }),
});

// --- CAMPAIGN SCHEMAS ---

export const campaignBasicsSchema = z.object({
  title: z.string().min(10, "Title is too short").max(100, "Title is too long"),
  objective: z.string().min(1, "Objective is required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  contentType: z.enum(["REEL", "VIDEO", "POST"]),
  description: z.string().min(50, "Brief should be more detailed (min 50 chars)"),
});

export const creatorRequirementsSchema = z.object({
  creatorTier: z.enum(["NANO", "MICRO", "MID", "MACRO"]),
  minFollowers: z.number().min(0),
  maxFollowers: z.number().min(0),
  minEngagementRate: z.number().min(0).max(100),
  niches: z.array(z.string()).min(1, "Select at least one niche"),
  targetLocations: z.array(z.string()).min(1, "Select a location"),
  languages: z.array(z.string()).min(1, "Select a language"),
  audienceAgeMin: z.number().min(13),
  audienceAgeMax: z.number().max(100),
  audienceGender: z.enum(["ALL", "MALE", "FEMALE"]),
  minPosts: z.number().min(1),
  isExclusive: z.boolean(),
});

export const budgetTimelineSchema = z.object({
  totalBudget: z.number().min(500, "Minimum budget is ₹500"),
  budgetPerCreator: z.array(z.number()).length(2),
  paymentMethod: z.enum(["UPI", "CARD", "BANK"]),
  startDate: z.date(),
  endDate: z.date(),
  applicationDeadline: z.date(),
  submissionDeadline: z.date(),
  postLiveDate: z.date(),
});

export const guidelinesSchema = z.object({
  deliverables: z.array(z.object({
    type: z.string(),
    qty: z.number().min(1),
    platform: z.string(),
    specs: z.string().optional()
  })).min(1, "Add at least one deliverable"),
  dos: z.array(z.string()),
  donts: z.array(z.string()),
  hashtags: z.array(z.string()),
  handles: z.array(z.string()),
  links: z.array(z.string()),
  mandatoryMentions: z.string().optional()
});

// --- PROJECT FLOW SCHEMAS ---

export const applicationSchema = z.object({
  pitch: z.string().min(50, "Pitch should be persuasive (min 50 chars)").max(2000),
  proposedBudget: z.number().min(500, "Proposed rate must be at least ₹500"),
  proposedTimeline: z.string().min(1, "Required"),
});

export const payoutRequestSchema = z.object({
  amount: z.number().min(500, "Min withdrawal is ₹500"),
  method: z.enum(["upi", "bank", "payoneer"]),
  target: z.string().min(3, "Invalid account target"),
});

export const disputeSchema = z.object({
  category: z.enum(["UNFAIR_REJECTION", "PAYMENT_ISSUE", "SCOPE_CREEP", "OTHER"]),
  reason: z.string().min(100, "Provide more detail for the mediator (min 100 chars)"),
  proposedResolution: z.string().min(10, "State clearly what you want resolved"),
  evidenceUrls: z.array(z.string()).optional(),
});

// --- SETTINGS & OPS ---

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2, "Name too short"),
  phone: z.string().min(10, "Invalid phone number"),
  bio: z.string().max(500, "Bio too long"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export const teamInviteSchema = z.object({
  email: z.string().email("Invalid work email"),
  role: z.enum(["OWNER", "MANAGER", "REVIEWER", "VIEWER"]),
});
