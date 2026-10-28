import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Reset Password — ${church.shortName}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    // Always show the same message so the form cannot reveal which emails have accounts.
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-deep px-4">
      <div className="w-full max-w-md rounded-2xl bg-ivory p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        {sent ? (
          <div role="status" className="mt-4">
            <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">
              If an account exists for that email address, a password-reset link is on its way.
              Please check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your staff email address and we will send you a reset link.
            </p>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-ring"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          <Link to="/admin/login" className="text-primary underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
