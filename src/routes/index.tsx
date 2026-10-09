import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Heart, HandHeart, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-worship.jpg";
import { church, proposedCopy } from "@/config/church";
import { ministries } from "@/content/ministries";
import { sermons } from "@/content/sermons";
import { events } from "@/content/events";
import { PageContainer, SectionHeading, PrimaryButton, SecondaryButton, EmptyState } from "@/components/ui";
import { ContactDetails, EventCard, MinistryCard, PlaceholderNote, SermonCard, ServiceTimes } from "@/components/sections";

const title = `${church.name} — Church in Calabar`;
const description =
  "A Pentecostal / Charismatic Christian ministry in Calabar, Cross River State. Join us to grow in faith, fellowship, and God's Word.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const pillars = [
  { icon: BookOpen, title: "God's Word", text: "Growing together through the teaching of Scripture." },
  { icon: Heart, title: "Worship", text: "Spirit-filled praise and heartfelt worship." },
  { icon: HandHeart, title: "Fellowship", text: "A loving family where everyone belongs." },
  { icon: Sparkles, title: "Bearing Fruit", text: "Living out our faith in our community." },
];

function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={heroImg} alt="Members of the congregation worshipping with raised hands" width={1920} height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-deep/95 via-forest-deep/80 to-forest-deep/30" />
        <PageContainer className="py-24 sm:py-32 lg:py-40">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">{church.name}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold text-primary-foreground sm:text-6xl">
            {proposedCopy.heroHeadline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/90">{proposedCopy.heroIntro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/visit" className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-forest-deep hover:bg-gold-soft">
              Plan Your Visit
            </Link>
            <Link to="/contact" className="rounded-lg border-2 border-primary-foreground/70 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10">
              Contact Us
            </Link>
          </div>
        </PageContainer>
      </section>

      <section className="py-20">
        <PageContainer>
          <SectionHeading eyebrow="Our Mission" title="Rooted in Christ, Bearing Fruit" intro={proposedCopy.missionIntro} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 text-center">
                <Icon className="mx-auto h-8 w-8 text-gold" aria-hidden />
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="bg-muted py-20">
        <PageContainer className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="Worship & Fellowship" title="Come as you are"
              intro="Our gatherings are times of praise, prayer, and teaching from God's Word, where people of every age and background are welcome." />
            <div className="mt-6"><SecondaryButton to="/about">Learn About Us</SecondaryButton></div>
          </div>
          <ServiceTimes />
        </PageContainer>
      </section>

      <section className="py-20">
        <PageContainer>
          <SectionHeading eyebrow="Featured Sermon" title="Grow in the Word" />
          <div className="mt-10">
            {sermons[0] ? (
              <div className="mx-auto max-w-xl"><SermonCard sermon={sermons[0]} /></div>
            ) : (
              <EmptyState title="Sermons coming soon" message="Messages from our services will be shared here once they are published.">
                <PrimaryButton to="/sermons">Visit Sermons</PrimaryButton>
              </EmptyState>
            )}
          </div>
        </PageContainer>
      </section>

      <section className="bg-muted py-20">
        <PageContainer>
          <SectionHeading eyebrow="Upcoming Events" title="Gather with us" />
          <div className="mt-10">
            {events.length ? (
              <div className="grid gap-6 md:grid-cols-3">{events.slice(0, 3).map((e) => <EventCard key={e.id} event={e} />)}</div>
            ) : (
              <EmptyState title="No upcoming events listed" message="Upcoming programmes will appear here. Contact us to learn what's happening at church." >
                <PrimaryButton to="/contact">Contact Us</PrimaryButton>
              </EmptyState>
            )}
          </div>
        </PageContainer>
      </section>

      <section className="py-20">
        <PageContainer>
          <SectionHeading eyebrow="Ministries" title="Find your place to serve and grow" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ministries.slice(0, 3).map((m) => <MinistryCard key={m.slug} ministry={m} />)}
          </div>
          <div className="mt-8 text-center"><SecondaryButton to="/ministries">View All Ministries</SecondaryButton></div>
        </PageContainer>
      </section>

      <section className="bg-forest py-20 text-primary-foreground">
        <PageContainer className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">First time?</p>
          <h2 className="mt-2 text-3xl font-bold text-primary-foreground sm:text-4xl">We'd love to welcome you</h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
            Whether you are new to faith or looking for a church family in Calabar, there is a place for you here.
          </p>
          <div className="mt-8">
            <Link to="/visit" className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-forest-deep hover:bg-gold-soft">
              Plan Your Visit
            </Link>
          </div>
        </PageContainer>
      </section>

      <section className="py-20">
        <PageContainer className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="Find Us" title="Location & Contact"
              intro={`We are located near ${church.landmark}, Calabar.`} />
            <PlaceholderNote>Please contact us before visiting if you need to confirm service arrangements.</PlaceholderNote>
          </div>
          <ContactDetails />
        </PageContainer>
      </section>
    </>
  );
}
