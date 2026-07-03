import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

const COOKIE_NAME = "serb_admin";

export function passwordConfigured(): boolean {
  // With Supabase Auth, we don't use ADMIN_PASSWORD env var.
  // Auth is handled by Supabase. This is kept for backward compat.
  return true;
}

export function checkPassword(_submitted: string): boolean {
  // Not used with Supabase Auth. Kept for backward compat.
  return false;
}

export async function createSessionToken(): Promise<string> {
  // Not used with Supabase Auth. Kept for backward compat.
  return "";
}

export async function verifySessionToken(
  _token: string,
): Promise<{ sub: string; role: string } | null> {
  // Not used with Supabase Auth. Kept for backward compat.
  return null;
}

export async function setSessionCookie(_token: string): Promise<void> {
  // Not used with Supabase Auth. Kept for backward compat.
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<{
  sub: string;
  role: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return { sub: session.user.id, role: "owner" };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
