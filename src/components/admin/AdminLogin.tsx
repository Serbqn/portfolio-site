"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "error";

export function AdminLogin() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    try {
      const res = await fetch("/admin/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Sign-in failed");
      }
      // Hard reload so the server-rendered admin picks up the new cookie.
      window.location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setStatus("idle");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-soft sm:p-8"
    >
      <div>
        <label
          htmlFor="email"
          className="font-mono text-xs uppercase tracking-widest text-surface-500"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="mt-2 h-11 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm text-surface-900 outline-none transition focus:border-accent-500 focus:shadow-ring-accent"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="font-mono text-xs uppercase tracking-widest text-surface-500"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 h-11 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm text-surface-900 outline-none transition focus:border-accent-500 focus:shadow-ring-accent"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-surface-950 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-surface-800 disabled:opacity-50"
      >
        {status === "submitting" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
