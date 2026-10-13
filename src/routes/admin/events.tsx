import { createFileRoute } from "@tanstack/react-router";
import { CollectionManager, statusField, type FieldDef, type ColumnDef } from "@/components/admin/CollectionManager";
import { listEvents, createEvent, updateEvent, deleteEvent } from "@/lib/admin/content.functions";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/events")({
  head: () => ({ meta: [{ title: `Events — ${church.shortName} Admin` }] }),
  component: EventsAdmin,
});

const fields: FieldDef[] = [
  { name: "title", label: "Event title", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true, help: "Unique web identifier, e.g. 'easter-convention-2026'." },
  { name: "starts_at", label: "Starts", type: "datetime-local", required: true },
  { name: "ends_at", label: "Ends", type: "datetime-local" },
  { name: "venue", label: "Venue", type: "text", placeholder: "e.g. Main Auditorium" },
  { name: "online_url", label: "Online link (if any)", type: "url" },
  { name: "registration_url", label: "Registration link (if any)", type: "url" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "featured_image_url", label: "Image URL", type: "url", help: "Upload images in the Media Library, then paste the URL here." },
  { name: "is_featured", label: "Feature this event", type: "checkbox" },
  statusField,
];

const columns: ColumnDef[] = [
  { key: "title", label: "Title" },
  { key: "starts_at", label: "Date", render: (r) => (r.starts_at ? new Date(String(r.starts_at)).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—") },
  { key: "venue", label: "Venue", render: (r) => String(r.venue ?? "—") },
];

function EventsAdmin() {
  return (
    <CollectionManager
      title="Events"
      description="Publish upcoming services, programmes, and special events."
      queryKey="events"
      fields={fields}
      columns={columns}
      listFn={listEvents}
      createFn={createEvent}
      updateFn={updateEvent}
      deleteFn={deleteEvent}
      emptyText="No events yet. Add one when a date is confirmed."
    />
  );
}
