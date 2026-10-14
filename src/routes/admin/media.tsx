import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Trash2, Copy, Check } from "lucide-react";
import { listMedia, uploadMedia, deleteMedia } from "@/lib/admin/media.functions";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/media")({
  head: () => ({ meta: [{ title: `Media Library — ${church.shortName} Admin` }] }),
  component: MediaAdmin,
});

type MediaRow = {
  id: string;
  file_name: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string | null;
  created_at: string;
};

function formatSize(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function MediaAdmin() {
  const queryClient = useQueryClient();
  const list = useServerFn(listMedia);
  const upload = useServerFn(uploadMedia);
  const remove = useServerFn(deleteMedia);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "media"],
    queryFn: () => list({ data: { page: 1, pageSize: 60 } }),
  });
  const items = (data?.items ?? []) as MediaRow[];

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));
        await upload({ data: { fileName: file.name, mimeType: file.type, bytes } });
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^.*?: /, "") : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onDelete = async (row: MediaRow) => {
    if (!window.confirm(`Delete "${row.file_name}"? Pages using this image will lose it.`)) return;
    try {
      await remove({ data: { id: row.id } });
      await queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    } catch (err) {
      window.alert(err instanceof Error ? err.message.replace(/^.*?: /, "") : "Delete failed.");
    }
  };

  const copyUrl = async (row: MediaRow) => {
    await navigator.clipboard.writeText(row.public_url);
    setCopied(row.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload images (JPEG, PNG, WebP, GIF — max 5 MB), then copy the image URL into a page, sermon, event, or ministry.
          </p>
        </div>
        <button onClick={() => fileInput.current?.click()} disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60">
          <Upload className="h-4 w-4" aria-hidden /> {busy ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple
          className="hidden" onChange={(e) => onUpload(e.target.files)} aria-label="Upload images" />
      </div>

      {error && <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && (
        <p className="text-sm text-destructive">Could not load the media library. You may not have permission to view it.</p>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          No images uploaded yet.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((row) => (
          <figure key={row.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <img src={row.public_url} alt={row.alt_text ?? row.file_name} className="h-40 w-full object-cover" loading="lazy" />
            <figcaption className="space-y-2 p-3">
              <p className="truncate text-sm font-medium" title={row.file_name}>{row.file_name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(row.size_bytes)}</p>
              <div className="flex gap-1">
                <button onClick={() => copyUrl(row)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted">
                  {copied === row.id ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                  {copied === row.id ? "Copied" : "Copy URL"}
                </button>
                <button onClick={() => onDelete(row)} aria-label={`Delete ${row.file_name}`}
                  className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
