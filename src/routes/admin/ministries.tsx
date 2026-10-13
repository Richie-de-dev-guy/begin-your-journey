import { createFileRoute } from "@tanstack/react-router";
import { CollectionManager, statusField, type FieldDef, type ColumnDef } from "@/components/admin/CollectionManager";
import { listMinistries, createMinistry, updateMinistry, deleteMinistry } from "@/lib/admin/content.functions";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/ministries")({
  head: () => ({ meta: [{ title: `Ministries — ${church.shortName} Admin` }] }),
  component: MinistriesAdmin,
});

const fields: FieldDef[] = [
  { name: "name", label: "Ministry name", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true, help: "Unique web identifier, e.g. 'youth'." },
  { name: "description", label: "Description", type: "textarea" },
  { name: "schedule", label: "Meeting schedule", type: "text", placeholder: "e.g. Saturdays, 4:00 PM" },
  { name: "contact", label: "Contact person / details", type: "text" },
  { name: "featured_image_url", label: "Image URL", type: "url", help: "Upload images in the Media Library, then paste the URL here." },
  { name: "display_order", label: "Display order (lower shows first)", type: "number" },
  { name: "is_active", label: "Ministry is currently active", type: "checkbox" },
  statusField,
];

const columns: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "schedule", label: "Schedule", render: (r) => String(r.schedule ?? "—") },
  { key: "is_active", label: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
];

function MinistriesAdmin() {
  return (
    <CollectionManager
      title="Ministries"
      description="Manage the ministry groups shown on the public Ministries page. Only publish ministries the church has confirmed."
      queryKey="ministries"
      fields={fields}
      columns={columns}
      listFn={listMinistries}
      createFn={createMinistry}
      updateFn={updateMinistry}
      deleteFn={deleteMinistry}
      emptyText="No ministries yet. Add only ministries the church has confirmed are operating."
    />
  );
}
