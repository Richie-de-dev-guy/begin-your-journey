import { Clock, Mail, MapPin, Navigation, Phone, Users, Info } from "lucide-react";
import type { ReactNode } from "react";
import { church } from "@/config/church";
import type { Ministry } from "@/content/ministries";
import type { Sermon } from "@/content/sermons";
import type { ChurchEvent } from "@/content/events";
import { PageContainer } from "./ui";

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="bg-forest-deep py-16 text-primary-foreground sm:py-20">
      <PageContainer>
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold text-primary-foreground sm:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-primary-foreground/85">{intro}</p>}
      </PageContainer>
    </section>
  );
}

/** Visible marker for content awaiting the church's official wording. */
export function PlaceholderNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function ServiceTimes() {
  if (!church.serviceTimes || church.serviceTimes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gold" aria-hidden />
          <h3 className="text-xl font-semibold">Service Times</h3>
        </div>
        <p className="mt-3 text-muted-foreground">
          Our service schedule will be published here soon. Please call{" "}
          <a href={church.phoneHref} className="font-medium text-primary underline">
            {church.phone}
          </a>{" "}
          to confirm service times before your visit.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-xl font-semibold">Service Times</h3>
      <ul className="mt-3 space-y-2">
        {church.serviceTimes.map((s) => (
          <li key={s.label} className="flex justify-between gap-4">
            <span>{s.label}</span>
            <span className="font-medium">{s.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContactDetails() {
  const items = [
    { icon: Phone, label: "Call us", value: church.phone, href: church.phoneHref },
    { icon: Mail, label: "Email us", value: church.email, href: church.emailHref },
  ];
  return (
    <div className="space-y-4">
      {items.map(({ icon: Icon, label, value, href }) => (
        <a
          key={label}
          href={href}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <span>
            <span className="block text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <span className="break-all font-semibold text-forest-deep">{value}</span>
          </span>
        </a>
      ))}
      <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary">
          <MapPin className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <div>
          <span className="block text-xs uppercase tracking-wide text-muted-foreground">
            Address
          </span>
          <address className="not-italic font-semibold text-forest-deep">{church.address}</address>
          <p className="mt-1 text-sm text-muted-foreground">Landmark: {church.landmark}</p>
          <a
            href={church.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-forest-deep"
          >
            <Navigation className="h-4 w-4" aria-hidden /> Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}

export function MinistryCard({ ministry }: { ministry: Ministry }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {ministry.imageUrl ? (
        <img
          src={ministry.imageUrl}
          alt={`Image for ${ministry.name}`}
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="px-6 pt-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Users className="h-6 w-6 text-primary" aria-hidden />
          </span>
        </div>
      )}
      <div className="flex h-full flex-col p-6">
        <h3 className="text-xl font-semibold">{ministry.name}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{ministry.description}</p>
        {ministry.schedule && (
          <p className="mt-3 text-sm">
            <strong>Meets:</strong> {ministry.schedule}
          </p>
        )}
        {ministry.contact && (
          <p className="mt-1 text-sm">
            <strong>Contact:</strong> {ministry.contact}
          </p>
        )}
        {ministry.placeholder && (
          <p className="mt-4 text-xs italic text-muted-foreground">
            Details to be confirmed by the church.{" "}
            <a href={church.emailHref} className="text-primary underline">
              Ask about this ministry
            </a>
          </p>
        )}
      </div>
    </article>
  );
}

const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date to be announced";

export function SermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {sermon.thumbnailUrl && (
        <img
          src={sermon.thumbnailUrl}
          alt={`Thumbnail for ${sermon.title}`}
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="p-5">
        {sermon.topic && (
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">{sermon.topic}</p>
        )}
        <h3 className="mt-1 text-lg font-semibold">{sermon.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {sermon.speaker} · {fmtDate(sermon.date)}
        </p>
        {sermon.passage && <p className="mt-1 text-sm">{sermon.passage}</p>}
        {sermon.mediaUrl && (
          <a
            href={sermon.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-primary underline"
          >
            Watch / Listen
          </a>
        )}
      </div>
    </article>
  );
}

export function EventCard({ event }: { event: ChurchEvent }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="p-5">
        <p className="text-sm font-semibold text-gold">
          {fmtDate(event.date)}
          {event.startTime ? ` · ${event.startTime}` : ""}
        </p>
        <h3 className="mt-1 text-lg font-semibold">{event.title}</h3>
        {event.venue && <p className="mt-1 text-sm text-muted-foreground">{event.venue}</p>}
        <p className="mt-2 text-sm">{event.description}</p>
        {event.registrationUrl && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-primary underline"
          >
            Register
          </a>
        )}
      </div>
    </article>
  );
}
