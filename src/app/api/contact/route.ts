import { NextResponse, after } from "next/server";
import { sendNewMessageTelegram } from "@/lib/notify";
import { createServiceClient } from "@/lib/supabase";
import { verifyContactToken } from "@/lib/turnstile";

/**
 * Public contact form endpoint.
 * Only verified submissions can reach the service-role database client.
 * Migration 004 disables direct public access to the messages table.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { name, email, company, message, turnstileToken } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    company?: unknown;
    message?: unknown;
    turnstileToken?: unknown;
  };

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanMessage = message.trim();

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return NextResponse.json(
      { error: "That email address doesn’t look right." },
      { status: 400 },
    );
  }
  if (
    cleanName.length > 200 ||
    cleanEmail.length > 200 ||
    cleanMessage.length > 10000
  ) {
    return NextResponse.json(
      { error: "Message is too long." },
      { status: 400 },
    );
  }

  const cleanCompany =
    typeof company === "string" && company.trim()
      ? company.trim().slice(0, 200)
      : null;

  const verification = await verifyContactToken(turnstileToken);
  if (!verification.ok) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status },
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("messages").insert({
    name: cleanName,
    email: cleanEmail,
    company: cleanCompany,
    message: cleanMessage,
  });

  if (error) {
    console.error("contact insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }

  // Ping Telegram AFTER the response is sent so the visitor never waits on it
  // and a failing notification can't break the form.
  after(async () => {
    try {
      await sendNewMessageTelegram({
        name: cleanName,
        email: cleanEmail,
        company: cleanCompany,
        message: cleanMessage,
      });
    } catch (err) {
      console.error("new-message notification failed:", err);
    }
  });

  return NextResponse.json({ ok: true });
}
