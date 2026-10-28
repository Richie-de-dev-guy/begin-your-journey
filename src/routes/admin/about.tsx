import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { church } from "@/config/church";
import { saveAboutSections } from "@/lib/admin/about.functions";
import { listAboutSections } from "@/lib/public-content.functions";

type AboutSection = {
  key: string;
  title: string;
  body: string;
};

export const Route = createFileRoute("/admin/about")({
  head: () => ({ meta: [{ title: `About Page — ${church.shortName} Admin` }] }),
  component: AboutAdmin,
});

function AboutAdmin() {
  const queryClient = useQueryClient();
  const loadSections = useServerFn(listAboutSections);
  const saveSections = useServerFn(saveAboutSections);
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "about-sections"],
    queryFn: () => loadSections(),
  });

  useEffect(() => {
    if (data) setSections(data.map(({ key, title, body }) => ({ key, title, body })));
  }, [data]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await saveSections({ data: sections });
      setMessage("About page content saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "about-sections"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save About page content.");
    } finally {
      setBusy(false);
    }
  };

  const updateSection = (key: string, field: "title" | "body", value: string) => {
    setSections((current) =>
      current.map((section) => (section.key === key ? { ...section, [field]: value } : section)),
    );
  };

  const input =
    "block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">About page content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the six sections displayed on the public About page. Only a Super Administrator can
          save these changes.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="flex gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="flex gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> {message}
        </p>
      )}
      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading About page content…
        </p>
      )}
      {isError && (
        <p role="alert" className="text-sm text-destructive">
          Could not load the About page sections. Refresh the page and check the database setup.
        </p>
      )}

      {!isLoading && !isError && (
        <form onSubmit={onSubmit} className="space-y-5">
          {sections.map((section) => (
            <section
              key={section.key}
              className="space-y-3 rounded-xl border border-border bg-card p-5"
            >
              <h2 className="font-semibold">{section.title}</h2>
              <label className="grid gap-1 text-sm font-medium">
                Section heading
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  className={input}
                  value={section.title}
                  onChange={(event) => updateSection(section.key, "title", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Content
                <textarea
                  rows={
                    section.key === "statement_of_faith" || section.key === "leadership" ? 6 : 4
                  }
                  maxLength={20_000}
                  className={input}
                  value={section.body}
                  onChange={(event) => updateSection(section.key, "body", event.target.value)}
                />
              </label>
            </section>
          ))}
          <button
            type="submit"
            disabled={busy || sections.length !== 6}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save About page"}
          </button>
        </form>
      )}
    </div>
  );
}
