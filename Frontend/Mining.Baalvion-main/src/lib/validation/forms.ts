/**
 * @fileOverview Shared Zod schemas for public form submissions.
 *
 * These schemas are the single source of truth for both the API route handlers
 * (server-side validation) and may be reused by client forms. They mirror the
 * fields rendered by the contact page and the PartnershipSurvey component.
 *
 * Each schema includes:
 *   - `source`           : optional client-supplied origin tag (e.g. "contact-page")
 *   - `company_website`  : optional honeypot. Real users never see/fill this; a
 *                          non-empty value flags an automated bot.
 */

import { z } from "zod";

/**
 * Honeypot field shared by all forms. Genuine users never see or fill this.
 * It is intentionally permissive at the schema level so a bot-filled value still
 * *passes* validation — the route handler then detects the non-empty value and
 * silently returns success without processing (revealing nothing to the bot).
 */
const honeypot = z.string().max(200).optional();

/** Optional free-form origin tag set by the client. */
const source = z.string().max(120).optional();

export const contactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid business email"),
  inquiryType: z.string().min(1, "Please select an inquiry type"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the privacy policy to submit" }),
  }),
  source,
  company_website: honeypot,
});

export type ContactInput = z.infer<typeof contactSchema>;

export const partnershipSchema = z.object({
  // Trade profile (required) — mirrors PartnershipSurvey selects.
  material: z.string().min(1, "Please select a material"),
  volume: z.string().min(1, "Please select monthly volume"),
  supply_type: z.string().min(1, "Please select supply type").optional(),
  challenges: z.array(z.string()).min(1, "Please select at least one challenge"),
  budget: z.string().min(1, "Please select a budget range").optional(),

  // Contact details (required).
  name: z.string().min(2, "Full name is required"),
  company: z.string().min(2, "Company name is required"),
  email: z.string().email("Invalid business email"),
  phone: z.string().min(5, "Valid phone number is required"),

  source,
  company_website: honeypot,
});

export type PartnershipInput = z.infer<typeof partnershipSchema>;
