import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createProject,
  getProjects,
  isValidSlug,
  type ProjectDraft,
} from "@/lib/content";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projects = await getProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { slug?: string; draft?: ProjectDraft } = {};
  try {
    body = (await req.json()) as { slug?: string; draft?: ProjectDraft };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const draft = body.draft;
  if (!draft) {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }

  const slug = isValidSlug(body.slug ?? "")
    ? (body.slug as string)
    : slugify(draft.title ?? "");
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Could not derive a valid slug from the title" },
      { status: 400 },
    );
  }

  try {
    const project = await createProject(slug, draft);
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create project" },
      { status: 500 },
    );
  }
}
