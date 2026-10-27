import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPermissions } from "./guard";

/** Returns the signed-in staff member's profile, roles, and permissions. */
export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, is_active")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
    if (profileError || rolesError) {
      console.error("[Admin access] Failed to load staff profile or roles.", {
        profileError,
        rolesError,
      });
      throw new Error(
        "Unable to verify admin access. The database schema may not be pushed, or the database connection is unavailable.",
      );
    }
    if (!profile || !profile.is_active) {
      return {
        active: false as const,
        profile: null,
        roles: [] as string[],
        permissions: [] as string[],
      };
    }
    const permissions = await getPermissions(context);
    return {
      active: true as const,
      profile,
      roles: (roles ?? []).map((r) => r.role as string),
      permissions,
    };
  });
