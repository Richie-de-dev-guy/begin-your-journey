import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission, logAudit } from "./guard";
import {
  pageSchema,
  sermonSchema,
  eventSchema,
  announcementSchema,
  ministrySchema,
  idSchema,
  listQuerySchema,
} from "./schemas";

type Table = "pages" | "sermons" | "events" | "announcements" | "ministries";

const CONFIG: Record<
  Table,
  { permission: string; searchColumns: string[]; orderBy: string; schema: z.ZodTypeAny }
> = {
  pages: {
    permission: "content.read",
    searchColumns: ["title", "slug"],
    orderBy: "updated_at",
    schema: pageSchema,
  },
  sermons: {
    permission: "sermons.manage",
    searchColumns: ["title", "speaker"],
    orderBy: "sermon_date",
    schema: sermonSchema,
  },
  events: {
    permission: "events.manage",
    searchColumns: ["title", "venue"],
    orderBy: "starts_at",
    schema: eventSchema,
  },
  announcements: {
    permission: "announcements.manage",
    searchColumns: ["title"],
    orderBy: "created_at",
    schema: announcementSchema,
  },
  ministries: {
    permission: "ministries.manage",
    searchColumns: ["name"],
    orderBy: "display_order",
    schema: ministrySchema,
  },
};

const writePermission: Record<Table, string> = {
  pages: "content.update",
  sermons: "sermons.manage",
  events: "events.manage",
  announcements: "announcements.manage",
  ministries: "ministries.manage",
};

const tableSchema = z.enum(["pages", "sermons", "events", "announcements", "ministries"]);

function makeList(table: Table) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((input: unknown) =>
      z.object({ table: tableSchema, query: listQuerySchema }).parse(input),
    )
    .handler(async ({ data, context }) => {
      const cfg = CONFIG[data.table];
      await requirePermission(context, cfg.permission);
      const { search, status, page, pageSize } = data.query;
      let q = context.supabase
        .from(data.table)
        .select("*", { count: "exact" })
        .order(cfg.orderBy, { ascending: false, nullsFirst: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      if (status && ["draft", "published", "archived"].includes(status)) {
        q = q.eq("status", status as "draft" | "published" | "archived");
      }
      if (search) {
        const like = `%${search.replace(/[%_,()"]/g, "")}%`;
        q = q.or(cfg.searchColumns.map((c) => `${c}.ilike."${like}"`).join(","));
      }
      const { data: rows, count, error } = await q;
      if (error) throw new Error("Could not load records.");
      return { rows: rows ?? [], total: count ?? 0, page, pageSize };
    });
}

function makeGet(table: Table) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((input: unknown) =>
      z.object({ table: tableSchema, id: z.string().uuid() }).parse(input),
    )
    .handler(async ({ data, context }) => {
      await requirePermission(context, CONFIG[data.table].permission);
      const { data: row, error } = await context.supabase
        .from(data.table)
        .select("*")
        .eq("id", data.id)
        .single();
      if (error) throw new Error("Record not found.");
      return row;
    });
}

function makeCreate(table: Table) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((input: unknown) => {
      const parsed = z
        .object({ table: tableSchema, values: z.record(z.string(), z.unknown()) })
        .parse(input);
      const values = CONFIG[parsed.table].schema.parse(parsed.values);
      return { table: parsed.table, values };
    })
    .handler(async ({ data, context }) => {
      const perm = data.table === "pages" ? "content.create" : writePermission[data.table];
      await requirePermission(context, perm);
      const values = {
        ...data.values,
        created_by: context.userId,
        published_at:
          (data.values as Record<string, unknown> & { status?: string }).status === "published"
            ? new Date().toISOString()
            : null,
      } as Record<string, unknown>;
      const { data: row, error } = await context.supabase
        .from(data.table)
        .insert(values as never)
        .select()
        .single();
      if (error) {
        if (error.code === "23505")
          throw new Error("That slug is already in use. Choose a different one.");
        throw new Error("Could not save the record.");
      }
      await logAudit(context, `create_${data.table}`, data.table, row.id, {
        title: typeof values["title"] === "string" ? values["title"] : null,
      });
      return row;
    });
}

