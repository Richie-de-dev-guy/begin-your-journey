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

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: `Pages — ${church.shortName} Admin` }] }),
  component: PagesAdmin,
});

const fields: FieldDef[] = [
  { name: "title", label: "Page title", type: "text", required: true },
  {
    name: "slug",
    label: "Slug",
    type: "text",
    required: true,
    help: "The web address, e.g. 'statement-of-faith' becomes /pages/statement-of-faith.",
  },
  { name: "body", label: "Page content", type: "textarea" },
  {
    name: "featured_image_url",
    label: "Featured image URL",
    type: "url",
    help: "Upload images in the Media Library, then paste the URL here.",
  },
  { name: "seo_title", label: "SEO title", type: "text" },
  { name: "seo_description", label: "SEO description", type: "textarea" },
  statusField,
];

const columns: ColumnDef[] = [
  { key: "title", label: "Title" },
  { key: "slug", label: "Slug", render: (r) => `/pages/${String(r["slug"])}` },
];

function PagesAdmin() {
  const list = useServerFn(listContent);
  const create = useServerFn(createContent);
  const update = useServerFn(updateContent);
  const remove = useServerFn(deleteContent);

  return (
    <CollectionManager
      title="Pages"
      description="Manage custom pages such as Statement of Faith, History, or Leadership."
      queryKey="pages"
      fields={fields}
      columns={columns}
      listFn={({ page, pageSize }) =>
        list({ data: { table: "pages", query: { page, pageSize } } }).then((result) => ({
          ...result,
          rows: result.rows.map((row) => ({ ...row })),
        }))
      }
      createFn={(values) => create({ data: { table: "pages", values } })}
      updateFn={({ id, values }) => update({ data: { table: "pages", id, values } })}
      deleteFn={({ id }) => remove({ data: { table: "pages", id } })}
      emptyText="No custom pages yet. Create one to get started."
    />
  );
}
