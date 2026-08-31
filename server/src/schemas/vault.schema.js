import { z } from "zod";

/*
 * Schema for creating or updating a vault item.
 *
 * The frontend sends encrypted data and an IV.
 * We validate both before the request reaches the controller.
 */
export const vaultItemSchema = z.object({
    encryptedData: z
        .string({
            error: "Encrypted data required",
        })
        .min(1, "Encrypted data required")
        .max(100_000, "encryptedData is too large"),

    iv: z
        .string({
            error: "IV required",
        })
        .min(1, "IV required")
        .max(1_000, "iv is too large"),
});


/*
 * Query parameters used by cursor pagination.
 */
export const vaultQuerySchema = z.object({
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(50),

    cursor: z
        .string()
        .regex(
            /^[a-f\d]{24}$/i,
            "Invalid cursor"
        )
        .optional(),
});