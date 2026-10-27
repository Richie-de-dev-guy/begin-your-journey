import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  BookOpen,
  Calendar,
  Megaphone,
  Users,
  Inbox,
  HandHeart,
  ScrollText,
} from "lucide-react";
import { getDashboardStats } from "@/lib/admin/content.functions";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: `Dashboard — ${church.shortName} Admin` }] }),
  component: AdminDashboard,
});

const STAT_CARDS = [
  { key: "pages", label: "Pages", icon: FileText, to: "/admin/content" },
  { key: "sermons", label: "Sermons", icon: BookOpen, to: "/admin/sermons" },
  { key: "events", label: "Events", icon: Calendar, to: "/admin/events" },
  { key: "announcements", label: "Announcements", icon: Megaphone, to: "/admin/announcements" },
  { key: "ministries", label: "Ministries", icon: Users, to: "/admin/ministries" },
] as const;

function AdminDashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  const newInquiries = data?.inquiries ?? null;
  const newPrayer = data?.prayerRequests ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of the website's content and incoming messages.
        </p>
      </div>

      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading dashboard totals…
        </p>
      )}
      {isError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Could not load dashboard totals. Check the database connection and your dashboard
          permissions.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, to }) => (
          <Link
            key={key}
            to={to}
            className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <Icon className="h-5 w-5 text-gold" aria-hidden />
            </div>
            <p className="mt-2 text-3xl font-bold text-forest-deep">{data?.[key] ?? 0}</p>
          </Link>
        ))}
      </div>

      {(newInquiries !== null || newPrayer !== null) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {newInquiries !== null && (
            <Link
              to="/admin/inquiries"
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-gold" aria-hidden />
                <h2 className="font-semibold">New inquiries</h2>
              </div>
              <p className="mt-2 text-3xl font-bold text-forest-deep">{newInquiries}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact-form messages awaiting a reply.
              </p>
            </Link>
          )}
          {newPrayer !== null && (
            <Link
              to="/admin/prayer-requests"
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-gold" aria-hidden />
                <h2 className="font-semibold">New prayer requests</h2>
              </div>
              <p className="mt-2 text-3xl font-bold text-forest-deep">{newPrayer}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Confidential requests — visible only to staff with prayer-request access.
              </p>
            </Link>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-gold" aria-hidden />
          <h2 className="font-semibold">Accountability</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Content changes, staff actions, and views of confidential records are recorded for
          accountability.
        </p>
      </div>
    </div>
  );
}
