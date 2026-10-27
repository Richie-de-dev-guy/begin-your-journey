import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { submitPrayerRequest } from "@/lib/public-content.functions";

export function PrayerRequestForm() {
  const submit = useServerFn(submitPrayerRequest);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (message.trim().length < 5) {
      setError("Please enter at least five characters.");
      return;
    }

    setBusy(true);
    try {
      await submit({
        data: {
          message: message.trim(),
          submitter_name: name.trim() || null,
          contact: contact.trim() || null,
          is_private: isPrivate,
        },
      });
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your request could not be sent. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="rounded-2xl border border-border bg-card p-6">
        <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
        <h3 className="mt-3 text-lg font-semibold">Your request was received</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Authorized prayer-team staff will handle it with care.
        </p>
      </div>
    );
  }

  const input =
    "mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Name (optional)
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            className={input}
          />
        </label>
        <label className="text-sm font-medium">
          Contact details (optional)
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            maxLength={200}
            className={input}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Prayer request
        <textarea
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={2000}
          className={input}
        />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(event) => setIsPrivate(event.target.checked)}
          className="mt-1 h-4 w-4 accent-primary"
        />
        <span>Keep this request private to authorized prayer-team staff.</span>
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send Prayer Request"}
      </button>
      <p className="text-xs text-muted-foreground">
        Prayer requests are visible only to staff with prayer-request access. Please do not include
        highly sensitive personal information.
      </p>
    </form>
  );
}
