import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { SignIn } from "@/components/SignIn";
import { useSession } from "@/lib/day-data";
import { DISCLAIMER } from "@/lib/site-log";
import { askOracle } from "@/lib/site.functions";
import { createSpeechSession } from "@/lib/speech";

export const Route = createFileRoute("/oracle")({
  head: () => ({
    meta: [
      { title: "Ask the Oracle — instructBrain" },
      {
        name: "description",
        content:
          "Speak a question and get site advice in the Oracle voice. Advisory only, never client-facing.",
      },
      { property: "og:title", content: "Ask the Oracle — instructBrain" },
      {
        property: "og:description",
        content: "One question, spoken. Advice only — it never touches client output.",
      },
    ],
  }),
  component: Oracle,
});

function Oracle() {
  const { session, ready } = useSession();
  const [recording, setRecording] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const voiceSession = useRef<{ stop: () => Promise<string> } | null>(null);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return <SignIn />;

  const toggle = async () => {
    if (recording) {
      setRecording(false);
      try {
        const transcript = await voiceSession.current?.stop();
        if (!transcript) {
          setAnswer("Nothing heard — try again.");
          return;
        }
        setBusy(true);
        setAnswer(null);
        setQuestion(transcript);
        const res = await askOracle({ data: { question: transcript } });
        setAnswer(res.answer);
      } catch {
        setAnswer("The Oracle could not be reached. Try again.");
      } finally {
        setBusy(false);
      }
      return;
    }
    try {
      const session = createSpeechSession();
      voiceSession.current = session;
      session.start();
      setRecording(true);
    } catch {
      setAnswer("Speech recognition is not available in this browser.");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-6">
      <header className="flex items-center justify-between">
        <Logo />
        <Link to="/" className="rounded-full border border-border px-3 py-2 text-xs font-bold">
          Day view
        </Link>
      </header>
      <h1 className="mt-4 text-2xl font-extrabold">Ask the Oracle</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Advice only. This voice never appears in client-facing output.
      </p>

      <button
        onClick={toggle}
        className={`mt-8 h-40 w-full rounded-3xl text-xl font-extrabold ${
          recording
            ? "animate-pulse bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {recording ? "■ Stop and ask" : "🎙 Hold the question"}
      </button>

      {busy && <p className="mt-6 text-sm text-muted-foreground">Thinking…</p>}
      {question && (
        <p className="mt-6 text-sm font-semibold text-foreground/80">“{question}”</p>
      )}
      {answer && (
        <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">
          {answer}
        </pre>
      )}
      <p className="mt-8 text-xs text-muted-foreground">{DISCLAIMER}</p>
    </main>
  );
}
