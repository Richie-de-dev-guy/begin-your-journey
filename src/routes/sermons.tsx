import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { church } from "@/config/church";
import { sermons } from "@/content/sermons";
import { PageContainer, EmptyState, PrimaryButton } from "@/components/ui";
import { PageHero, SermonCard } from "@/components/sections";

const title = `Sermons — ${church.shortName}`;
const description = "Watch and listen to messages from our services in Calabar.";

export const Route = createFileRoute("/sermons")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/sermons" }],
  }),
  component: Sermons,
});

function Sermons() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("all");
  const topics = useMemo(() => Array.from(new Set(sermons.map((s) => s.topic).filter(Boolean))) as string[], []);
  const filtered = sermons.filter((s) => {
    const hay = `${s.title} ${s.speaker} ${s.passage ?? ""} ${s.topic ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase()) && (topic === "all" || s.topic === topic);
  });

  return (
    <>
      <PageHero eyebrow="Sermons" title="Grow in God's Word" intro="Messages from our services, shared to encourage and equip you." />
      <section className="py-16">
        <PageContainer>
          {sermons.length === 0 ? (
            <EmptyState title="Sermons will be added soon"
              message="We're preparing our sermon library. Please check back, or join us in person to hear the Word.">
              <PrimaryButton to="/visit">Plan Your Visit</PrimaryButton>
            </EmptyState>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Search sermons</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, speaker, or passage"
                    className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm" />
                </label>
                <label>
                  <span className="sr-only">Filter by topic</span>
                  <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm">
                    <option value="all">All topics</option>
                    {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => <SermonCard key={s.id} sermon={s} />)}
              </div>
              {filtered.length === 0 && <p className="mt-8 text-center text-muted-foreground">No sermons match your search.</p>}
            </>
          )}
        </PageContainer>
      </section>
    </>
  );
}
