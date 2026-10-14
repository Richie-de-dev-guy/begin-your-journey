import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { listInquiries, getInquiry, updateInquiry } from "@/lib/admin/people.functions";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/inquiries")({
  head: () => ({ meta: [{ title: `Inquiries — ${church.shortName} Admin` }] }),
  component: InquiriesAdmin,
});

const STATUSES = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "contacted", label: "Contacted" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

type Inquiry = {
  id: string; full_name: string; email: string; phone: string | null;
  subject: string; message: string; status: string; internal_notes: string | null; created_at: string;
};

function InquiriesAdmin() {
  const queryClient = useQueryClient();
  const list = useServerFn(listInquiries);
  const fetchOne = useServerFn(getInquiry);
  const update = useServerFn(updateInquiry);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "inquiries", filter],
    queryFn: () => list({ data: { page: 1, pageSize: 50, status: filter || undefined } }),
  });
  const items = (data?.items ?? []) as Inquiry[];

  const open = async (row: Inquiry) => {
    const full = (await fetchOne({ data: { id: row.id } })) as Inquiry;
    setSelected(full);
    setNotes(full.internal_notes ?? "");
    setStatus(full.status);
  };

  const save = async () => {
    if (!selected) return;
    await update({ data: { id: selected.id, status: status as never, internal_notes: notes || undefined } });
    await queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">Messages sent through the public contact form.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status"
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              <th scope="col" className="px-4 py-3 font-semibold">Name</th>
              <th scope="col" className="px-4 py-3 font-semibold">Subject</th>
              <th scope="col" className="px-4 py-3 font-semibold">Received</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {isError && <tr><td colSpan={4} className="px-4 py-8 text-center text-destructive">Could not load inquiries. You may not have permission.</td></tr>}
            {!isLoading && !isError && items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No inquiries yet.</td></tr>
            )}
            {items.map((row) => (
              <tr key={row.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                onClick={() => open(row)}>
                <td className="px-4 py-3 font-medium">{row.full_name}</td>
                <td className="px-4 py-3">{row.subject || "—"}</td>
                <td className="px-4 py-3">{new Date(row.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</td>
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
              <h2 className="text-xl font-bold">{selected.subject || "Inquiry"}</h2>
              <button onClick={() => setSelected(null)} aria-label="Close" className="rounded-md p-2 hover:bg-muted">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="font-medium text-muted-foreground">From</dt>
                <dd>{selected.full_name} — <a className="text-primary underline" href={`mailto:${selected.email}`}>{selected.email}</a>
                {selected.phone && <> · <a className="text-primary underline" href={`tel:${selected.phone}`}>{selected.phone}</a></>}</dd></div>
              <div><dt className="font-medium text-muted-foreground">Message</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/60 p-3">{selected.message}</dd></div>
            </dl>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inq-status" className="text-sm font-medium">Status</label>
                <select id="inq-status" value={status} onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="inq-notes" className="text-sm font-medium">Internal notes (staff only)</label>
                <textarea id="inq-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
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
