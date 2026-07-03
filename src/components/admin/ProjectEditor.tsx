"use client";

import { useEffect, useState } from "react";
import { slugify } from "@/lib/utils";

export type ProjectDraftWithSections = {
  title: string;
  subtitle: string;
  role: string;
  year: string;
  client: string;
  tags: string[];
  featured: boolean;
  cover: string;
  summary: string;
  metrics: { label: string; value: string }[];
  gallery: string[];
  problem: string;
  process: string;
  solution: string;
  results: string;
};

type Status = "idle" | "loading" | "saving" | "saved" | "error";

export function ProjectEditor({
  initial,
  slug: initialSlug,
  allSlugs,
  isNew,
  onSaved,
}: {
  initial?: ProjectDraftWithSections;
  slug: string;
  allSlugs: string[];
  isNew: boolean;
  onSaved: () => Promise<void> | void;
}) {
  const [draft, setDraft] = useState<ProjectDraftWithSections>(
    initial ?? {
      title: "",
      subtitle: "",
      role: "",
      year: "",
      client: "",
      tags: [],
      featured: false,
      cover: "",
      summary: "",
      metrics: [],
      gallery: [],
      problem: "",
      process: "",
      solution: "",
      results: "",
    },
  );
  const [slug, setSlug] = useState<string>(initialSlug);
  const [slugTouched, setSlugTouched] = useState<boolean>(!isNew);
  const [status, setStatus] = useState<Status>(initial && isNew ? "idle" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tagsRaw, setTagsRaw] = useState<string>(
    initial?.tags?.join(", ") ?? "",
  );

  useEffect(() => {
    if (!isNew) {
      // Load full project (with sections) from server
      setStatus("loading");
      setError(null);
      void fetch(`/admin/api/projects/${initialSlug}`)
        .then((r) => r.json())
        .then((data: { project?: ProjectDraftWithSections & { slug: string } }) => {
          if (!data.project) {
            setError("Project not found");
            setStatus("error");
            return;
          }
          const { slug: _, ...rest } = data.project;
          setDraft(rest as ProjectDraftWithSections);
          setSlug(initialSlug);
          setStatus("idle");
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Load failed");
          setStatus("error");
        });
    }
  }, [initialSlug, isNew]);

  function setField<K extends keyof ProjectDraftWithSections>(
    key: K,
    value: ProjectDraftWithSections[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === "title" && isNew && !slugTouched) {
      setSlug(slugify(String(value)));
    }
  }

  function setMetric(i: number, k: "label" | "value", v: string) {
    setDraft((d) => {
      const metrics = [...d.metrics];
      metrics[i] = { ...metrics[i], [k]: v };
      return { ...d, metrics };
    });
  }

  function addMetric() {
    setDraft((d) => ({ ...d, metrics: [...d.metrics, { label: "", value: "" }] }));
  }
  function removeMetric(i: number) {
    setDraft((d) => ({ ...d, metrics: d.metrics.filter((_, idx) => idx !== i) }));
  }

  async function handleUpload(file: File, target: "cover" | "gallery" = "cover") {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.set("slug", slug || "draft");
      fd.set("file", file);
      const res = await fetch("/admin/api/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }
      if (target === "cover") {
        setField("cover", data.url);
      } else {
        setDraft((d) => ({
          ...d,
          gallery: [...d.gallery, data.url as string],
        }));
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      // Sequential to keep order predictable.
      // eslint-disable-next-line no-await-in-loop
      await handleUpload(files[i], "gallery");
    }
  }

  function removeGalleryItem(i: number) {
    setDraft((d) => ({
      ...d,
      gallery: d.gallery.filter((_, idx) => idx !== i),
    }));
  }

  function moveGalleryItem(i: number, dir: -1 | 1) {
    setDraft((d) => {
      const next = [...d.gallery];
      const j = i + dir;
      if (j < 0 || j >= next.length) return d;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...d, gallery: next };
    });
  }

  function setGalleryCover(i: number) {
    setDraft((d) => {
      if (i < 0 || i >= d.gallery.length) return d;
      const next = [...d.gallery];
      const [moved] = next.splice(i, 1);
      next.unshift(moved);
      return { ...d, gallery: next, cover: moved };
    });
  }

  async function handleSave() {
    setError(null);
    setStatus("saving");
    try {
      const url = isNew
        ? "/admin/api/projects"
        : `/admin/api/projects/${slug}`;
      const method = isNew ? "POST" : "PUT";
      const body = isNew
        ? { slug, draft }
        : { draft };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Save failed");
      }
      setStatus("saved");
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      {status === "loading" ? (
        <p className="text-sm text-surface-500">Loading…</p>
      ) : null}

      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Title">
            <input
              id="title"
              type="text"
              value={draft.title}
              onChange={(e) => setField("title", e.target.value)}
              className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
          </Field>
          <Field id="slug" label="Slug">
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 font-mono text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
            {allSlugs.includes(slug) && isNew ? (
              <p className="mt-1.5 text-xs text-amber-700">
                A project with this slug already exists — saving will overwrite.
              </p>
            ) : null}
          </Field>
          <Field id="subtitle" label="Subtitle" className="sm:col-span-2">
            <input
              id="subtitle"
              type="text"
              value={draft.subtitle}
              onChange={(e) => setField("subtitle", e.target.value)}
              className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
          </Field>
          <Field id="role" label="Role">
            <input
              id="role"
              type="text"
              value={draft.role}
              onChange={(e) => setField("role", e.target.value)}
              className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
          </Field>
          <Field id="year" label="Year">
            <input
              id="year"
              type="text"
              value={draft.year}
              onChange={(e) => setField("year", e.target.value)}
              className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
          </Field>
          <Field id="client" label="Client">
            <input
              id="client"
              type="text"
              value={draft.client}
              onChange={(e) => setField("client", e.target.value)}
              className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
          </Field>
          <Field id="tags" label="Tags (comma separated)">
            <input
              id="tags"
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              onBlur={() => {
                setField(
                  "tags",
                  tagsRaw
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                );
              }}
              className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
          </Field>
          <Field id="featured" label="Featured?">
            <label className="flex h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setField("featured", e.target.checked)}
                className="h-4 w-4 rounded border-surface-300 text-accent-500 focus:ring-accent-500"
              />
              Show on home page
            </label>
          </Field>
          <Field id="summary" label="Summary (one sentence)" className="sm:col-span-2">
            <textarea
              id="summary"
              rows={2}
              value={draft.summary}
              onChange={(e) => setField("summary", e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Cover image"
        description="Upload a JPG, PNG, WebP, or SVG. Max 8 MB."
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <Field id="cover" label="Cover URL or path">
              <input
                id="cover"
                type="text"
                value={draft.cover}
                onChange={(e) => setField("cover", e.target.value)}
                placeholder="/uploads/your-slug/cover.svg"
                className="h-10 w-full rounded-lg border border-surface-300 bg-white px-3 font-mono text-xs outline-none focus:border-accent-500 focus:shadow-ring-accent"
              />
            </Field>
            <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-surface-200 bg-white px-3 text-sm font-medium text-surface-900 transition-colors hover:bg-surface-50">
              {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/avif"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />
            </label>
            {uploadError ? (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            ) : null}
          </div>
          {draft.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.cover}
              alt=""
              className="h-32 w-48 rounded-lg border border-surface-200 object-cover"
            />
          ) : null}
        </div>
      </Section>

      <Section
        title="Gallery"
        description="Upload multiple images (JPG, PNG, WebP, SVG). Drag to reorder. First image becomes cover if no cover set."
      >
        <div className="space-y-4">
          {/* Upload zone */}
          <label className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-300 bg-surface-50 p-8 transition-all duration-150 hover:border-accent-500 hover:bg-accent-50 cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/avif"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const files = e.target.files;
                if (files) void handleGalleryUpload(files);
              }}
            />
            <div className="flex flex-col items-center gap-2">
              <svg
                className="h-10 w-10 text-surface-300 group-hover:text-accent-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="font-mono text-xs uppercase tracking-widest text-surface-500">
                {uploading ? "Uploading…" : "Drop images here or click to select"}
              </span>
              <span className="text-xs text-surface-400">
                Max 8 MB each · JPG, PNG, WebP, SVG, GIF, AVIF
              </span>
            </div>
            {uploadError ? (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            ) : null}
          </label>

          {/* Gallery grid */}
          {draft.gallery.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {draft.gallery.map((img, i) => (
                <div
                  key={img}
                  className="relative group rounded-lg border border-surface-200 bg-white overflow-hidden"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={img}
                      alt={`Gallery ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => setGalleryCover(i)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-surface-900 hover:bg-white"
                      title="Set as cover"
                    >
                      Set cover
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(i, -1)}
                      disabled={i === 0}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-surface-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(i, 1)}
                      disabled={i === draft.gallery.length - 1}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-surface-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(i)}
                      className="rounded-md bg-red-500/90 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  {i === 0 && draft.cover === img ? (
                    <span className="absolute top-2 left-2 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      Cover
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-surface-500 py-4">
              No gallery images yet. Drop some above.
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Metrics"
        description="Up to 6 short numbers shown on the case-study page."
      >
        <div className="space-y-2">
          {draft.metrics.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                type="text"
                placeholder="Label"
                value={m.label}
                onChange={(e) => setMetric(i, "label", e.target.value)}
                className="h-9 rounded-md border border-surface-300 bg-white px-3 text-sm outline-none focus:border-accent-500"
              />
              <input
                type="text"
                placeholder="Value (e.g. 90s → 4s)"
                value={m.value}
                onChange={(e) => setMetric(i, "value", e.target.value)}
                className="h-9 rounded-md border border-surface-300 bg-white px-3 text-sm outline-none focus:border-accent-500"
              />
              <button
                type="button"
                onClick={() => removeMetric(i)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-surface-200 bg-white px-2.5 text-xs text-surface-600 hover:text-red-600"
                aria-label="Remove metric"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMetric}
            className="inline-flex h-9 items-center justify-center rounded-md border border-surface-200 bg-white px-3 text-xs font-medium text-surface-900 transition-colors hover:bg-surface-50"
          >
            + Add metric
          </button>
        </div>
      </Section>

      <Section title="Case study">
        <div className="space-y-4">
          <TextArea
            id="problem"
            label="Problem"
            rows={5}
            value={draft.problem}
            onChange={(v) => setField("problem", v)}
          />
          <TextArea
            id="process"
            label="Process"
            rows={5}
            value={draft.process}
            onChange={(v) => setField("process", v)}
          />
          <TextArea
            id="solution"
            label="Solution"
            rows={5}
            value={draft.solution}
            onChange={(v) => setField("solution", v)}
          />
          <TextArea
            id="results"
            label="Results"
            rows={5}
            value={draft.results}
            onChange={(v) => setField("results", v)}
          />
        </div>
      </Section>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border border-surface-200 bg-white/90 p-3 shadow-lift backdrop-blur">
        <span className="mr-auto font-mono text-xs uppercase tracking-widest text-surface-500">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving" || !draft.title || !slug}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-950 px-4 text-sm font-medium text-white transition-colors hover:bg-surface-800 disabled:opacity-50"
        >
          {isNew ? "Create project" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-surface-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-surface-500">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="font-mono text-xs uppercase tracking-widest text-surface-500"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  rows = 4,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-mono text-xs uppercase tracking-widest text-surface-500"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-accent-500 focus:shadow-ring-accent"
      />
    </div>
  );
}
