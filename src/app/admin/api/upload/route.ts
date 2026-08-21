import { NextResponse, type NextRequest } from "next/server";
import { put, del } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { isValidSlug } from "@/lib/content";

export const dynamic = "force-dynamic";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB per file
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/avif",
]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const slug = String(form.get("slug") || "").trim();
  const file = form.get("file");

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large (max ${Math.round(MAX_SIZE / 1024 / 1024)} MB)` },
      { status: 413 },
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}` },
      { status: 415 },
    );
  }

  // Build a safe filename with slug prefix for organization
  const original = (file.name || "image").toLowerCase();
  const ext = extensionForMime(file.type) || ".png";
  const stem = original
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 40);
  const pathname = `${slug}/${Date.now()}-${stem || "image"}${ext}`;

  // Upload to Vercel Blob (public store)
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({
    ok: true,
    url: blob.url,
    type: file.type,
  });
}

/**
 * Delete an uploaded image from Vercel Blob.
 * Only accepts URLs that belong to the project's Blob store.
 */
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { url } = (body ?? {}) as { url?: unknown };
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Safety: only allow deleting from the project's own Blob store.
  if (!url.includes(".public.blob.vercel-storage.com")) {
    return NextResponse.json(
      { error: "Refusing to delete a non-Blob URL" },
      { status: 400 },
    );
  }

  try {
    await del(url);
  } catch (e) {
    console.error("blob delete failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Could not delete image. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    default:
      return ".png";
  }
}
