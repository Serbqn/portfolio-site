"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm({
  submitLabel,
  contactEmail,
}: {
  submitLabel: string;
  contactEmail: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const company = String(fd.get("company") || "").trim();
    const message = String(fd.get("message") || "").trim();
    if (!name || !email || !message) {
      setError("Please fill in name, email, and message.");
      setStatus("error");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("That email address doesn’t look right.");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, message }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-accent-600 bg-surface-900 p-8"
      >
        <span className="inline-grid h-10 w-10 place-items-center rounded-full bg-accent-500/15 text-accent-400">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
            <path
              d="M4 10.5l4 4 8-9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="mt-4 text-display-3 font-medium tracking-tight">
          Thanks — your message is on its way.
        </h2>
        <p className="mt-3 max-w-prose text-pretty text-surface-300">
          I read everything myself and reply within two working days. In the
          meantime you can reach me directly at{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="link-reveal font-medium text-surface-0"
          >
            {contactEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-surface-700 bg-surface-900 p-6 sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Your name" required>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="h-10 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none transition placeholder:text-surface-400 focus:border-accent-500"
          />
        </Field>
        <Field id="email" label="Email" required>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-10 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none transition placeholder:text-surface-400 focus:border-accent-500"
          />
        </Field>
        <Field id="company" label="Company (optional)" className="sm:col-span-2">
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            className="h-10 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none transition placeholder:text-surface-400 focus:border-accent-500"
          />
        </Field>
        <Field
          id="message"
          label="Tell me about the project"
          required
          className="sm:col-span-2"
        >
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            placeholder="What are you building, who is it for, and what’s the rough timeline?"
            className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-0 outline-none transition placeholder:text-surface-400 focus:border-accent-500"
          />
        </Field>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-surface-400">
          No tracking. No newsletter. Straight to my inbox.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-lg bg-accent-500 px-4 text-sm font-medium text-surface-950 transition-colors duration-150 hover:bg-accent-400 active:scale-[0.98]",
            "disabled:opacity-50",
          )}
        >
          {status === "submitting" ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label
        htmlFor={id}
        className="font-mono text-xs uppercase tracking-widest text-surface-400"
      >
        {label}
        {required ? <span className="text-accent-600"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
