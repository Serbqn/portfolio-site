import { getSession } from "@/lib/auth";
import { getSite } from "@/lib/content";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className="container-wide section">
        <div className="mx-auto max-w-md">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Admin
          </p>
          <h1 className="mt-3 text-display-2 font-semibold tracking-tight text-balance">
            Sign in to manage content.
          </h1>
          <p className="mt-3 text-pretty text-surface-300">
            Sign in with your Supabase account to manage projects, upload images,
            and update site content.
          </p>
          <div className="mt-8">
            <AdminLogin />
          </div>
        </div>
      </section>
    );
  }

  const site = await getSite();

  return (
    <section className="container-wide section">
      <AdminDashboard initialSite={site} />
    </section>
  );
}
