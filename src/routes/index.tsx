import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { ZoneStrip } from "@/components/ZoneStrip";
import { CaptureBar } from "@/components/CaptureBar";
import { CHIPS } from "@/lib/chips";
import { SECTIONS, useSiteLog, type Section, type Zone } from "@/lib/site-log";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "instructReport — the site report writes itself" },
      {
        name: "description",
        content:
          "Tap, photo and voice site reporting for one site manager. Zero typing, dark and thumb-first.",
      },
      { property: "og:title", content: "instructReport — the site report writes itself" },
      {
        property: "og:description",
        content: "instructSite runs the job. instructBrain writes it up.",
      },
    ],
  }),
  component: DayView,
});

function useWeather() {
  const [w, setW] = useState<string | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return setW("Weather unavailable");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,precipitation,wind_speed_10m`,
          );
          const d = await r.json();
          const c = d.current;
          setW(
            `${Math.round(c.temperature_2m)}°C · ${c.precipitation > 0 ? "rain" : "dry"} · wind ${Math.round(c.wind_speed_10m)} km/h`,
          );
        } catch {
          setW("Weather unavailable");
        }
      },
      () => setW("Weather unavailable"),
    );
  }, []);
  return w;
}

function DayView() {
  const log = useSiteLog();
  const weather = useWeather();
  const [open, setOpen] = useState<Section | null>(null);
  const [recording, setRecording] = useState(false);

  const covered = new Set<Zone>(log.entries.filter((e) => e.source === "photo").map((e) => e.zone));
  const counts = log.entries.reduce<Record<string, number>>((a, e) => {
    a[e.section] = (a[e.section] ?? 0) + 1;
    return a;
  }, {});

  const date = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-32 pt-6">
      <header className="flex items-center justify-between">
        <Logo />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dal · Site
        </span>
      </header>

      <h1 className="mt-5 text-2xl font-extrabold leading-tight">{date}</h1>
      <p className="text-sm text-muted-foreground">{weather ?? "Reading weather…"}</p>

      <div className="mt-5">
        <ZoneStrip zone={log.zone} covered={covered} onSelect={log.setZone} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setOpen(s.key)}
            className="flex h-28 flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left active:scale-[0.98]"
          >
            <span className="text-2xl">{s.icon}</span>
            <span>
              <span className="block text-base font-bold">{s.key}</span>
              <span className="text-xs text-muted-foreground">
                {counts[s.key] ? `${counts[s.key]} logged` : s.hint}
              </span>
            </span>
          </button>
        ))}
      </div>

      {log.entries.length > 0 && (
        <section className="mt-8 space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Today's log
          </h2>
          {log.entries.slice(0, 12).map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{e.label}</span>
                <button
                  onClick={() => log.remove(e.id)}
                  className="text-xs text-muted-foreground"
                  aria-label="Remove entry"
                >
                  ✕
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{e.section}</span>
                <span>·</span>
                <span>{e.zone}</span>
                <span>·</span>
                <span>{new Date(e.at).toLocaleTimeString("en-GB", { timeStyle: "short" })}</span>
              </div>
              {e.photo && (
                <img
                  src={e.photo}
                  alt={`${e.section} evidence in ${e.zone}`}
                  className="mt-2 h-32 w-full rounded-lg object-cover"
                />
              )}
              {e.checkMe && (
                <button
                  onClick={() => log.confirm(e.id)}
                  className="mt-2 w-full rounded-lg bg-grade-amber py-2 text-sm font-bold text-primary-foreground"
                >
                  Check me — tap to confirm
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full rounded-t-3xl border-t border-border bg-card p-4 pb-8"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
            <h2 className="text-lg font-extrabold">
              {open} · {log.zone}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {CHIPS[open].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    log.add({ section: open, source: "tap", label: c });
                    setOpen(null);
                  }}
                  className="rounded-full border border-border bg-surface-raised px-4 py-3 text-sm font-semibold active:bg-primary active:text-primary-foreground"
                >
                  {c}
                </button>
              ))}
              {CHIPS[open].length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Use the camera button — the photo is the entry.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <CaptureBar
        recording={recording}
        onPhoto={(file) => {
          const reader = new FileReader();
          reader.onload = () =>
            log.add({
              section: "Photos",
              source: "photo",
              label: "Photo captured — awaiting vision read",
              photo: String(reader.result),
              checkMe: true,
            });
          reader.readAsDataURL(file);
        }}
        onVoice={() => {
          setRecording((r) => !r);
          if (recording) {
            log.add({
              section: "Issues",
              source: "voice",
              label: "Voice note captured — awaiting transcription",
              checkMe: true,
            });
          }
        }}
      />
    </main>
  );
}
