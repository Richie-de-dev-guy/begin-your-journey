import { createFileRoute } from "@tanstack/react-router";
import { church } from "@/config/church";
import { PageContainer } from "@/components/ui";
import { PageHero, PlaceholderNote } from "@/components/sections";

const title = `Privacy Policy — ${church.shortName}`;
const description = "How we handle information you share through our website.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="Privacy Policy" />
      <section className="py-16">
        <PageContainer className="max-w-3xl space-y-8">
          <PlaceholderNote>
            DRAFT — this policy must be reviewed and approved by the church (and, where appropriate, a legal adviser)
            before the website goes live.
          </PlaceholderNote>
          {[
            ["Information you submit", "When you use our contact or visitor forms, you may provide your name, email address, optional phone number, and your message. We do not ask for more information than we need to respond."],
            ["How we use it", "We use your information only to respond to your enquiry, welcome you as a visitor, or follow up on a request you have made."],
            ["Data retention", "We keep enquiries only as long as needed to respond and for reasonable record-keeping, after which they are deleted."],
            ["Access and security", "Only authorised church staff or volunteers handle enquiries. We take reasonable steps to protect your information and do not sell it."],
            ["Your rights", "You may ask to see, correct, or delete the information you have shared with us. Applicable Nigerian data-protection law may give you further rights."],
          ].map(([h, p]) => (
            <div key={h}>
              <h2 className="text-2xl font-semibold">{h}</h2>
              <p className="mt-2 text-muted-foreground">{p}</p>
            </div>
          ))}
          <div>
            <h2 className="text-2xl font-semibold">Contact for privacy questions</h2>
            <p className="mt-2 text-muted-foreground">
              Email <a href={church.emailHref} className="text-primary underline">{church.email}</a> or call{" "}
              <a href={church.phoneHref} className="text-primary underline">{church.phone}</a>.
            </p>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
