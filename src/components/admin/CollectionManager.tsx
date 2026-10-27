import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "datetime-local" | "select" | "checkbox" | "number" | "url";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type ColumnDef = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => string;
};

type Props = {
  title: string;
  description: string;
  queryKey: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  listFn: (args: { page: number; pageSize: number }) => Promise<{
    rows: Record<string, unknown>[];
    total: number;
  }>;
  createFn: (values: Record<string, unknown>) => Promise<unknown>;
  updateFn: (args: { id: string; values: Record<string, unknown> }) => Promise<unknown>;
  deleteFn: (args: { id: string }) => Promise<unknown>;
  emptyText: string;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (hidden from the public site)" },
  { value: "published", label: "Published (visible on the public site)" },
  { value: "archived", label: "Archived" },
];

export const statusField: FieldDef = {
  name: "status",
  label: "Status",
  type: "select",
  options: STATUS_OPTIONS,
  required: true,
};

export function statusBadge(status: unknown) {
  const s = String(status ?? "draft");
  const styles: Record<string, string> = {
    published: "bg-primary/10 text-primary",
    draft: "bg-muted text-muted-foreground",
    archived: "bg-charcoal/10 text-charcoal",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[s] ?? styles["draft"]}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function defaultValue(f: FieldDef): unknown {
  if (f.type === "checkbox") return false;
  if (f.type === "number") return 0;
  if (f.type === "select") return f.options?.[0]?.value ?? "";
  return "";
}

export function CollectionManager({
  title, description, queryKey, fields, columns, listFn, createFn, updateFn, deleteFn, emptyText,
}: Props) {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", queryKey, page],
    queryFn: () => listFn({ page, pageSize: 20 }),
  });

  const items = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const openNew = () => {
    const initial: Record<string, unknown> = {};
    for (const f of fields) initial[f.name] = defaultValue(f);
    setForm(initial);
    setEditing({});
    setError(null);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const initial: Record<string, unknown> = {};
    for (const f of fields) {
      let v = row[f.name];
      if (v == null) v = defaultValue(f);
      if (f.type === "datetime-local" && typeof v === "string" && v) v = v.slice(0, 16);
      initial[f.name] = v;
    }
    setForm(initial);
    setEditing(row);
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        let v = form[f.name];
        if (f.type === "number") v = Number(v) || 0;
        if ((f.type === "text" || f.type === "textarea" || f.type === "url") && v === "") v = f.required ? v : undefined;
        if (f.type === "datetime-local" && v) v = new Date(String(v)).toISOString();
        if (f.type === "datetime-local" && !v) v = undefined;
        if (f.type === "date" && !v) v = undefined;
        payload[f.name] = v;
      }
      if (editing && editing["id"]) {
        await updateFn({ id: String(editing["id"]), values: payload });
      } else {
        await createFn(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", queryKey] });
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^.*?: /, "") : "Save failed. Please check the form and try again.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (row: Record<string, unknown>) => {
    if (!window.confirm(`Delete "${String(row["title"] ?? row["name"] ?? "this item")}"? This cannot be undone.`)) return;
    try {
      await deleteFn({ id: String(row["id"]) });
      await queryClient.invalidateQueries({ queryKey: ["admin", queryKey] });
    } catch {
      window.alert("Delete failed. You may not have permission to delete this item.");
    }
  };

  const input =
    "mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-forest-deep">
          <Plus className="h-4 w-4" aria-hidden /> New
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {columns.map((c) => (
                <th key={c.key} scope="col" className="px-4 py-3 font-semibold">{c.label}</th>
              ))}
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={columns.length + 2} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {isError && (
              <tr><td colSpan={columns.length + 2} className="px-4 py-8 text-center text-destructive">
                Could not load this list. You may not have permission to view it.
              </td></tr>
            )}
            {!isLoading && !isError && items.length === 0 && (
              <tr><td colSpan={columns.length + 2} className="px-4 py-8 text-center text-muted-foreground">{emptyText}</td></tr>
            )}
            {items.map((row) => (
              <tr key={String(row["id"])} className="border-b border-border last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-3">{statusBadge(row["status"])}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(row)} aria-label="Edit"
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button onClick={() => onDelete(row)} aria-label="Delete"
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
          </button>
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-ivory p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing["id"] ? "Edit" : "New"} {title.replace(/s$/, "")}</h2>
              <button onClick={() => setEditing(null)} aria-label="Close" className="rounded-md p-2 hover:bg-muted">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {error && (
              <div role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
            <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  {f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" className="h-4 w-4 rounded border-input"
                        checked={Boolean(form[f.name])}
                        onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))} />
                      {f.label}
                    </label>
                  ) : (
                    <>
                      <label htmlFor={`f-${f.name}`} className="text-sm font-medium">
                        {f.label}{f.required && <span className="text-destructive"> *</span>}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea id={`f-${f.name}`} rows={5} required={f.required} placeholder={f.placeholder} className={input}
                          value={String(form[f.name] ?? "")}
                          onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                      ) : f.type === "select" ? (
                        <select id={`f-${f.name}`} required={f.required} className={input}
                          value={String(form[f.name] ?? "")}
                          onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}>
                          {(f.options ?? []).map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input id={`f-${f.name}`} type={f.type} required={f.required} placeholder={f.placeholder} className={input}
                          value={String(form[f.name] ?? "")}
                          onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                      )}
                      {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
                    </>
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                  Cancel
                </button>
                <button type="submit" disabled={busy}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60">
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