function makeUpdate(table: Table) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((input: unknown) => {
      const parsed = z
        .object({
          table: tableSchema,
          id: z.string().uuid(),
          values: z.record(z.string(), z.unknown()),
        })
        .parse(input);
      const values = CONFIG[parsed.table].schema.parse(parsed.values);
      return { table: parsed.table, id: parsed.id, values };
    })
    .handler(async ({ data, context }) => {
      await requirePermission(context, writePermission[data.table]);
      const values = data.values as Record<string, unknown> & { status?: string };
      const patch: Record<string, unknown> = { ...values, updated_at: new Date().toISOString() };
      if (values.status === "published") patch["published_at"] = new Date().toISOString();
      const { data: row, error } = await context.supabase
        .from(data.table)
        .update(patch as never)
        .eq("id", data.id)
        .select()
        .single();
      if (error) {
        if (error.code === "23505")
          throw new Error("That slug is already in use. Choose a different one.");
        throw new Error("Could not update the record.");
      }
      await logAudit(context, `update_${data.table}`, data.table, data.id, {
        status: typeof values.status === "string" ? values.status : null,
      });
      return row;
    });
}

function makeRemove(table: Table) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((input: unknown) =>
      z.object({ table: tableSchema, id: z.string().uuid() }).parse(input),
    )
    .handler(async ({ data, context }) => {
      const perm = data.table === "pages" ? "content.publish" : writePermission[data.table];
      await requirePermission(context, perm);
      const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
      if (error) throw new Error("Could not delete the record.");
      await logAudit(context, `delete_${data.table}`, data.table, data.id);
      return { ok: true };
    });
}

export const listPages = makeList("pages");
export const getPage = makeGet("pages");
export const createPage = makeCreate("pages");
export const updatePage = makeUpdate("pages");
export const deletePage = makeRemove("pages");

export const listSermons = makeList("sermons");
export const getSermon = makeGet("sermons");
export const createSermon = makeCreate("sermons");
export const updateSermon = makeUpdate("sermons");
export const deleteSermon = makeRemove("sermons");

export const listEvents = makeList("events");
export const getEvent = makeGet("events");
export const createEvent = makeCreate("events");
export const updateEvent = makeUpdate("events");
export const deleteEvent = makeRemove("events");

export const listAnnouncements = makeList("announcements");
export const getAnnouncement = makeGet("announcements");
export const createAnnouncement = makeCreate("announcements");
export const updateAnnouncement = makeUpdate("announcements");
export const deleteAnnouncement = makeRemove("announcements");

export const listMinistries = makeList("ministries");
export const getMinistry = makeGet("ministries");
export const createMinistry = makeCreate("ministries");
export const updateMinistry = makeUpdate("ministries");
export const deleteMinistry = makeRemove("ministries");

/** Dashboard overview counts from real records. */
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "dashboard.view");
    const s = context.supabase;
    const countPublished = async (table: Table) => {
      const { count, error } = await s
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("status", "published");
      if (error) throw new Error(`Could not load the ${table} dashboard count.`);
      return count ?? 0;
    };
    const now = new Date().toISOString();

    const [sermons, events, upcoming, announcements, ministries, pages] = await Promise.all([
      countPublished("sermons"),
      countPublished("events"),
      (async () => {
        const { count, error } = await s
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .gte("starts_at", now);
        if (error) throw new Error("Could not load the upcoming-events dashboard count.");
        return count ?? 0;
      })(),
      countPublished("announcements"),
      countPublished("ministries"),
      countPublished("pages"),
    ]);

    // Sensitive modules: only counted when the caller may read them.
    let inquiries: number | null = null;
    let prayerRequests: number | null = null;
    const { data: canInquiries, error: inquiryPermissionError } = await s.rpc("has_permission", {
      _user_id: context.userId,
      _permission: "inquiries.read",
    });
    const { data: canPrayer, error: prayerPermissionError } = await s.rpc("has_permission", {
      _user_id: context.userId,
      _permission: "prayer_requests.read",
    });
    if (inquiryPermissionError || prayerPermissionError) {
      throw new Error("Could not verify access to confidential dashboard counts.");
    }
    if (canInquiries) {
      const { count: c, error } = await s
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      if (error) throw new Error("Could not load the new-inquiries dashboard count.");
      inquiries = c ?? 0;
    }
    if (canPrayer) {
      const { count: c, error } = await s
        .from("prayer_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      if (error) throw new Error("Could not load the new-prayer-requests dashboard count.");
      prayerRequests = c ?? 0;
    }

    const { data: recentAudit, error: auditError } = await s
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    if (auditError) throw new Error("Could not load recent audit activity.");

    return {
      sermons,
      events,
      upcoming,
      announcements,
      ministries,
      pages,
      inquiries,
      prayerRequests,
      recentActivity: recentAudit ?? [],
    };
  });

export { idSchema };
