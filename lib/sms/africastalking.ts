// Africa's Talking SMS delivery. Used by the DigestGenerator agent and the
// /api/sms route. Kept here (not inline in the route) per .agent/rules.md
// section 2.3 — SMS logic lives in lib/sms/.

const AT_USERNAME = process.env.AT_USERNAME || "sandbox";
const AT_API_KEY = process.env.AT_API_KEY || "";
const AT_BASE_URL = AT_USERNAME === "sandbox"
  ? "https://api.sandbox.africastalking.com/version1/messaging"
  : "https://api.africastalking.com/version1/messaging";

const AT_SHORTCODE = process.env.AT_SHORTCODE || "";

export interface SendSmsResult {
  success: boolean;
  demo: boolean;
  phone: string;
  characterCount: number;
  message: string;
  from?: string;
  raw?: unknown;
  error?: string;
}

/** Normalize KE phone numbers to +254 format. Throws on invalid input. */
export function normalizeKenyanPhone(input: string): string {
  const clean = input.replace(/\s+/g, "");
  if (!/^\+254\d{9}$/.test(clean) && !/^0\d{9}$/.test(clean)) {
    throw new Error("Please enter a valid Kenyan phone number (+254XXXXXXXXX or 07XXXXXXXX)");
  }
  return clean.startsWith("0") ? `+254${clean.slice(1)}` : clean;
}

export async function sendSms(rawPhone: string, message: string): Promise<SendSmsResult> {
  const phone = normalizeKenyanPhone(rawPhone);
  const trimmed = message.slice(0, 160);

  // Demo mode — no AT key configured. Useful for judges running without creds.
  if (!AT_API_KEY) {
    return {
      success: true,
      demo: true,
      phone,
      characterCount: message.length,
      message: `[DEMO] SMS would be sent to ${phone}: "${trimmed}"`,
      from: AT_SHORTCODE || undefined,
    };
  }

  const formData = new URLSearchParams();
  formData.append("username", AT_USERNAME);
  formData.append("to", phone);
  formData.append("message", trimmed);
  if (AT_SHORTCODE) {
    formData.append("from", AT_SHORTCODE);
  }

  const res = await fetch(AT_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey: AT_API_KEY,
      Accept: "application/json",
    },
    body: formData.toString(),
  });

  const raw = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      demo: false,
      phone,
      characterCount: message.length,
      message: trimmed,
      raw,
      error: `Africa's Talking returned ${res.status}`,
    };
  }

  return {
    success: true,
    demo: false,
    phone,
    characterCount: message.length,
    message: trimmed,
    raw,
  };
}
