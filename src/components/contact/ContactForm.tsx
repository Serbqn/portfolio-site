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
    // v1: open the user's mail client with a pre-filled draft.
    const subject = encodeURIComponent(
      `Project enquiry — ${name}${company ? ` (${company})` : ""}`,
    );
    const body = encodeURIComponent(
      `${message}\n\n—\n${name}\n${email}${company ? `\n${company}` : ""}`,
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-surface-700 bg-surface-900 p-8">
        <p className="eyebrow">
          <span className="eyebrow-dot" />
          Opened
        </p>
        <h2 className="mt-3 text-display-3 font-semibold tracking-tight">
          Thanks — your mail client should be opening.
        </h2>
        <p className="mt-3 max-w-prose text-pretty text-surface-300">
          If nothing opened, you can email me directly at{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="link-reveal font-medium text-surface-0"
          >
            {contactEmail}
          </a>
          . I’ll reply within two working days.
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
            className="h-10 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none transition focus:border-accent-500 focus:shadow-ring-accent"
          />
        </Field>
        <Field id="email" label="Email" required>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-10 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none transition focus:border-accent-500 focus:shadow-ring-accent"
          />
        </Field>
        <Field id="company" label="Company (optional)" className="sm:col-span-2">
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            className="h-10 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none transition focus:border-accent-500 focus:shadow-ring-accent"
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
            className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-0 outline-none transition focus:border-accent-500 focus:shadow-ring-accent"
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
          No tracking. No newsletter. Just an email to me.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-lg bg-surface-950 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-surface-800",
            "disabled:opacity-50",
          )}
        >
          {status === "submitting" ? "Opening…" : submitLabel}
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
