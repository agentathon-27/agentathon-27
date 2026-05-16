// Shared Gemini config for every agent in the system.
export const MODEL = process.env.VERTEX_AI_MODEL || "gemini-flash-latest";

// Ordered fallback chain used when the primary model returns 429 / quota.
// Override via GEMINI_FALLBACK_MODELS=foo,bar.
export const FALLBACK_MODELS: string[] = (
  process.env.GEMINI_FALLBACK_MODELS || "gemini-2.0-flash,gemini-1.5-flash"
)
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && s !== MODEL);

export function isQuotaError(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | null;
  if (!e) return false;
  if (e.status === 429) return true;
  const msg = e.message || "";
  return /429|quota|rate.?limit|exceeded/i.test(msg);
}

/**
 * Run `fn(model)` against MODEL first, falling through FALLBACK_MODELS on
 * quota/429 errors. Throws the last error if every model is exhausted.
 */
export async function withModelFallback<T>(fn: (model: string) => Promise<T>): Promise<T> {
  const candidates = [MODEL, ...FALLBACK_MODELS];
  let lastErr: unknown;
  for (const m of candidates) {
    try {
      return await fn(m);
    } catch (err) {
      lastErr = err;
      if (!isQuotaError(err)) throw err;
      console.warn(`[gemini] ${m} hit quota — falling back to next model.`);
    }
  }
  throw lastErr;
}

export function getApiKey(): string {
  const key =
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "";
  if (!key) {
    throw new Error(
      "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set. Add it to your .env file. " +
      "For Vertex AI production, swap this for service-account auth.",
    );
  }
  return key;
}
