import { createFileRoute } from "@tanstack/react-router";
import { church } from "@/config/church";
import { ministries } from "@/content/ministries";
import { PageContainer } from "@/components/ui";
import { MinistryCard, PageHero, PlaceholderNote } from "@/components/sections";

const title = `Ministries — ${church.shortName}`;
const description = "Discover ministries for every age and stage at our church in Calabar.";

export const Route = createFileRoute("/ministries")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/ministries" }],
  }),
  component: Ministries,
});

function Ministries() {
  return (
    <>
      <PageHero eyebrow="Ministries" title="Find your place to serve and grow"
        intro="There is a place for everyone to connect, grow, and use their gifts." />
      <section className="py-16">
        <PageContainer>
          <PlaceholderNote>
            The ministries below are examples. Please contact the church to confirm which ministries currently meet.
          </PlaceholderNote>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ministries.map((m) => <MinistryCard key={m.slug} ministry={m} />)}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
