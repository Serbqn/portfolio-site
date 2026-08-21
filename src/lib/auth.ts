import { createClient } from "@/lib/supabase";

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
