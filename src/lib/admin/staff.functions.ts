import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission, logAudit } from "./guard";
import { inviteStaffSchema } from "./schemas";

async function ensureAnotherActiveSuperAdmin(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  currentUserId: string,
) {
  const { data: admins, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin")
    .neq("user_id", currentUserId);
  if (rolesError) throw new Error("Could not verify the remaining administrator accounts.");
  const otherIds = [...new Set((admins ?? []).map((admin) => admin.user_id))];
  if (!otherIds.length) {
    throw new Error("At least one other Super Administrator must remain active.");
  }
  const { data: activeProfiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .in("id", otherIds)
    .eq("is_active", true);
  if (profileError) throw new Error("Could not verify active administrator accounts.");
  if (!activeProfiles?.length) {
    throw new Error("At least one other active Super Administrator must remain.");
  }
}

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
    const [{ data: roles, error: rolesError }, { data: invites, error: invitesError }] =
      await Promise.all([
        context.supabase.from("user_roles").select("user_id, role"),
        context.supabase
          .from("staff_invitations")
          .select("id, email, role, accepted_at, created_at")
          .order("created_at", { ascending: false }),
      ]);
    if (rolesError || invitesError) throw new Error("Could not load staff roles or invitations.");
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
  .validator((input: unknown) => inviteStaffSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const siteUrl = process.env["SITE_URL"];
    if (!siteUrl) throw new Error("SITE_URL is required to send staff invitations.");
    const redirectTo = new URL("/admin/reset-password", siteUrl).toString();
    const { error: invitationError } = await context.supabase.from("staff_invitations").insert({
      email: data.email,
      role: data.role,
      invited_by: context.userId,
    });
    if (invitationError) {
      throw new Error("Could not record the staff invitation.");
    }

    const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      { redirectTo },
    );
    if (inviteError) {
      const { error: cleanupError } = await context.supabase
        .from("staff_invitations")
        .delete()
        .eq("email", data.email);
      if (cleanupError) {
        console.error("[Staff invite] Could not remove failed invitation record.", cleanupError);
      }
      throw new Error(`Could not send the invitation: ${inviteError.message}`);
    }

    if (!invite.user) {
      throw new Error("Supabase sent the invitation but did not return the Auth user.");
    }
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: invite.user.id, role: data.role }, { onConflict: "user_id,role" });
    if (roleError) {
      console.error("[Staff invite] Invitation sent but role assignment failed.", roleError);
      throw new Error("Invitation was sent, but the staff role could not be assigned.");
    }
    await logAudit(context, "invite_staff", "staff_invitations", data.email, { role: data.role });
    return { ok: true };
  });

/** Change a staff member's roles. Self-escalation to super_admin is blocked. */
export const setStaffRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        roles: z.array(
          z.enum(["super_admin", "pastor", "content_editor", "event_coordinator", "support_staff"]),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.userId === context.userId) {
      const { data: alreadyAdmin, error } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "super_admin",
      });
      if (error) throw new Error("Could not verify your current administrator role.");
      if (!alreadyAdmin && data.roles.includes("super_admin")) {
        throw new Error("You cannot grant yourself Super Administrator access.");
      }
    }
    const { data: currentRoles, error: currentRolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if (currentRolesError) throw new Error("Could not verify the staff member's current roles.");
    if (
      currentRoles?.some((role) => role.role === "super_admin") &&
      !data.roles.includes("super_admin")
    ) {
      await ensureAnotherActiveSuperAdmin(supabaseAdmin, data.userId);
    }
    if (data.roles.length) {
      const { error } = await supabaseAdmin.from("user_roles").upsert(
        data.roles.map((role) => ({ user_id: data.userId, role })),
        {
          onConflict: "user_id,role",
        },
      );
      if (error) throw new Error("Could not update roles.");
    }
    const rolesToRemove = (currentRoles ?? [])
      .map((role) => role.role)
      .filter((role) => !data.roles.includes(role));
    if (rolesToRemove.length) {
      const { error: deleteError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .in("role", rolesToRemove);
      if (deleteError) throw new Error("Could not remove previous staff roles.");
    }
    await logAudit(context, "set_staff_roles", "profiles", data.userId, { roles: data.roles });
    return { ok: true };
  });

/** Activate or deactivate a staff account. */
export const setStaffActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ userId: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "users.manage");
    if (data.userId === context.userId && !data.isActive) {
      throw new Error("You cannot deactivate your own account.");
    }
    if (!data.isActive) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: roles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.userId);
      if (rolesError) throw new Error("Could not verify staff roles before deactivation.");
      if (roles?.some((role) => role.role === "super_admin")) {
        await ensureAnotherActiveSuperAdmin(supabaseAdmin, data.userId);
      }
    }
    const { error } = await context.supabase
      .from("profiles")
      .update({ is_active: data.isActive, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw new Error("Could not update the account.");
    await logAudit(
      context,
      data.isActive ? "activate_staff" : "deactivate_staff",
      "profiles",
      data.userId,
    );
    return { ok: true };
  });

/** Grant or revoke an individual permission override (e.g. prayer access for one pastor). */
export const setUserPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ userId: z.string().uuid(), permission: z.string().max(60), granted: z.boolean() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "users.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.granted) {
      const { error } = await supabaseAdmin
        .from("user_permissions")
        .upsert(
          { user_id: data.userId, permission: data.permission },
          { onConflict: "user_id,permission" },
        );
      if (error) throw new Error("Could not grant the permission.");
    } else {
      const { error } = await supabaseAdmin
        .from("user_permissions")
        .delete()
        .eq("user_id", data.userId)
        .eq("permission", data.permission);
      if (error) throw new Error("Could not revoke the permission.");
    }
    await logAudit(
      context,
      data.granted ? "grant_permission" : "revoke_permission",
      "profiles",
      data.userId,
      {
        permission: data.permission,
      },
    );
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(30),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "audit_logs.read");
    const {
      data: rows,
      count,
      error,
    } = await context.supabase
      .from("audit_logs")
      .select("id, actor_id, action, entity_type, entity_id, metadata, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range((data.page - 1) * data.pageSize, data.page * data.pageSize - 1);
    if (error) throw new Error("Could not load the audit log.");
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });
