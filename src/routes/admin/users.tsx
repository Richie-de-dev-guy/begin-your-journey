import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { church } from "@/config/church";
import { inviteStaff, listStaff, setStaffActive, setStaffRoles } from "@/lib/admin/staff.functions";
import { ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/lib/admin/permissions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: `Staff — ${church.shortName} Admin` }] }),
  component: StaffAdmin,
});

function StaffAdmin() {
  const queryClient = useQueryClient();
  const loadStaff = useServerFn(listStaff);
  const invite = useServerFn(inviteStaff);
  const updateRoles = useServerFn(setStaffRoles);
  const updateActive = useServerFn(setStaffActive);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("support_staff");
  const [roleSelections, setRoleSelections] = useState<Record<string, StaffRole[]>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => loadStaff(),
  });

  const onInvite = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await invite({ data: { email: email.trim(), role: inviteRole } });
      setEmail("");
      setMessage("Invitation sent.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not invite staff member.");
    } finally {
      setBusy(false);
    }
  };

  const saveRoles = async (userId: string, roles: StaffRole[]) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await updateRoles({ data: { userId, roles } });
      setMessage("Staff roles updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update staff roles.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await updateActive({ data: { userId, isActive } });
      setMessage(isActive ? "Staff account activated." : "Staff account deactivated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update account status.");
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = (userId: string, role: StaffRole, checked: boolean) => {
    const current =
      roleSelections[userId] ??
      data?.staff
        .find((member) => member.id === userId)
        ?.roles.filter((candidate): candidate is StaffRole =>
          STAFF_ROLES.includes(candidate as StaffRole),
        ) ??
      [];
    setRoleSelections((currentSelections) => ({
      ...currentSelections,
      [userId]: checked
        ? [...new Set([...current, role])]
        : current.filter((candidate) => candidate !== role),
    }));
  };

  const input =
    "rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Staff management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite staff, assign roles, and activate or deactivate access.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> {message}
        </p>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Invite staff member</h2>
        <form onSubmit={onInvite} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid min-w-56 flex-1 gap-1 text-sm font-medium">
            Email address
            <input
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              className={input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Initial role
            <select
              className={input}
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as StaffRole)}
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60"
          >
            {busy ? "Working…" : "Send invitation"}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Accounts</h2>
        {isLoading && (
          <p role="status" className="text-sm text-muted-foreground">
            Loading staff…
          </p>
        )}
        {isError && (
          <p role="alert" className="text-sm text-destructive">
            Could not load staff. Verify your users.manage access and database setup.
          </p>
        )}
        {data?.staff.map((member) => {
          const selected =
            roleSelections[member.id] ??
            member.roles.filter((role): role is StaffRole =>
              STAFF_ROLES.includes(role as StaffRole),
            );
          return (
            <article key={member.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{member.full_name || member.email || member.id}</h3>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {member.is_active ? "Active" : "Inactive"} ·{" "}
                    {member.roles.map((role) => ROLE_LABELS[role] ?? role).join(", ") || "No roles"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggleActive(member.id, !member.is_active)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
                >
                  {member.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
              <fieldset className="mt-4">
                <legend className="text-sm font-medium">Roles</legend>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                  {STAFF_ROLES.map((role) => (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.includes(role)}
                        onChange={(event) => toggleRole(member.id, role, event.target.checked)}
                      />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveRoles(member.id, selected)}
                  className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
                >
                  Save roles
                </button>
              </fieldset>
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Invitations</h2>
        {!data?.invitations.length && (
          <p className="text-sm text-muted-foreground">No invitations yet.</p>
        )}
        {data?.invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex flex-wrap justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
          >
            <span>{invitation.email}</span>
            <span className="text-muted-foreground">
              {ROLE_LABELS[invitation.role] ?? invitation.role} ·{" "}
              {invitation.accepted_at ? "Accepted" : "Pending"}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
