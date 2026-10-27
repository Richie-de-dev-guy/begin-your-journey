import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageContainer } from "@/components/ui";
import { PageHero } from "@/components/sections";
import { getPublishedPage } from "@/lib/public-content.functions";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const page = await getPublishedPage({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.seo_title || loaderData?.title || "Page" },
      ...(loaderData?.seo_description
        ? [{ name: "description", content: loaderData.seo_description }]
        : []),
    ],
  }),
  component: ManagedPage,
});

function ManagedPage() {
  const page = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="Church" title={page.title} />
      <section className="py-16">
        <PageContainer className="max-w-3xl">
          <div className="whitespace-pre-wrap leading-8 text-foreground">{page.body}</div>
        </PageContainer>
      </section>
    </>
  );
}
