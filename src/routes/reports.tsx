import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { DISCLAIMER, ZONES, useSiteLog, type Zone } from "@/lib/site-log";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "5pm Reports — instructReport" },
      {
        name: "description",
        content:
          "Generate the customer progress report, housekeeping grade and snag list from today's site evidence.",
      },
      { property: "og:title", content: "5pm Reports — instructReport" },
      {
        property: "og:description",
        content: "Client-ready housekeeping grade, photo evidence and snags grouped by trade.",
      },
    ],
  }),
  component: ReportsPage,
});

const HOUSEKEEPING = [
  "Waste and offcuts",
  "Tools left lying around",
  "Trailing leads",
  "Exposed edges",
  "Missing edge protection",
  "Spillages",
  "Trip hazards",
];

function ReportsPage() {
  const { entries } = useSiteLog();
  const photos = entries.filter((e) => e.source === "photo");
  const coveredZones = new Set<Zone>(photos.map((p) => p.zone));

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <Link to="/" className="text-sm font-semibold text-primary">
          ← Day view
        </Link>
      </header>

      <h1 className="text-2xl font-extrabold">5pm reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        instructSite runs the job. instructBrain writes it up.
      </p>

      <section className="mt-6 space-y-3">
        {[
          { t: "Customer report", d: "Progress write-up in this client's remembered format." },
          { t: "Housekeeping report", d: "Every photo graded Green / Amber / Red per zone." },
          { t: "Snag report", d: "Snag Master engine, grouped by trade then location." },
        ].map((r) => (
          <button
            key={r.t}
            disabled
            className="w-full rounded-2xl border border-border bg-card p-4 text-left disabled:opacity-70"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">{r.t}</span>
              <span className="rounded-full bg-surface-raised px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                Needs backend
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
          </button>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Evidence collected today
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ZONES.map((z) => (
            <div
              key={z}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3"
            >
              <span className="text-sm font-semibold">{z}</span>
              <span
                className={`h-3 w-3 rounded-full ${
                  coveredZones.has(z) ? "bg-grade-green" : "bg-grade-amber"
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Housekeeping categories
        </h2>
        <div className="mt-3 space-y-2">
          {HOUSEKEEPING.map((c) => (
            <div
              key={c}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3"
            >
              <span className="text-sm">{c}</span>
              <span className="text-xs font-bold text-muted-foreground">awaiting analysis</span>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        {DISCLAIMER}
      </p>
    </main>
  );
}