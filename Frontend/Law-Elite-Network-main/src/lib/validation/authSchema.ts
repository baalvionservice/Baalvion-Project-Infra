import { z } from "zod";

/**
 * @fileOverview Zod validation schemas for professional authentication.
 */

export const loginSchema = z.object({
  email: z.string().email("Invalid professional email format."),
  password: z.string().min(6, "Security password must be at least 6 characters."),
});

export const signupSchema = z.object({
  fullName: z.string().min(3, "Professional name must be at least 3 characters."),
  email: z.string().email("Invalid professional email format."),
  password: z.string().min(6, "Security password must be at least 6 characters."),
});
