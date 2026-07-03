import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-wide grid place-items-center py-section text-center">
      <p className="eyebrow">
        <span className="eyebrow-dot" />
        404
      </p>
      <h1 className="mt-6 text-display-2 font-semibold tracking-tight text-balance">
        That page doesn’t exist.
      </h1>
      <p className="mt-4 max-w-md text-pretty text-surface-600">
        The link may be old, or the project has been retired. Try one of the
        routes below.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-950 px-4 text-sm font-medium text-white transition-colors hover:bg-surface-800"
        >
          Back to home
        </Link>
        <Link
          href="/projects"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-surface-200 px-4 text-sm font-medium text-surface-900 transition-colors hover:bg-surface-50"
        >
          See projects
        </Link>
      </div>
    </div>
  );
}
