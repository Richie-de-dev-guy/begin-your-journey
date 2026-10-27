import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { submitInquiry } from "@/lib/public-content.functions";

/**
 * Contact / visitor enquiry form. Submissions are validated and stored server-side.
 */

type Fields = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
};
type Errors = Partial<Record<keyof Fields, string>>;

const empty: Fields = { name: "", email: "", phone: "", subject: "", message: "", consent: false };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    e.email = "Please enter a valid email address.";
  if (f.phone && !/^[+\d\s()-]{7,20}$/.test(f.phone.trim()))
    e.phone = "Please enter a valid phone number.";
  if (f.subject.trim().length < 2) e.subject = "Please enter a subject.";
  if (f.message.trim().length < 10) e.message = "Your message should be at least 10 characters.";
  else if (f.message.length > 2000) e.message = "Please keep your message under 2000 characters.";
  if (!f.consent) e.consent = "Please acknowledge the privacy notice.";
  return e;
}

export function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const submit = useServerFn(submitInquiry);
  const [fields, setFields] = useState<Fields>({ ...empty, subject: defaultSubject });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setFields((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus("error");
      return;
    }
    setBusy(true);
    setSubmitError(null);
    try {
      await submit({
        data: {
          full_name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim() || null,
          subject: fields.subject.trim(),
          message: fields.message.trim(),
        },
      });
      setStatus("sent");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Your message could not be sent. Please try again.",
      );
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-ring";
  const err = (k: keyof Fields) =>
    errors[k] && (
      <p id={`${k}-error`} className="mt-1 text-xs text-destructive">
        {errors[k]}
      </p>
    );

  if (status === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <h3 className="mt-3 text-xl font-semibold">Almost done</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your message has been received. A member of our team will respond using the email address
          you provided.
        </p>
        <button
          type="button"
          onClick={() => {
            setFields({ ...empty, subject: defaultSubject });
            setStatus("idle");
          }}
          className="mt-5 text-sm font-semibold text-primary underline"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      {status === "error" && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" aria-hidden />{" "}
          {submitError ?? "Please correct the highlighted fields."}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            Full name *
          </label>
          <input
            id="name"
            className={input}
            value={fields.name}
            maxLength={100}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            onChange={(e) => set("name", e.target.value)}
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email address *
          </label>
          <input
            id="email"
            type="email"
            className={input}
            value={fields.email}
            maxLength={255}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            onChange={(e) => set("email", e.target.value)}
          />
          {err("email")}
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium">
            Phone number (optional)
          </label>
          <input
            id="phone"
            type="tel"
            className={input}
            value={fields.phone}
            maxLength={20}
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            onChange={(e) => set("phone", e.target.value)}
          />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="subject" className="text-sm font-medium">
            Subject *
          </label>
          <input
            id="subject"
            className={input}
            value={fields.subject}
            maxLength={150}
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            onChange={(e) => set("subject", e.target.value)}
          />
          {err("subject")}
        </div>
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium">
          Message *
        </label>
        <textarea
          id="message"
          rows={5}
          className={input}
          value={fields.message}
          maxLength={2000}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          onChange={(e) => set("message", e.target.value)}
        />
        {err("message")}
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-primary"
            checked={fields.consent}
            aria-invalid={!!errors.consent}
            onChange={(e) => set("consent", e.target.checked)}
          />
          <span>
            I understand my details will be used only to respond to my enquiry, as described in the{" "}
            <Link to="/privacy" className="text-primary underline">
              privacy policy
            </Link>
            . *
          </span>
        </label>
        {err("consent")}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Sending…" : "Send Message"}
      </button>
      <p className="text-xs text-muted-foreground">
        Your enquiry is submitted securely and visible only to authorized staff.
      </p>
    </form>
  );
}
