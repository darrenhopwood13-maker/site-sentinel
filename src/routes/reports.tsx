import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { SignIn } from "@/components/SignIn";
import { usePhotoUrl, useDayFindings, useDaySnags, useSession } from "@/lib/day-data";
import { HOUSEKEEPING_CATEGORIES } from "@/lib/housekeeping";
import { DISCLAIMER, ZONES } from "@/lib/site-log";
import { generateReport } from "@/lib/site.functions";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — instructBrain" },
      {
        name: "description",
        content:
          "Customer progress, housekeeping condition and snag reports generated from today's site photos.",
      },
      { property: "og:title", content: "Reports — instructBrain" },
      {
        property: "og:description",
        content: "Three reports, one photo engine. Graded Green, Amber, Red by zone.",
      },
    ],
  }),
  component: Reports,
});

type Kind = "customer" | "housekeeping" | "snag";

function Reports() {
  const { session, ready } = useSession();
  const findings = useDayFindings(!!session);
  const snags = useDaySnags(!!session);
  const [busy, setBusy] = useState<Kind | null>(null);
  const [output, setOutput] = useState<{ kind: Kind; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return <SignIn />;

  const rows = findings.data ?? [];
  const open = rows.filter((f) => f.status === "finding");

  const zoneGrade = (zone: string) => {
    const g = open.filter((f) => f.zone === zone).map((f) => f.grade);
    if (g.includes("red")) return "red";
    if (g.includes("amber")) return "amber";
    return "green";
  };

  const run = async (kind: Kind) => {
    setBusy(kind);
    setError(null);
    try {
      const res = await generateReport({ data: { kind } });
      setOutput({ kind, body: res.body });
    } catch {
      setError("Report could not be generated. Try again.");
    }
    setBusy(null);
  };

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-6">
      <header className="flex items-center justify-between">
        <Logo />
        <Link to="/" className="rounded-full border border-border px-3 py-2 text-xs font-bold">
          Day view
        </Link>
      </header>
      <h1 className="mt-4 text-2xl font-extrabold">Reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Built from today's photos, voice notes and taps. Generate them whenever you are ready to share.
      </p>

      <section className="mt-5 grid grid-cols-3 gap-2">
        {ZONES.map((z) => {
          const g = zoneGrade(z);
          return (
            <div key={z} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-semibold">{z}</p>
              <span
                className={`mt-2 block h-2 w-full rounded-full ${
                  g === "red" ? "bg-grade-red" : g === "amber" ? "bg-grade-amber" : "bg-grade-green"
                }`}
              />
            </div>
          );
        })}
      </section>

      <section className="mt-6 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Housekeeping categories
        </p>
        {HOUSEKEEPING_CATEGORIES.map((c) => {
          const hits = open.filter((f) => f.category === c);
          return (
            <div
              key={c}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="text-sm font-semibold">{c}</span>
              <span
                className={`text-xs font-bold ${hits.length ? "text-grade-red" : "text-grade-green"}`}
              >
                {hits.length ? `${hits.length} finding${hits.length > 1 ? "s" : ""}` : "Clear"}
              </span>
            </div>
          );
        })}
      </section>

      {open.length > 0 && (
        <section className="mt-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Findings — photo, timestamp, zone
          </p>
          {open.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </section>
      )}

      <section className="mt-7 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Generate report
        </p>
        {(
          [
            ["customer", "Customer progress report"],
            ["housekeeping", "Housekeeping / site condition"],
            ["snag", `Snag report (${snags.data?.length ?? 0} snags)`],
          ] as [Kind, string][]
        ).map(([kind, label]) => (
          <button
            key={kind}
            onClick={() => run(kind)}
            disabled={busy !== null}
            className="h-16 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy === kind ? "Writing…" : label}
          </button>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </section>

      {output && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">{output.kind}</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{output.body}</pre>
        </section>
      )}

      <p className="mt-8 text-xs text-muted-foreground">{DISCLAIMER}</p>
    </main>
  );
}

function FindingCard({
  finding,
}: {
  finding: {
    id: string;
    grade: string;
    zone: string;
    line_1: string;
    line_2: string | null;
    line_3: string | null;
    citation: string | null;
    photo_path: string | null;
    captured_at: string;
  };
}) {
  const url = usePhotoUrl(finding.photo_path);
  return (
    <article className="flex gap-3 rounded-2xl border border-border bg-card p-3">
      {url ? (
        <img src={url} alt={finding.line_1} className="h-24 w-24 rounded-xl object-cover" />
      ) : (
        <div className="h-24 w-24 rounded-xl bg-surface-raised" />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`text-xs font-bold uppercase ${
            finding.grade === "red"
              ? "text-grade-red"
              : finding.grade === "amber"
                ? "text-grade-amber"
                : "text-grade-green"
          }`}
        >
          {finding.grade} · {finding.zone} ·{" "}
          {new Date(finding.captured_at).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="text-sm font-semibold">{finding.line_1}</p>
        {finding.line_2 && <p className="text-sm text-foreground/80">{finding.line_2}</p>}
        {finding.line_3 && <p className="text-sm text-foreground/80">{finding.line_3}</p>}
        {finding.citation && (
          <p className="mt-1 text-xs text-muted-foreground">{finding.citation}</p>
        )}
      </div>
    </article>
  );
}
