import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CollectionManager,
  statusField,
  type FieldDef,
  type ColumnDef,
} from "@/components/admin/CollectionManager";
import {
  listContent,
  createContent,
  updateContent,
  deleteContent,
} from "@/lib/admin/content.functions";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/announcements")({
  head: () => ({ meta: [{ title: `Announcements — ${church.shortName} Admin` }] }),
  component: AnnouncementsAdmin,
});

const fields: FieldDef[] = [
  { name: "title", label: "Announcement title", type: "text", required: true },
  { name: "body", label: "Message", type: "textarea" },
  {
    name: "image_url",
    label: "Image URL",
    type: "url",
    help: "Upload images in the Media Library, then paste the URL here.",
  },
  {
    name: "published_at",
    label: "Show from",
    type: "datetime-local",
    help: "Leave empty to show immediately once published.",
  },
  {
    name: "expires_at",
    label: "Hide after",
    type: "datetime-local",
    help: "Leave empty to keep showing until archived.",
  },
  { name: "priority", label: "Priority (higher shows first)", type: "number" },
  { name: "is_featured", label: "Feature this announcement", type: "checkbox" },
  statusField,
];

const columns: ColumnDef[] = [
  { key: "title", label: "Title" },
  { key: "priority", label: "Priority" },
  {
    key: "expires_at",
    label: "Expires",
    render: (r) =>
      r["expires_at"]
        ? new Date(String(r["expires_at"])).toLocaleDateString("en-NG", { dateStyle: "medium" })
        : "—",
  },
];

function AnnouncementsAdmin() {
  const list = useServerFn(listContent);
  const create = useServerFn(createContent);
  const update = useServerFn(updateContent);
  const remove = useServerFn(deleteContent);

  return (
    <CollectionManager
      title="Announcements"
      description="Short notices shown on the public website, such as schedule changes or special programmes."
      queryKey="announcements"
      fields={fields}
      columns={columns}
      listFn={({ page, pageSize }) =>
        list({ data: { table: "announcements", query: { page, pageSize } } }).then((result) => ({
          ...result,
          rows: result.rows.map((row) => ({ ...row })),
        }))
      }
      createFn={(values) => create({ data: { table: "announcements", values } })}
      updateFn={({ id, values }) => update({ data: { table: "announcements", id, values } })}
      deleteFn={({ id }) => remove({ data: { table: "announcements", id } })}
      emptyText="No announcements yet."
    />
  );
}
