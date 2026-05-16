// Shared Gemini config for every agent in the system.
export const MODEL = process.env.VERTEX_AI_MODEL || "gemini-flash-latest";

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
