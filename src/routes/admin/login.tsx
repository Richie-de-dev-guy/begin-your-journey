import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Staff Sign In — ${church.shortName}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(
          "Sign-in failed. Check your email and password, or ask an administrator to confirm your account.",
        );
        return;
      }

      await navigate({ to: "/admin" });
    } catch (cause) {
      console.error("[Admin login] Could not complete sign-in.", cause);
      setError("Sign-in could not be completed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-deep px-4">
      <div className="w-full max-w-md rounded-2xl bg-ivory p-8 shadow-xl">
        <div className="flex items-center gap-2">
          <img src="/cfcm-logo.png" alt="" className="h-12 w-12 shrink-0 object-contain" />
          <div>
            <p className="font-heading text-lg font-bold leading-tight text-forest-deep">
              Chosen Fruit
            </p>
            <p className="text-xs text-muted-foreground">Staff Administration</p>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access is limited to authorized church staff. Accounts are created by invitation only.
        </p>
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/admin/forgot-password" className="text-primary underline">
            Forgot your password?
          </Link>
        </p>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline">
            Back to the public website
          </Link>
        </p>
      </div>
    </div>
  );
}
