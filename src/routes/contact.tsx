import { createFileRoute } from "@tanstack/react-router";
import { church } from "@/config/church";
import { PageContainer } from "@/components/ui";
import { ContactDetails, PageHero, PlaceholderNote } from "@/components/sections";
import { ContactForm } from "@/components/ContactForm";

const title = `Contact Us — ${church.shortName}`;
const description = `Call ${church.phone} or email ${church.email}. Find us near ${church.landmark}, Calabar.`;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact Us" title="We'd love to hear from you"
        intro="Reach out with questions, prayer needs, or to learn more about our church." />
      <section className="py-16">
        <PageContainer className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-2xl font-semibold">Get in touch</h2>
            <PlaceholderNote>If you plan to visit, please contact us first to confirm service arrangements.</PlaceholderNote>
            <div className="mt-6"><ContactDetails /></div>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Send a message</h2>
            <ContactForm />
          </div>
        </PageContainer>
      </section>
    </>
  );
}
