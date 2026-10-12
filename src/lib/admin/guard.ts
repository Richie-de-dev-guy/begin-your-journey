import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Ctx = { supabase: SupabaseClient<Database>; userId: string };

/** Server-side permission check. Throws on denial — deny by default. */
export async function requirePermission(context: Ctx, permission: string) {
  const { data, error } = await context.supabase.rpc("has_permission", {
    _user_id: context.userId,
    _permission: permission,
  });
  if (error) throw new Error("Authorization check failed");
  if (!data) throw new Error("You do not have permission to perform this action.");
}

export async function getPermissions(context: Ctx): Promise<string[]> {
  const perms = new Set<string>();
  const { data: roles } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (roles?.length) {
    const { data: rp } = await context.supabase
      .from("role_permissions")
      .select("permission")
      .in("role", roles.map((r) => r.role));
    rp?.forEach((r) => perms.add(r.permission));
  }
  const { data: up } = await context.supabase
    .from("user_permissions")
    .select("permission")
    .eq("user_id", context.userId);
  up?.forEach((r) => perms.add(r.permission));
  return [...perms];
}

/** Append an audit entry. Never include secrets or private request content. */
export async function logAudit(
  context: Ctx,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  await context.supabase.from("audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });
}
