import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteProject,
  getProjectBySlug,
  isValidSlug,
  updateProject,
  type ProjectDraft,
} from "@/lib/content";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const project = await getProjectBySlug(slug);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  let body: { draft?: ProjectDraft } = {};
  try {
    body = (await req.json()) as { draft?: ProjectDraft };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.draft) {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }
  try {
    const project = await updateProject(slug, body.draft);
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  try {
    await deleteProject(slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete project" },
      { status: 500 },
    );
  }
}
