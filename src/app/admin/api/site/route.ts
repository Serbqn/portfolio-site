import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSite, updateSite } from "@/lib/content";
import type { SiteContent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const site = await getSite();
  return NextResponse.json({ site });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { site?: SiteContent } = {};
  try {
    body = (await req.json()) as { site?: SiteContent };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.site) {
    return NextResponse.json({ error: "Missing site" }, { status: 400 });
  }
  try {
    const site = await updateSite(body.site);
    return NextResponse.json({ site });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update site" },
      { status: 500 },
    );
  }
}
