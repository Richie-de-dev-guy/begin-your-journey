import { createFileRoute } from "@tanstack/react-router";
import { church } from "@/config/church";
import { PageContainer } from "@/components/ui";
import { ContactDetails, PageHero, ServiceTimes } from "@/components/sections";
import { ContactForm } from "@/components/ContactForm";

const title = `Plan Your Visit — ${church.shortName}`;
const description = `Visiting us in Calabar? Find directions, what to expect, and how to reach us near ${church.landmark}.`;

export const Route = createFileRoute("/visit")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/visit" }],
  }),
  component: Visit,
});

const expect = [
  { title: "A warm welcome", text: "You'll be greeted by friendly people glad you came." },
  { title: "Worship & prayer", text: "Gatherings typically include praise, worship, and prayer." },
  { title: "Teaching from the Bible", text: "A message from God's Word for everyday life." },
  { title: "Come as you are", text: "There's no need to worry about what to wear — just come." },
];

function Visit() {
  return (
    <>
      <PageHero
        eyebrow="Plan Your Visit"
        title="You're welcome here"
        intro="We'd be delighted to have you join us. Here's what you need to know before you come."
      />
      <section className="py-16">
        <PageContainer className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <ServiceTimes />
            <div>
              <h2 className="text-2xl font-semibold">What to expect</h2>
              <ul className="mt-4 space-y-3">
                {expect.map((e) => (
                  <li key={e.title} className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-lg font-semibold">{e.title}</h3>
                    <p className="text-sm text-muted-foreground">{e.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-semibold">How to find us</h2>
            <ContactDetails />
          </div>
        </PageContainer>
      </section>
      <section className="bg-muted py-16">
        <PageContainer className="max-w-3xl">
          <h2 className="mb-4 text-center text-2xl font-semibold">
            Have a question before you visit?
          </h2>
          <ContactForm defaultSubject="Planning a visit" />
        </PageContainer>
      </section>
    </>
  );
}
