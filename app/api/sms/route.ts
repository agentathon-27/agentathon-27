// POST /api/sms — Send SMS budget digest via Africa's Talking
import { NextRequest, NextResponse } from "next/server";

const AT_USERNAME = process.env.AT_USERNAME || "sandbox";
const AT_API_KEY = process.env.AT_API_KEY || "";
const AT_BASE_URL = AT_USERNAME === "sandbox"
  ? "https://api.sandbox.africastalking.com/version1/messaging"
  : "https://api.africastalking.com/version1/messaging";

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 });
    }

    // Validate Kenyan phone number
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!/^\+254\d{9}$/.test(cleanPhone) && !/^0\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Please enter a valid Kenyan phone number (+254XXXXXXXXX)" }, { status: 400 });
    }

    const formattedPhone = cleanPhone.startsWith("0")
      ? `+254${cleanPhone.slice(1)}`
      : cleanPhone;

    if (!AT_API_KEY) {
      // Demo mode — simulate SMS
      return NextResponse.json({
        success: true,
        demo: true,
        message: `[DEMO MODE] SMS would be sent to ${formattedPhone}: "${message.slice(0, 160)}"`,
        phone: formattedPhone,
        characterCount: message.length,
      });
    }

    // Send via Africa's Talking
    const formData = new URLSearchParams();
    formData.append("username", AT_USERNAME);
    formData.append("to", formattedPhone);
    formData.append("message", message.slice(0, 160));

    const response = await fetch(AT_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": AT_API_KEY,
        "Accept": "application/json",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      demo: false,
      result,
      phone: formattedPhone,
      characterCount: message.length,
    });
  } catch (error) {
    console.error("SMS error:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
