// Zod schemas for API inputs. Per .agent/rules.md §3 every API input must be
// Zod-validated. Schemas live here and are re-used across routes.
import { z } from "zod";

export const queryRequestSchema = z.object({
  message: z.string().trim().min(1, "message is required").max(8000, "message too long"),
  sessionId: z.string().trim().min(1, "sessionId is required"),
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

/** Helper to normalize a Zod error into a single-line message for HTTP 400s. */
export function flattenZodError(err: z.ZodError): string {
  return err.errors.map((e) => `${e.path.join(".") || "body"}: ${e.message}`).join("; ");
}
