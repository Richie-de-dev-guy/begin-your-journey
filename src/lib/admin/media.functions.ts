import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission, logAudit } from "./guard";
import { mediaMetaSchema, listQuerySchema } from "./schemas";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const listMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listQuerySchema.parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "media.manage");
    const { search, page, pageSize } = data;
    let q = context.supabase
      .from("media_assets")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (search) q = q.ilike("file_name", `%${search.replace(/[%_]/g, "")}%`);
    const { data: rows, count, error } = await q;
    if (error) throw new Error("Could not load media.");
    const base = process.env["VITE_SUPABASE_URL"] ?? "";
    return {
      rows: (rows ?? []).map((r) => ({
        ...r,
        public_url: `${base}/storage/v1/object/public/media/${r.storage_path}`,
      })),
      total: count ?? 0,
      page,
      pageSize,
    };
  });

/**
 * Upload an image. Validated server-side: type allow-list, size limit,
 * server-generated safe storage name. Browser MIME is not trusted alone —
 * the magic bytes are checked.
 */
export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Invalid upload.");
    return input;
  })
  .handler(async ({ data: form, context }) => {
    await requirePermission(context, "media.manage");
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("No file provided.");
    if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("Images must be between 1 byte and 5 MB.");

    const buffer = new Uint8Array(await file.arrayBuffer());
    const mime = sniffImageMime(buffer);
    if (!mime || !ALLOWED[mime]) {
      throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
    }
    const ext = ALLOWED[mime];
    const storagePath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await context.supabase.storage
      .from("media")
      .upload(storagePath, buffer, { contentType: mime, upsert: false });
    if (uploadError) throw new Error("The upload failed. Please try again.");

    const alt = form.get("alt_text");
    const { data: row, error } = await context.supabase
      .from("media_assets")
      .insert({
        file_name: (file.name || `image.${ext}`).slice(0, 200),
        storage_path: storagePath,
        mime_type: mime,
        size_bytes: file.size,
        alt_text: typeof alt === "string" && alt.trim() ? alt.trim().slice(0, 300) : null,
        uploaded_by: context.userId,
      })
      .select()
      .single();
    if (error) {
      await context.supabase.storage.from("media").remove([storagePath]);
      throw new Error("Could not record the upload.");
    }
    await logAudit(context, "upload_media", "media_assets", row.id, { file_name: row.file_name });
    return row;
  });

export const updateMediaMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => mediaMetaSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "media.manage");
    const { error } = await context.supabase
      .from("media_assets")
      .update({ alt_text: data.alt_text ?? null })
      .eq("id", data.id);
    if (error) throw new Error("Could not update the image details.");
    return { ok: true };
  });

/** Delete only when the asset is not referenced by any content record. */
export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "media.manage");
    const { data: asset, error: findError } = await context.supabase
      .from("media_assets")
      .select("*")
      .eq("id", data.id)
      .single();
    if (findError || !asset) throw new Error("Image not found.");

    const base = process.env["VITE_SUPABASE_URL"] ?? "";
    const publicUrl = `${base}/storage/v1/object/public/media/${asset.storage_path}`;
    const refs = await countReferences(context.supabase, publicUrl);
    if (refs > 0) {
      throw new Error("This image is still used by published content and cannot be deleted.");
    }

    await context.supabase.storage.from("media").remove([asset.storage_path]);
    const { error } = await context.supabase.from("media_assets").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete the image.");
    await logAudit(context, "delete_media", "media_assets", data.id, { file_name: asset.file_name });
    return { ok: true };
  });

async function countReferences(
  supabase: Parameters<typeof requirePermission>[0]["supabase"],
  url: string,
): Promise<number> {
  const checks: PromiseLike<{ count: number | null }>[] = [
    supabase.from("pages").select("id", { count: "exact", head: true }).eq("featured_image_url", url),
    supabase.from("sermons").select("id", { count: "exact", head: true }).eq("thumbnail_url", url),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("featured_image_url", url),
    supabase.from("announcements").select("id", { count: "exact", head: true }).eq("image_url", url),
    supabase.from("ministries").select("id", { count: "exact", head: true }).eq("featured_image_url", url),
  ];
  const results = await Promise.all(checks);
  return results.reduce((sum, r) => sum + (r.count ?? 0), 0);
}

/** Magic-byte sniffing for allowed image types. */
function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}
