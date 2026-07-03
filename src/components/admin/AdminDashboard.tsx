"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  ProjectListItem,
  SiteContent,
} from "@/lib/types";
import { slugify } from "@/lib/utils";
import type { AdminStatus } from "@/lib/admin-types";
import { ProjectEditor, type ProjectDraftWithSections } from "@/components/admin/ProjectEditor";
import { SiteEditor } from "@/components/admin/SiteEditor";

type Section = "list" | "site" | string; // slug or 'list' | 'site' | 'new'

export function AdminDashboard({ initialSite }: { initialSite: SiteContent }) {
  const [session, setSession] = useState<{ sub: string; role: string } | null>(null);
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [site, setSite] = useState<SiteContent>(initialSite);
  const [section, setSection] = useState<Section>("list");

  async function refresh() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/admin/api/projects", { cache: "no-store" });
      if (res.status === 401) {
        window.location.assign("/admin");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to load");
      }
      const data = (await res.json()) as { projects: ProjectListItem[] };
      setProjects(data.projects);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setStatus("error");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    // Read a `?edit=slug` param to jump straight into the editor
    const params = new URLSearchParams(window.location.search);
    const edit = params.get("edit");
    if (edit) setSection(edit);
  }, []);

  async function handleLogout() {
    await fetch("/admin/api/auth", { method: "DELETE" });
    window.location.assign("/admin");
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete project "${slug}"? This cannot be undone.`)) return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/admin/api/projects/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Delete failed");
      }
      setStatus("saved");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-surface-500">
            Edit projects, upload cover images, and update site copy. All changes
            are saved to Supabase and deployed instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-surface-200 bg-white px-3 text-sm font-medium text-surface-900 transition-colors hover:bg-surface-50"
          >
            View site ↗
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-surface-200 bg-white px-3 text-sm font-medium text-surface-900 transition-colors hover:bg-surface-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap items-center gap-2 border-b border-surface-200 pb-3">
        <button
          type="button"
          onClick={() => setSection("list")}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            section === "list"
              ? "bg-surface-950 text-white"
              : "text-surface-600 hover:text-surface-950"
          }`}
        >
          Projects
        </button>
        <button
          type="button"
          onClick={() => setSection("new")}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            section === "new"
              ? "bg-surface-950 text-white"
              : "text-surface-600 hover:text-surface-950"
          }`}
        >
          + New project
        </button>
        <button
          type="button"
          onClick={() => setSection("site")}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            section === "site"
              ? "bg-surface-950 text-white"
              : "text-surface-600 hover:text-surface-950"
          }`}
        >
          Site copy
        </button>
        <span className="ml-auto font-mono text-xs uppercase tracking-widest text-surface-500">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </span>
      </nav>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {section === "list" ? (
        <ProjectList
          projects={projects}
          loading={status === "loading"}
          onEdit={(s) => setSection(s)}
          onDelete={handleDelete}
        />
      ) : section === "site" ? (
        <SiteEditor
          site={site}
          status={status}
          onSave={async (next) => {
            setStatus("saving");
            setError(null);
            try {
              const res = await fetch("/admin/api/site", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ site: next }),
              });
              if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(data.error || "Save failed");
              }
              const data = (await res.json()) as { site: SiteContent };
              setSite(data.site);
              setStatus("saved");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              setStatus("error");
            }
          }}
        />
      ) : (
        <ProjectEditor
          key={section}
          initial={
            section === "new"
              ? emptyDraft()
              : undefined
          }
          slug={section === "new" ? "" : section}
          allSlugs={projects.map((p) => p.slug)}
          isNew={section === "new"}
          onSaved={async () => {
            setStatus("saved");
            await refresh();
            setSection("list");
          }}
        />
      )}
    </div>
  );
}

function emptyDraft(): ProjectDraftWithSections {
  const now = new Date();
  return {
    title: "",
    subtitle: "",
    role: "",
    year: String(now.getFullYear()),
    client: "",
    tags: [],
    featured: false,
    cover: "",
    summary: "",
    metrics: [{ label: "", value: "" }],
    gallery: [],
    problem: "",
    process: "",
    solution: "",
    results: "",
  };
}

function ProjectList({
  projects,
  loading,
  onEdit,
  onDelete,
}: {
  projects: ProjectListItem[];
  loading: boolean;
  onEdit: (slug: string) => void;
  onDelete: (slug: string) => void;
}) {
  if (loading) {
    return (
      <p className="rounded-2xl border border-surface-200 bg-white p-6 text-sm text-surface-500">
        Loading projects…
      </p>
    );
  }
  if (!projects.length) {
    return (
      <p className="rounded-2xl border border-surface-200 bg-white p-6 text-sm text-surface-500">
        No projects yet. Create one with the “+ New project” tab above.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-surface-200 overflow-hidden rounded-2xl border border-surface-200 bg-white">
      {projects.map((p) => (
        <li
          key={p.slug}
          className="grid grid-cols-[1fr_auto] items-center gap-3 p-4 sm:grid-cols-[2fr_1fr_auto_auto] sm:p-5"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-surface-950">
              {p.title}
            </div>
            <div className="mt-0.5 truncate text-xs text-surface-500">
              {p.subtitle}
            </div>
          </div>
          <div className="hidden text-xs text-surface-500 sm:block">
            {p.year} · {p.client}
          </div>
          <div className="hidden flex-wrap gap-1 sm:flex">
            {p.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-surface-700"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(p.slug)}
              className="inline-flex h-8 items-center justify-center rounded-md border border-surface-200 bg-white px-3 text-xs font-medium text-surface-900 transition-colors hover:bg-surface-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(p.slug)}
              className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
