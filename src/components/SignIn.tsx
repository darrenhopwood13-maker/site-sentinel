import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Logo />
      <h1 className="mt-4 text-3xl font-extrabold leading-tight">
        The daily site report writes itself.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        instructSite runs the job. instructBrain writes it up.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="h-14 w-full rounded-xl border border-border bg-card px-4 text-base outline-none focus:border-primary"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="h-14 w-full rounded-xl border border-border bg-card px-4 text-base outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          disabled={busy}
          className="h-14 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground disabled:opacity-60"
        >
          {mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-6 text-sm text-muted-foreground"
      >
        {mode === "in" ? "No account yet? Create one" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}