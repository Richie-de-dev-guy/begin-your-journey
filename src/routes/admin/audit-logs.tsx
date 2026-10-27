import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { church } from "@/config/church";
import { listAuditLogs } from "@/lib/admin/staff.functions";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({ meta: [{ title: `Audit log — ${church.shortName} Admin` }] }),
  component: AuditLogs,
});

function AuditLogs() {
  const loadLogs = useServerFn(listAuditLogs);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "audit-logs", page],
    queryFn: () => loadLogs({ data: { page, pageSize: 30 } }),
  });
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 30));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrative changes and access to confidential records.
        </p>
      </header>
      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading audit log…
        </p>
      )}
      {isError && (
        <p role="alert" className="text-sm text-destructive">
          Could not load the audit log. Verify your audit_logs.read access.
        </p>
      )}
      {!isLoading && !isError && data?.rows.length === 0 && (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No audit entries yet.
        </p>
      )}
      {!!data?.rows.length && (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Time
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Actor
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Record
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(row.created_at).toLocaleString("en-NG")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.actor_id}</td>
                    <td className="px-4 py-3">{row.action}</td>
                    <td className="px-4 py-3">
                      {row.entity_type}
                      {row.entity_id ? ` · ${row.entity_id}` : ""}
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <pre className="whitespace-pre-wrap break-words font-sans text-xs">
                        {JSON.stringify(row.metadata)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
