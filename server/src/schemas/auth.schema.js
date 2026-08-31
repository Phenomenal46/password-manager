import { z } from "zod";

/*
 * Signup request validation.
 */
export const signupSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password is too long"),
});


/*
 * Login request validation.
 */
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(1, "Password is required")
        .max(128, "Password is too long"),
});