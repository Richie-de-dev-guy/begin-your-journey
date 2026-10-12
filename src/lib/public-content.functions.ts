import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { publicInquirySchema, publicPrayerSchema } from "./admin/schemas";

/**
 * Public read-only client for published content (SSR-safe, no session).
 * Opaque sb_ keys are not JWTs — strip the bearer and send only apikey.
 */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listPublishedSermons = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("sermons")
    .select("id, title, slug, speaker, description, passage, topic, sermon_date, thumbnail_url, video_url, audio_url, is_featured")
    .eq("status", "published")
    .order("sermon_date", { ascending: false, nullsFirst: false });
  if (error) return [];
  return data ?? [];
});

export const listPublishedEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("events")
    .select("id, title, slug, description, featured_image_url, starts_at, ends_at, timezone, venue, online_url, registration_url, is_featured")
    .eq("status", "published")
    .order("starts_at", { ascending: true });
  if (error) return [];
  return data ?? [];
});

export const listPublishedMinistries = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("ministries")
    .select("id, name, slug, description, featured_image_url, schedule, contact, display_order")
    .eq("status", "published")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) return [];
  return data ?? [];
});

export const listLiveAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("announcements")
    .select("id, title, body, image_url, published_at, priority, is_featured")
    .eq("status", "published")
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) return [];
  return data ?? [];
});

/** Public contact-form submission -> inquiries table. Validated server-side. */
export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => publicInquirySchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await publicClient().from("inquiries").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      subject: data.subject,
      message: data.message,
    });
    if (error) throw new Error("Your message could not be sent. Please try again or email us directly.");
    return { ok: true };
  });

/** Public prayer-request submission -> confidential table. */
export const submitPrayerRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => publicPrayerSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await publicClient().from("prayer_requests").insert({
      message: data.message,
      submitter_name: data.submitter_name ?? null,
      contact: data.contact ?? null,
      is_private: data.is_private,
    });
    if (error) throw new Error("Your request could not be sent. Please try again.");
    return { ok: true };
  });
