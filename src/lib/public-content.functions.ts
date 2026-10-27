import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { publicInquirySchema, publicPrayerSchema } from "./admin/schemas";

/**
 * Public read-only client for published content (SSR-safe, no session).
 * Opaque sb_ keys are not JWTs — strip the bearer and send only apikey.
 */
function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}.`);
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listPublishedSermons = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("sermons")
    .select(
      "id, title, slug, speaker, description, passage, topic, sermon_date, thumbnail_url, video_url, audio_url, is_featured",
    )
    .eq("status", "published")
    .order("sermon_date", { ascending: false, nullsFirst: false });
  if (error) {
    console.error("[Public content] Could not load published sermons.", error);
    throw new Error("Could not load published sermons.");
  }
  return data ?? [];
});

export const listPublishedEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("events")
    .select(
      "id, title, slug, description, featured_image_url, starts_at, ends_at, timezone, venue, online_url, registration_url, is_featured",
    )
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) {
    console.error("[Public content] Could not load published events.", error);
    throw new Error("Could not load published events.");
  }
  return data ?? [];
});

export const listPublishedMinistries = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("ministries")
    .select("id, name, slug, description, featured_image_url, schedule, contact, display_order")
    .eq("status", "published")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("[Public content] Could not load published ministries.", error);
    throw new Error("Could not load published ministries.");
  }
  return data ?? [];
});

export const listLiveAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("announcements")
    .select("id, title, body, image_url, published_at, priority, is_featured")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) {
    console.error("[Public content] Could not load live announcements.", error);
    throw new Error("Could not load live announcements.");
  }
  return data ?? [];
});

export const getPublishedPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z
          .string()
          .min(2)
          .max(120)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: page, error } = await publicClient()
      .from("pages")
      .select("title, slug, body, seo_title, seo_description")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) {
      console.error("[Public content] Could not load the published CMS page.", error);
      throw new Error("Could not load the published page.");
    }
    return page;
  });

/** Public contact-form submission -> inquiries table. Validated server-side. */
export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => publicInquirySchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await publicClient()
      .from("inquiries")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone ?? null,
        subject: data.subject,
        message: data.message,
      });
    if (error) {
      console.error("[Public form] Could not save an enquiry.", error);
      throw new Error("Your message could not be sent. Please try again or email us directly.");
    }
    return { ok: true };
  });

/** Public prayer-request submission -> confidential table. */
export const submitPrayerRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => publicPrayerSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await publicClient()
      .from("prayer_requests")
      .insert({
        message: data.message,
        submitter_name: data.submitter_name ?? null,
        contact: data.contact ?? null,
        is_private: data.is_private,
      });
    if (error) {
      console.error("[Public form] Could not save a prayer request.", error);
      throw new Error("Your request could not be sent. Please try again.");
    }
    return { ok: true };
  });
