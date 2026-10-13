import { createFileRoute } from "@tanstack/react-router";
import { CollectionManager, statusField, type FieldDef, type ColumnDef } from "@/components/admin/CollectionManager";
import { listSermons, createSermon, updateSermon, deleteSermon } from "@/lib/admin/content.functions";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/sermons")({
  head: () => ({ meta: [{ title: `Sermons — ${church.shortName} Admin` }] }),
  component: SermonsAdmin,
});

const fields: FieldDef[] = [
  { name: "title", label: "Sermon title", type: "text", required: true },
  { name: "speaker", label: "Speaker", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true, help: "Unique web identifier, e.g. 'faith-that-bears-fruit'." },
  { name: "sermon_date", label: "Date preached", type: "date" },
  { name: "passage", label: "Scripture passage", type: "text", placeholder: "e.g. John 15:1-8" },
  { name: "topic", label: "Topic / series", type: "text" },
  { name: "description", label: "Summary", type: "textarea" },
  { name: "video_url", label: "Video URL", type: "url", help: "Link to a hosted video (e.g. YouTube). No livestream is embedded on the site." },
  { name: "audio_url", label: "Audio URL", type: "url" },
  { name: "thumbnail_url", label: "Thumbnail image URL", type: "url", help: "Upload images in the Media Library, then paste the URL here." },
  { name: "is_featured", label: "Feature this sermon", type: "checkbox" },
  statusField,
];

const columns: ColumnDef[] = [
  { key: "title", label: "Title" },
  { key: "speaker", label: "Speaker" },
  { key: "sermon_date", label: "Date", render: (r) => (r.sermon_date ? String(r.sermon_date) : "—") },
];

function SermonsAdmin() {
  return (
    <CollectionManager
      title="Sermons"
      description="Publish sermon recordings, summaries, and scripture passages."
      queryKey="sermons"
      fields={fields}
      columns={columns}
      listFn={listSermons}
      createFn={createSermon}
      updateFn={updateSermon}
      deleteFn={deleteSermon}
      emptyText="No sermons yet. Add the first one when a recording or summary is ready."
    />
  );
}
