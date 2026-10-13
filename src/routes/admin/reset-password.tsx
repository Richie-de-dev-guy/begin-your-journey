import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { church } from "@/config/church";

export const Route = createFileRoute("/admin/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Set New Password — ${church.shortName}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Recovery links arrive with type=recovery in the URL hash.
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    if (isRecovery) setReady(true);
    else {
      // Also allow if a session already exists (e.g. link already exchanged).
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });
    }
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("Could not set the new password. The link may have expired — please request a new one.");
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/admin" }), 1500);
  };

  const input =
    "mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-deep px-4">
      <div className="w-full max-w-md rounded-2xl bg-ivory p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        {done ? (
          <div role="status" className="mt-4">
            <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">Your password has been updated. Taking you to the dashboard…</p>
          </div>
        ) : !ready ? (
          <p className="mt-4 text-sm text-muted-foreground">
            This page is reached from the password-reset link in your email. If you arrived here directly, please{" "}
            <Link to="/admin/forgot-password" className="text-primary underline">request a new reset link</Link>.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
              </div>
            )}
            <div>
              <label htmlFor="password" className="text-sm font-medium">New password</label>
              <input id="password" type="password" required minLength={8} autoComplete="new-password" className={input}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirm" className="text-sm font-medium">Confirm new password</label>
              <input id="confirm" type="password" required minLength={8} autoComplete="new-password" className={input}
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button type="submit" disabled={busy}
              className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-60">
              {busy ? "Saving…" : "Save New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
