import { NextResponse, after } from "next/server";
import { sendNewMessageTelegram } from "@/lib/notify";
import { createClient } from "@/lib/supabase";

/**
 * Public contact form endpoint.
 * Inserts a message into the `messages` table via the anon client —
 * RLS allows inserts, only service_role can read/delete.
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

  const { name, email, company, message } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    company?: unknown;
    message?: unknown;
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

  const supabase = await createClient();
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