import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission, logAudit } from "./guard";
import { inquiryUpdateSchema, prayerUpdateSchema, listQuerySchema } from "./schemas";

// ============ INQUIRIES ============

export const listInquiries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listQuerySchema.parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "inquiries.read");
    const { search, status, page, pageSize } = data;
    let q = context.supabase
      .from("inquiries")
      .select("id, full_name, email, phone, subject, status, assigned_to, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (status) q = q.eq("status", status as "new");
    if (search) {
      const like = `%${search.replace(/[%_,()"]/g, "")}%`;
      q = q.or(`full_name.ilike."${like}",email.ilike."${like}",subject.ilike."${like}"`);
    }
    const { data: rows, count, error } = await q;
    if (error) throw new Error("Could not load inquiries.");
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const getInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "inquiries.read");
    const { data: row, error } = await context.supabase
      .from("inquiries")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error("Inquiry not found.");
    return row;
  });

export const updateInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inquiryUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "inquiries.update");
    const { id, ...patch } = data;
    const updatePayload = { ...patch, updated_at: new Date().toISOString() } as Record<
      string,
      string | null | undefined
    >;
    const { error } = await context.supabase
      .from("inquiries")
      .update(updatePayload as never)
      .eq("id", id);
    if (error) throw new Error("Could not update the inquiry.");
    await logAudit(context, "update_inquiry", "inquiries", id, { status: data.status });
    return { ok: true };
  });

// ============ PRAYER REQUESTS (confidential) ============

export const listPrayerRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listQuerySchema.parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "prayer_requests.read");
    const { status, page, pageSize } = data;
    let q = context.supabase
      .from("prayer_requests")
      .select("id, submitter_name, status, is_private, assigned_to, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (status) q = q.eq("status", status as "new");
    const { data: rows, count, error } = await q;
    if (error) throw new Error("Could not load prayer requests.");
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const getPrayerRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "prayer_requests.read");
    const { data: row, error } = await context.supabase
      .from("prayer_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error("Prayer request not found.");
    // Log access without recording the content itself.
    await logAudit(context, "view_prayer_request", "prayer_requests", data.id);
    return row;
  });

export const updatePrayerRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => prayerUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "prayer_requests.update");
    const { id, ...patch } = data;
    const updatePayload = { ...patch, updated_at: new Date().toISOString() } as Record<
      string,
      string | null | undefined
    >;
    const { error } = await context.supabase
      .from("prayer_requests")
      .update(updatePayload as never)
      .eq("id", id);
    if (error) throw new Error("Could not update the prayer request.");
    await logAudit(context, "update_prayer_request", "prayer_requests", id, {
      status: data.status,
    });
    return { ok: true };
  });
