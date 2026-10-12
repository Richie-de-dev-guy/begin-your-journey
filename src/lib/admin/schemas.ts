import { z } from "zod";

export const statusEnum = z.enum(["draft", "published", "archived"]);

const slug = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens");

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Must be a valid http(s) URL")
  .optional()
  .transform((v) => (v ? v : null));

export const pageSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  body: z.string().max(50_000).default(""),
  seo_title: z.string().trim().max(200).optional().nullable(),
  seo_description: z.string().trim().max(300).optional().nullable(),
  featured_image_url: optionalUrl,
  status: statusEnum.default("draft"),
});

export const sermonSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  speaker: z.string().trim().max(120).default(""),
  description: z.string().max(10_000).default(""),
  passage: z.string().trim().max(200).optional().nullable(),
  topic: z.string().trim().max(120).optional().nullable(),
  sermon_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional().nullable(),
  thumbnail_url: optionalUrl,
  video_url: optionalUrl,
  audio_url: optionalUrl,
  is_featured: z.boolean().default(false),
  status: statusEnum.default("draft"),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    slug,
    description: z.string().max(20_000).default(""),
    featured_image_url: optionalUrl,
    starts_at: z.string().min(4, "Start date/time is required"),
    ends_at: z.string().optional().nullable(),
    timezone: z.string().trim().max(60).default("Africa/Lagos"),
    venue: z.string().trim().max(300).optional().nullable(),
    online_url: optionalUrl,
    registration_url: optionalUrl,
    is_featured: z.boolean().default(false),
    status: statusEnum.default("draft"),
  })
  .refine((e) => !e.ends_at || new Date(e.ends_at) >= new Date(e.starts_at), {
    message: "End time cannot be before the start time",
    path: ["ends_at"],
  });

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().max(10_000).default(""),
  image_url: optionalUrl,
  expires_at: z.string().optional().nullable(),
  priority: z.number().int().min(0).max(100).default(0),
  is_featured: z.boolean().default(false),
  status: statusEnum.default("draft"),
});

export const ministrySchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug,
  description: z.string().max(10_000).default(""),
  featured_image_url: optionalUrl,
  schedule: z.string().trim().max(300).optional().nullable(),
  contact: z.string().trim().max(300).optional().nullable(),
  display_order: z.number().int().min(0).max(1000).default(0),
  is_active: z.boolean().default(true),
  status: statusEnum.default("draft"),
});

export const inquiryUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "in_progress", "contacted", "resolved", "archived"]),
  internal_notes: z.string().max(5000).optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const prayerUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "under_prayer", "follow_up", "completed", "archived"]),
  internal_notes: z.string().max(5000).optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const publicInquirySchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional().nullable(),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(2000),
});

export const publicPrayerSchema = z.object({
  message: z.string().trim().min(5).max(2000),
  submitter_name: z.string().trim().max(100).optional().nullable(),
  contact: z.string().trim().max(200).optional().nullable(),
  is_private: z.boolean().default(true),
});

export const inviteStaffSchema = z.object({
  email: z.string().trim().email().max(255),
  role: z.enum(["super_admin", "pastor", "content_editor", "event_coordinator", "support_staff"]),
});

export const mediaMetaSchema = z.object({
  id: z.string().uuid(),
  alt_text: z.string().trim().max(300).optional().nullable(),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.string().trim().max(40).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
