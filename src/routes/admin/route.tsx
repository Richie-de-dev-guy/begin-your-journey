import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Church, Menu, X, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccess } from "@/lib/admin/access.functions";
import { ADMIN_NAV, ROLE_LABELS, type Permission } from "@/lib/admin/permissions";
import { church } from "@/config/church";

type Access = {
  active: boolean;
  profile: { full_name: string | null; email: string | null } | null;
  roles: string[];
  permissions: string[];
};

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

const AUTH_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const fetchAccess = useServerFn(getMyAccess);
  const [access, setAccess] = useState<Access | null>(null);
  const [checked, setChecked] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = AUTH_PATHS.includes(pathname);

  useEffect(() => {
    if (isAuthPage) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/admin/login", replace: true });
        return;
      }
      try {
        const result = (await fetchAccess()) as Access;
        if (cancelled) return;
        if (!result.active || !result.permissions.includes("dashboard.view")) {
          setAccessError(
            "This account is signed in, but it does not have active staff access. Make sure the database schema has been pushed and this account has the super_admin role.",
          );
          return;
        }
        setAccess(result);
        setChecked(true);
      } catch (error) {
        console.error("[Admin access] Could not verify staff access.", error);
        if (!cancelled) {
          setAccessError(
            "Staff access could not be verified. Check that the database schema was pushed successfully, then try again.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthPage, fetchAccess, navigate]);

  if (isAuthPage) return <Outlet />;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  if (accessError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Admin access unavailable</h1>
          <p className="mt-3 text-sm text-muted-foreground" role="alert">
            {accessError}
          </p>
          <button
            onClick={signOut}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!checked || !access) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground" role="status">
          Checking your access…
        </p>
      </div>
    );
  }

  const allowed = ADMIN_NAV.filter((item) =>
    access.permissions.includes(item.permission as Permission),
  );

  const nav = (
    <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {allowed.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-ivory/80 hover:bg-forest hover:text-ivory"
              activeProps={{ className: "bg-forest text-ivory" }}
              activeOptions={{ exact: item.to === "/admin" }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col bg-forest-deep lg:flex">
        <div className="flex items-center gap-2 border-b border-ivory/10 px-4 py-4">
          <Church className="h-6 w-6 text-gold" aria-hidden />
          <div>
            <p className="font-heading text-sm font-bold leading-tight text-ivory">
              {church.shortName}
            </p>
            <p className="text-xs text-ivory/60">Administration</p>
          </div>
        </div>
        {nav}
        <div className="border-t border-ivory/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ivory/70 hover:text-ivory"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> View public site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-charcoal/60"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-forest-deep">
            <div className="flex items-center justify-between border-b border-ivory/10 px-4 py-4">
              <span className="font-heading text-sm font-bold text-ivory">Administration</span>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="p-2 text-ivory"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-ivory px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-2 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <p className="text-sm font-semibold text-forest-deep">Staff Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">
                {access.profile?.full_name || access.profile?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {access.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") || "Staff"}
              </p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
