import { z } from "zod";

// =====================================================
// AUTHENTICATION VALIDATION SCHEMAS
// =====================================================

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
});

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .toLowerCase(),
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters")
    .optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

// =====================================================
// CONTENT VALIDATION SCHEMAS
// =====================================================

export const threadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10,000 characters"),
  categoryId: z.string().uuid("Invalid category"),
});

export const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10,000 characters"),
  threadId: z.string().uuid("Invalid thread"),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .toLowerCase()
    .optional(),
  fullName: z
    .string()
    .trim()
    .max(100, "Full name must be less than 100 characters")
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
});

// =====================================================
// CONTENT SAFETY CHECKS
// =====================================================

const MAX_URLS_ALLOWED = 5;
const MAX_CAPS_RATIO = 0.7;

/**
 * Check if content contains excessive URLs (potential spam)
 */
export function checkExcessiveUrls(text: string): boolean {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const matches = text.match(urlRegex);
  return (matches?.length || 0) <= MAX_URLS_ALLOWED;
}

/**
 * Check if content has excessive capitalization (potential spam)
 */
export function checkExcessiveCaps(text: string): boolean {
  if (text.length < 50) return true;
  
  const capsCount = (text.match(/[A-Z]/g) || []).length;
  const capsRatio = capsCount / text.length;
  
  return capsRatio <= MAX_CAPS_RATIO;
}

/**
 * Comprehensive content safety check
 */
export function validateContentSafety(text: string): {
  isValid: boolean;
  reason?: string;
} {
  if (!checkExcessiveUrls(text)) {
    return {
      isValid: false,
      reason: "Content contains too many URLs. Maximum 5 URLs allowed.",
    };
  }

  if (!checkExcessiveCaps(text)) {
    return {
      isValid: false,
      reason: "Content contains excessive capitalization.",
    };
  }

  return { isValid: true };
}

// =====================================================
// SANITIZATION HELPERS
// =====================================================

/**
 * Sanitize user input by removing potentially harmful characters
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove basic HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
