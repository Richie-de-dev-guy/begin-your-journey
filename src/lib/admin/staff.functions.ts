import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission, logAudit } from "./guard";
import { inviteStaffSchema } from "./schemas";

/** Staff list: profiles + roles. users.manage only. */
export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "users.manage");
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, is_active, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error("Could not load staff.");
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const { data: invites } = await context.supabase
      .from("staff_invitations")
      .select("id, email, role, accepted_at, created_at")
      .order("created_at", { ascending: false });
    return {
      staff: (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
      })),
      invitations: invites ?? [],
    };
  });

/** Invite a new staff member: creates an invitation and sends an invite email. */
export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inviteStaffSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const origin = new URL(context.supabase.auth ? "https://app" : "https://app");
    void origin;
    const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
    if (inviteError) throw new Error(`Could not send the invitation: ${inviteError.message}`);
    const invitedUserId = invite.user?.id ?? null;

    const { error } = await context.supabase.from("staff_invitations").insert({
      email: data.email,
      role: data.role,
      invited_by: context.userId,
    });
    if (error) throw new Error("The invitation email was sent, but recording it failed.");

    if (invitedUserId) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: invitedUserId, role: data.role }, { onConflict: "user_id,role" });
      if (roleError) throw new Error("The invitation was sent, but assigning the role failed.");
    }
    await logAudit(context, "invite_staff", "staff_invitations", data.email, { role: data.role });
    return { ok: true };
  });

/** Change a staff member's roles. Self-escalation to super_admin is blocked. */
export const setStaffRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        roles: z.array(z.enum(["super_admin", "pastor", "content_editor", "event_coordinator", "support_staff"])),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "users.manage");
    if (data.userId === context.userId && data.roles.includes("super_admin")) {
      const { data: alreadyAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "super_admin",
      });
      if (!alreadyAdmin) throw new Error("You cannot grant yourself Super Administrator access.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: delError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (delError) throw new Error("Could not update roles.");
    if (data.roles.length) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((role) => ({ user_id: data.userId, role })));
      if (error) throw new Error("Could not update roles.");
    }
    await logAudit(context, "set_staff_roles", "profiles", data.userId, { roles: data.roles });
    return { ok: true };
  });

/** Activate or deactivate a staff account. */
export const setStaffActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "users.manage");
    if (data.userId === context.userId && !data.isActive) {
      throw new Error("You cannot deactivate your own account.");
    }
    const { error } = await context.supabase
      .from("profiles")
      .update({ is_active: data.isActive, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw new Error("Could not update the account.");
    await logAudit(context, data.isActive ? "activate_staff" : "deactivate_staff", "profiles", data.userId);
    return { ok: true };
  });

/** Grant or revoke an individual permission override (e.g. prayer access for one pastor). */
export const setUserPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), permission: z.string().max(60), granted: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.granted) {
      const { error } = await supabaseAdmin
        .from("user_permissions")
        .upsert({ user_id: data.userId, permission: data.permission }, { onConflict: "user_id,permission" });
      if (error) throw new Error("Could not grant the permission.");
    } else {
      const { error } = await supabaseAdmin
        .from("user_permissions")
        .delete()
        .eq("user_id", data.userId)
        .eq("permission", data.permission);
      if (error) throw new Error("Could not revoke the permission.");
    }
    await logAudit(context, data.granted ? "grant_permission" : "revoke_permission", "profiles", data.userId, {
      permission: data.permission,
    });
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "audit_logs.read");
    const { data: rows, count, error } = await context.supabase
      .from("audit_logs")
      .select("id, actor_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((data.page - 1) * data.pageSize, data.page * data.pageSize - 1);
    if (error) throw new Error("Could not load the audit log.");
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });
