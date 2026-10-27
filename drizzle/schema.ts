import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { desc, sql } from "drizzle-orm";

const anon = pgRole("anon").existing();
const authenticated = pgRole("authenticated").existing();

export const appRole = pgEnum("app_role", [
  "super_admin",
  "pastor",
  "content_editor",
  "event_coordinator",
  "support_staff",
]);
export const contentStatus = pgEnum("content_status", ["draft", "published", "archived"]);
export const inquiryStatus = pgEnum("inquiry_status", [
  "new",
  "in_progress",
  "contacted",
  "resolved",
  "archived",
]);
export const prayerStatus = pgEnum("prayer_status", [
  "new",
  "under_prayer",
  "follow_up",
  "completed",
  "archived",
]);

const hasPermission = (permission: string) =>
  sql`public.has_permission(auth.uid(), ${sql.raw(`'${permission}'`)})`;

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    fullName: text("full_name"),
    email: text("email"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("users read own profile", {
      for: "select",
      to: authenticated,
      using: sql`${table.id} = auth.uid() or ${hasPermission("users.manage")}`,
    }),
    pgPolicy("users update own profile", {
      for: "update",
      to: authenticated,
      using: sql`${table.id} = auth.uid()`,
      withCheck: sql`${table.id} = auth.uid() and ${table.isActive} = (select is_active from public.profiles where id = auth.uid())`,
    }),
    pgPolicy("admins update profiles", {
      for: "update",
      to: authenticated,
      using: hasPermission("users.manage"),
    }),
  ],
).enableRLS();

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    role: appRole("role").notNull(),
  },
  (table) => [
    unique("user_roles_user_id_role_unique").on(table.userId, table.role),
    index("idx_user_roles_user").on(table.userId),
    pgPolicy("users read own roles", {
      for: "select",
      to: authenticated,
      using: sql`${table.userId} = auth.uid() or ${hasPermission("users.manage")}`,
    }),
  ],
).enableRLS();

export const userPermissions = pgTable(
  "user_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    permission: text("permission").notNull(),
  },
  (table) => [
    unique("user_permissions_user_id_permission_unique").on(table.userId, table.permission),
    pgPolicy("users read own permission overrides", {
      for: "select",
      to: authenticated,
      using: sql`${table.userId} = auth.uid() or ${hasPermission("users.manage")}`,
    }),
  ],
).enableRLS();

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: appRole("role").notNull(),
    permission: text("permission").notNull(),
  },
  (table) => [
    unique("role_permissions_role_permission_unique").on(table.role, table.permission),
    pgPolicy("authenticated read role permissions", {
      for: "select",
      to: authenticated,
      using: sql`true`,
    }),
  ],
).enableRLS();

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_created").on(table.createdAt),
    pgPolicy("audit read by authorized", {
      for: "select",
      to: authenticated,
      using: hasPermission("audit_logs.read"),
    }),
    pgPolicy("audit insert own", {
      for: "insert",
      to: authenticated,
      withCheck: sql`${table.actorId} = auth.uid()`,
    }),
  ],
).enableRLS();

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    body: text("body").notNull().default(""),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    featuredImageUrl: text("featured_image_url"),
    status: contentStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pages_status").on(table.status),
    pgPolicy("public reads published pages", {
      for: "select",
      to: anon,
      using: sql`${table.status} = 'published'`,
    }),
    pgPolicy("staff read pages", {
      for: "select",
      to: authenticated,
      using: hasPermission("content.read"),
    }),
    pgPolicy("staff create pages", {
      for: "insert",
      to: authenticated,
      withCheck: hasPermission("content.create"),
    }),
    pgPolicy("staff update pages", {
      for: "update",
      to: authenticated,
      using: hasPermission("content.update"),
    }),
    pgPolicy("staff delete pages", {
      for: "delete",
      to: authenticated,
      using: hasPermission("content.publish"),
    }),
  ],
).enableRLS();

export const sermons = pgTable(
  "sermons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    speaker: text("speaker").notNull().default(""),
    description: text("description").notNull().default(""),
    passage: text("passage"),
    topic: text("topic"),
    sermonDate: date("sermon_date"),
    thumbnailUrl: text("thumbnail_url"),
    videoUrl: text("video_url"),
    audioUrl: text("audio_url"),
    isFeatured: boolean("is_featured").notNull().default(false),
    status: contentStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_sermons_status_date").on(table.status, desc(table.sermonDate)),
    pgPolicy("public reads published sermons", {
      for: "select",
      to: anon,
      using: sql`${table.status} = 'published'`,
    }),
    ...["select", "insert", "update", "delete"].map((operation) =>
      pgPolicy(`staff manage sermons ${operation}`, {
        for: operation as "select" | "insert" | "update" | "delete",
        to: authenticated,
        ...(operation === "insert"
          ? { withCheck: hasPermission("sermons.manage") }
          : { using: hasPermission("sermons.manage") }),
      }),
    ),
  ],
).enableRLS();

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    featuredImageUrl: text("featured_image_url"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    timezone: text("timezone").notNull().default("Africa/Lagos"),
    venue: text("venue"),
    onlineUrl: text("online_url"),
    registrationUrl: text("registration_url"),
    isFeatured: boolean("is_featured").notNull().default(false),
    status: contentStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_events_status_starts").on(table.status, table.startsAt),
    pgPolicy("public reads published events", {
      for: "select",
      to: anon,
      using: sql`${table.status} = 'published'`,
    }),
    ...["select", "insert", "update", "delete"].map((operation) =>
      pgPolicy(`staff manage events ${operation}`, {
        for: operation as "select" | "insert" | "update" | "delete",
        to: authenticated,
        ...(operation === "insert"
          ? { withCheck: hasPermission("events.manage") }
          : { using: hasPermission("events.manage") }),
      }),
    ),
  ],
).enableRLS();

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    priority: integer("priority").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    status: contentStatus("status").notNull().default("draft"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_announcements_status").on(table.status, table.expiresAt),
    pgPolicy("public reads live announcements", {
      for: "select",
      to: anon,
      using: sql`${table.status} = 'published' and (${table.expiresAt} is null or ${table.expiresAt} > now())`,
    }),
    ...["select", "insert", "update", "delete"].map((operation) =>
      pgPolicy(`staff manage announcements ${operation}`, {
        for: operation as "select" | "insert" | "update" | "delete",
        to: authenticated,
        ...(operation === "insert"
          ? { withCheck: hasPermission("announcements.manage") }
          : { using: hasPermission("announcements.manage") }),
      }),
    ),
  ],
).enableRLS();

export const ministries = pgTable(
  "ministries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    featuredImageUrl: text("featured_image_url"),
    schedule: text("schedule"),
    contact: text("contact"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    status: contentStatus("status").notNull().default("draft"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ministries_order").on(table.displayOrder),
    pgPolicy("public reads published ministries", {
      for: "select",
      to: anon,
      using: sql`${table.status} = 'published' and ${table.isActive} = true`,
    }),
    ...["select", "insert", "update", "delete"].map((operation) =>
      pgPolicy(`staff manage ministries ${operation}`, {
        for: operation as "select" | "insert" | "update" | "delete",
        to: authenticated,
        ...(operation === "insert"
          ? { withCheck: hasPermission("ministries.manage") }
          : { using: hasPermission("ministries.manage") }),
      }),
    ),
  ],
).enableRLS();

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fileName: text("file_name").notNull(),
    storagePath: text("storage_path").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
    altText: text("alt_text"),
    width: integer("width"),
    height: integer("height"),
    uploadedBy: uuid("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("public reads media metadata", {
      for: "select",
      to: anon,
      using: sql`true`,
    }),
    ...["select", "insert", "update", "delete"].map((operation) =>
      pgPolicy(`staff manage media ${operation}`, {
        for: operation as "select" | "insert" | "update" | "delete",
        to: authenticated,
        ...(operation === "insert"
          ? { withCheck: hasPermission("media.manage") }
          : { using: hasPermission("media.manage") }),
      }),
    ),
  ],
).enableRLS();

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject").notNull().default(""),
    message: text("message").notNull(),
    status: inquiryStatus("status").notNull().default("new"),
    assignedTo: uuid("assigned_to"),
    internalNotes: text("internal_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_inquiries_status").on(table.status, desc(table.createdAt)),
    pgPolicy("anyone can submit inquiry", {
      for: "insert",
      to: anon,
      withCheck: sql`true`,
    }),
    pgPolicy("staff read inquiries", {
      for: "select",
      to: authenticated,
      using: hasPermission("inquiries.read"),
    }),
    pgPolicy("staff update inquiries", {
      for: "update",
      to: authenticated,
      using: hasPermission("inquiries.update"),
    }),
  ],
).enableRLS();

export const prayerRequests = pgTable(
  "prayer_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    message: text("message").notNull(),
    submitterName: text("submitter_name"),
    contact: text("contact"),
    isPrivate: boolean("is_private").notNull().default(true),
    status: prayerStatus("status").notNull().default("new"),
    assignedTo: uuid("assigned_to"),
    internalNotes: text("internal_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_prayer_status").on(table.status, desc(table.createdAt)),
    pgPolicy("anyone can submit prayer request", {
      for: "insert",
      to: anon,
      withCheck: sql`true`,
    }),
    pgPolicy("authorized read prayer requests", {
      for: "select",
      to: authenticated,
      using: hasPermission("prayer_requests.read"),
    }),
    pgPolicy("authorized update prayer requests", {
      for: "update",
      to: authenticated,
      using: hasPermission("prayer_requests.update"),
    }),
  ],
).enableRLS();

export const staffInvitations = pgTable(
  "staff_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    role: appRole("role").notNull(),
    invitedBy: uuid("invited_by"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("admins manage invitations", {
      for: "all",
      to: authenticated,
      using: hasPermission("users.manage"),
      withCheck: hasPermission("users.manage"),
    }),
  ],
).enableRLS();
