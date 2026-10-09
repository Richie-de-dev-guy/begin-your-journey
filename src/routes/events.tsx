import { createFileRoute } from "@tanstack/react-router";
import { church } from "@/config/church";
import { events } from "@/content/events";
import { PageContainer, EmptyState, PrimaryButton } from "@/components/ui";
import { EventCard, PageHero } from "@/components/sections";

const title = `Events — ${church.shortName}`;
const description = "Upcoming programmes and gatherings at our church in Calabar.";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/events" }],
  }),
  component: Events,
});

function Events() {
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageHero eyebrow="Events" title="Gather with us" intro="Programmes and special gatherings for the whole church family." />
      <section className="py-16">
        <PageContainer>
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming events listed yet"
              message="Upcoming events will be announced here. For the latest information, please contact the church.">
              <PrimaryButton to="/contact">Contact Us</PrimaryButton>
            </EmptyState>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </PageContainer>
      </section>
    </>
  );
}
