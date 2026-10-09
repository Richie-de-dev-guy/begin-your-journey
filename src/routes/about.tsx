import { createFileRoute } from "@tanstack/react-router";
import { church } from "@/config/church";
import { PageContainer, PrimaryButton } from "@/components/ui";
import { PageHero, PlaceholderNote } from "@/components/sections";

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
  component: About,
});

/** PLACEHOLDER sections — replace `body` with the church's official wording. */
const sections = [
  { title: "Our Story", body: "The history of the ministry will be shared here." },
  { title: "Our Vision", body: "The church's official vision statement will appear here." },
  { title: "Our Mission", body: "The church's official mission statement will appear here." },
  { title: "Core Values", body: "The church's core values will be listed here." },
  { title: "Statement of Faith", body: "The church's statement of faith will be published here." },
  { title: "Our Leadership", body: "An introduction to the church's pastors and leaders will appear here." },
];

function About() {
  return (
    <>
      <PageHero eyebrow="About Us" title={church.name}
        intro={`A ${church.category.toLowerCase()} in ${church.city}, ${church.state}, committed to faith, fellowship, spiritual growth, and sharing the love of Christ.`} />
      <section className="py-16">
        <PageContainer className="grid gap-6 md:grid-cols-2">
          {sections.map((s) => (
            <article key={s.title} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-muted-foreground">{s.body}</p>
              <PlaceholderNote>Awaiting official content from the church.</PlaceholderNote>
            </article>
          ))}
        </PageContainer>
      </section>
      <section className="bg-muted py-16">
        <PageContainer className="text-center">
          <h2 className="text-3xl font-bold">Worship with us</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">We would be glad to welcome you to a service.</p>
          <div className="mt-6"><PrimaryButton to="/visit">Plan Your Visit</PrimaryButton></div>
        </PageContainer>
      </section>
    </>
  );
}
