// Zod schemas for API inputs. Per .agent/rules.md §3 every API input must be
// Zod-validated. Schemas live here and are re-used across routes.
import { z } from "zod";

export const queryRequestSchema = z.object({
  message: z.string().trim().min(1, "message is required").max(8000, "message too long"),
  sessionId: z.string().trim().min(1, "sessionId is required"),
  countyId: z.string().trim().optional(),
});
export type QueryRequest = z.infer<typeof queryRequestSchema>;

export const smsRequestSchema = z.object({
  phone: z.string().trim().min(7, "phone is required"),
  message: z.string().trim().min(1, "message is required").max(480, "SMS body too long"),
});
export type SmsRequest = z.infer<typeof smsRequestSchema>;

export const uploadMetadataSchema = z.object({
  sessionId: z.string().trim().min(1, "sessionId is required"),
});
export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const uploadedFileSchema = z
  .instanceof(File, { message: "file (multipart) is required" })
  .refine(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    { message: "Only PDF uploads are supported" },
  )
  .refine((f) => f.size <= MAX_UPLOAD_BYTES, {
    message: `File too large (max ${MAX_UPLOAD_BYTES / 1_000_000} MB)`,
  });

export const uploadResponseSchema = z.object({
  success: z.literal(true),
  file: z.object({
    name: z.string(),
    sizeBytes: z.number().int().nonnegative(),
    uri: z.string().min(1),
    chunks: z.number().int().nonnegative(),
  }),
  message: z.string(),
});
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

// External SDK shapes we parse defensively.
export const pdfParseResultSchema = z.object({
  text: z.string().default(""),
});

export const embeddingResponseSchema = z.object({
  embeddings: z.array(z.object({ values: z.array(z.number()) })),
});

export const ragRetrieveInputSchema = z.object({
  query: z.string().trim().min(1, "query is required"),
  k: z.number().int().positive().max(20).default(5),
});

/** Helper to normalize a Zod error into a single-line message for HTTP 400s. */
export function flattenZodError(err: z.ZodError): string {
  return err.errors.map((e) => `${e.path.join(".") || "body"}: ${e.message}`).join("; ");
}
