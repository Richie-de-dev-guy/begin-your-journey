import { createFileRoute } from "@tanstack/react-router";
import { church } from "@/config/church";
import { PageContainer, PrimaryButton } from "@/components/ui";
import { PageHero, PlaceholderNote } from "@/components/sections";
import { listAboutSections } from "@/lib/public-content.functions";

const title = `About Us — ${church.shortName}`;
const description = `Learn about ${church.name}, a Pentecostal / Charismatic Christian ministry in Calabar, Nigeria.`;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  loader: () => listAboutSections(),
  component: About,
});

function About() {
  const sections = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title={church.name}
        intro={`A ${church.category.toLowerCase()} in ${church.city}, ${church.state}, committed to faith, fellowship, spiritual growth, and sharing the love of Christ.`}
      />
      <section className="py-16">
        <PageContainer className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.key} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{section.body}</p>
              {section.is_placeholder && (
                <PlaceholderNote>Awaiting official content from the church.</PlaceholderNote>
              )}
            </article>
          ))}
        </PageContainer>
      </section>
      <section className="bg-muted py-16">
        <PageContainer className="text-center">
          <h2 className="text-3xl font-bold">Worship with us</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            We would be glad to welcome you to a service.
          </p>
          <div className="mt-6">
            <PrimaryButton to="/visit">Plan Your Visit</PrimaryButton>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
