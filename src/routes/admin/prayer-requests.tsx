import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock, X } from "lucide-react";
import { listPrayerRequests, getPrayerRequest, updatePrayerRequest } from "@/lib/admin/people.functions";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/prayer-requests")({
  head: () => ({ meta: [{ title: `Prayer Requests — ${church.shortName} Admin` }] }),
  component: PrayerAdmin,
});

const STATUSES = [
  { value: "new", label: "New" },
  { value: "under_prayer", label: "Under prayer" },
  { value: "follow_up", label: "Follow-up" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

type PrayerRow = {
  id: string; submitter_name: string | null; contact: string | null;
  message: string; is_private: boolean; status: string; internal_notes: string | null; created_at: string;
};

function PrayerAdmin() {
  const queryClient = useQueryClient();
  const list = useServerFn(listPrayerRequests);
  const fetchOne = useServerFn(getPrayerRequest);
  const update = useServerFn(updatePrayerRequest);
  const [selected, setSelected] = useState<PrayerRow | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "prayer-requests"],
    queryFn: () => list({ data: { page: 1, pageSize: 50 } }),
  });
  const items = (data?.items ?? []) as PrayerRow[];

  const open = async (row: PrayerRow) => {
    const full = (await fetchOne({ data: { id: row.id } })) as PrayerRow;
    setSelected(full);
    setNotes(full.internal_notes ?? "");
    setStatus(full.status);
  };

  const save = async () => {
    if (!selected) return;
    await update({ data: { id: selected.id, status: status as never, internal_notes: notes || undefined } });
    await queryClient.invalidateQueries({ queryKey: ["admin", "prayer-requests"] });
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          Prayer Requests <Lock className="h-5 w-5 text-gold" aria-hidden />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These requests are confidential. They are visible only to staff with prayer-request access,
          and every view is recorded in the audit log. Please handle them with care and discretion.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              <th scope="col" className="px-4 py-3 font-semibold">From</th>
              <th scope="col" className="px-4 py-3 font-semibold">Received</th>
              <th scope="col" className="px-4 py-3 font-semibold">Privacy</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {isError && <tr><td colSpan={4} className="px-4 py-8 text-center text-destructive">
              You do not have access to prayer requests. Ask a super administrator if you believe this is a mistake.
            </td></tr>}
            {!isLoading && !isError && items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No prayer requests yet.</td></tr>
            )}
            {items.map((row) => (
              <tr key={row.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                onClick={() => open(row)}>
                <td className="px-4 py-3 font-medium">{row.submitter_name || "Anonymous"}</td>
                <td className="px-4 py-3">{new Date(row.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</td>
                <td className="px-4 py-3">{row.is_private ? "Private" : "May be shared with the prayer team"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.status === "new" ? "bg-gold-soft text-forest-deep" : "bg-muted text-muted-foreground"}`}>
                    {STATUSES.find((s) => s.value === row.status)?.label ?? row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-ivory p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Prayer request</h2>
              <button onClick={() => setSelected(null)} aria-label="Close" className="rounded-md p-2 hover:bg-muted">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="font-medium text-muted-foreground">From</dt>
                <dd>{selected.submitter_name || "Anonymous"}{selected.contact && <> — {selected.contact}</>}</dd></div>
              <div><dt className="font-medium text-muted-foreground">Request</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/60 p-3">{selected.message}</dd></div>
            </dl>
            <div className="mt-4 grid gap-4">
              <div>
                <label htmlFor="pr-status" className="text-sm font-medium">Status</label>
                <select id="pr-status" value={status} onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pr-notes" className="text-sm font-medium">Internal notes (confidential)</label>
                <textarea id="pr-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={save} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-forest-deep">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
