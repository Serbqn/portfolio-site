import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { isValidSlug } from "@/lib/content";
import { createServiceClient } from "@/lib/supabase";

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

  // Build a safe filename
  const original = (file.name || "image").toLowerCase();
  const ext = extensionForMime(file.type) || ".png";
  const stem = original
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 40);
  const filename = `${Date.now()}-${stem || "image"}${ext}`;

  // Upload to Supabase Storage under slug/ folder
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = await createServiceClient();
  const { error } = await supabase.storage
    .from("uploads")
    .upload(`${slug}/${filename}`, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error.message);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("uploads").getPublicUrl(`${slug}/${filename}`);

  return NextResponse.json({
    ok: true,
    url: publicUrl,
    size: buffer.length,
    type: file.type,
  });
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
