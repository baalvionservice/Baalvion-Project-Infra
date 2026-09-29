import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export const createAccountSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long."),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  phoneNumber: z.string().optional(),
  country: z.string().min(2, "Country of residence is required."),
});

export const kycAmlSchema = z.object({
  document: z
    .any()
    .refine((file) => file, "An identification document is required.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .png and .pdf files are accepted."
    ),
});
