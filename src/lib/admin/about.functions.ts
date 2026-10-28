import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit, requirePermission } from "./guard";

const sectionOrder = {
  story: 1,
  vision: 2,
  mission: 3,
  core_values: 4,
  statement_of_faith: 5,
  leadership: 6,
} as const;

const aboutSectionSchema = z.object({
  key: z.enum(["story", "vision", "mission", "core_values", "statement_of_faith", "leadership"]),
  title: z.string().trim().min(2).max(100),
  body: z.string().trim().max(20_000),
});

export const saveAboutSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const sections = z.array(aboutSectionSchema).length(6).parse(input);
    if (new Set(sections.map((section) => section.key)).size !== 6) {
      throw new Error("Include each About page section exactly once.");
    }
    return sections;
  })
  .handler(async ({ data, context }) => {
    const { data: isSuperAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (roleError) throw new Error("Could not verify Super Administrator access.");
    if (!isSuperAdmin) throw new Error("Only a Super Administrator can edit About page content.");
    await requirePermission(context, "settings.manage");

    const { error } = await context.supabase.from("about_sections").upsert(
      data.map((section) => ({
        ...section,
        is_placeholder: false,
        display_order: sectionOrder[section.key],
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "key" },
    );
    if (error) {
      console.error("[Admin About] Could not save About page sections.", error);
      throw new Error(
        "Could not save About page content. Confirm that the latest database schema has been pushed.",
      );
    }

    await logAudit(context, "update_about_page", "about_sections", null, {
      sections: data.map((section) => section.key),
    });
    return { ok: true };
  });
