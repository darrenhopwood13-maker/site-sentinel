import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CaptureBar } from "@/components/CaptureBar";
import { Logo } from "@/components/Logo";
import { SignIn } from "@/components/SignIn";
import { ZoneStrip } from "@/components/ZoneStrip";
import { CHIPS } from "@/lib/chips";
import {
  useDayActions,
  useDayEntries,
  usePhotoUrl,
  useSession,
} from "@/lib/day-data";
import { SECTIONS, type Entry, type Section, type Zone } from "@/lib/site-log";
import { analyzePhoto, fileVoiceNote } from "@/lib/site.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "instructBrain — the daily site report writes itself" },
      {
        name: "description",
        content:
          "Tap, photo and voice capture for UK site managers. Zero typing, evidence on every finding, reports at 5pm.",
      },
      { property: "og:title", content: "instructBrain — the daily site report writes itself" },
      {
        property: "og:description",
        content: "instructSite runs the job. instructBrain writes it up.",
      },
    ],
  }),
  component: DayView,
});

function useWeather() {
  const [text, setText] = useState("Weather —");
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,precipitation,wind_speed_10m`,
        );
        const j = (await r.json()) as {
          current: { temperature_2m: number; precipitation: number; wind_speed_10m: number };
        };
        setText(
          `${Math.round(j.current.temperature_2m)}°C · ${j.current.precipitation > 0 ? "rain" : "dry"} · wind ${Math.round(j.current.wind_speed_10m)} km/h`,
        );
      } catch {
        setText("Weather unavailable");
      }
    });
  }, []);
  return text;
}

function DayView() {
  const { session, ready } = useSession();
  const userId = session?.user.id;
  const [zone, setZone] = useState<Zone>("Ground");
  const [sheet, setSheet] = useState<Section | null>(null);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const weather = useWeather();

  const entries = useDayEntries(!!userId);
  const { addTap, confirmEntry, removeEntry, uploadPhoto, refresh } = useDayActions();

  const list = entries.data ?? [];
  const covered = useMemo(
    () => new Set(list.filter((e) => e.source === "photo").map((e) => e.zone)),
    [list],
  );
  const counts = useMemo(() => {
    const m = new Map<Section, number>();
    for (const e of list) m.set(e.section, (m.get(e.section) ?? 0) + 1);
    return m;
  }, [list]);

  const onPhoto = async (file: File) => {
    if (!userId) return;
    setStatus("Reading photo…");
    try {
      const { entryId, path } = await uploadPhoto(userId, zone, file);
      const res = await analyzePhoto({ data: { path, zone, entryId } });
      setStatus(res.confident ? `Filed: ${res.label}` : `Check me: ${res.label}`);
    } catch {
      setStatus("Photo could not be read — it is still saved.");
    }
    refresh();
    setTimeout(() => setStatus(null), 4000);
  };

  const onVoice = async () => {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setStatus("Filing voice note…");
        const buf = new Uint8Array(await new Blob(chunks).arrayBuffer());
        let bin = "";
        buf.forEach((b) => (bin += String.fromCharCode(b)));
        try {
          const res = await fileVoiceNote({
            data: { audioBase64: btoa(bin), filename: "note.webm", zone },
          });
          setStatus(`${res.section}: ${res.transcript}`);
        } catch {
          setStatus("Voice note failed — try again.");
        }
        refresh();
        setTimeout(() => setStatus(null), 5000);
      };
      recorder.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setStatus("Microphone not available");
    }
  };

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return <SignIn />;

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-40 pt-6">
      <header className="flex items-start justify-between">
        <div>
          <Logo />
          <p className="mt-1 text-sm font-semibold text-foreground">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="text-xs text-muted-foreground">{weather}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link to="/oracle" className="rounded-full border border-border px-3 py-2 text-xs font-bold">
            Ask the Oracle
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs text-muted-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Guided sweep — {covered.size}/6 zones covered
        </p>
        <ZoneStrip zone={zone} covered={covered} onSelect={setZone} />
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSheet(s.key)}
            className="flex h-28 flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left active:scale-[0.98]"
          >
            <span className="text-2xl">{s.icon}</span>
            <span>
              <span className="block text-base font-bold">{s.key}</span>
              <span className="text-xs text-muted-foreground">
                {counts.get(s.key) ? `${counts.get(s.key)} logged` : s.hint}
              </span>
            </span>
          </button>
        ))}
      </section>

      <section className="mt-7">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Today's log
        </p>
        {list.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">How the day flows</p>
            <ol className="mt-2 list-inside list-decimal text-sm text-muted-foreground">
              <li>Pick your zone at the top.</li>
              <li>Tap a button, take a photo, or record a voice note.</li>
              <li>Tap Reports when you are ready to share.</li>
            </ol>
          </div>
        )}
        <div className="space-y-3">
          {list.map((e) => (
            <EntryCard key={e.id} entry={e} onConfirm={confirmEntry} onRemove={removeEntry} />
          ))}
        </div>
      </section>

      {sheet && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/60" onClick={() => setSheet(null)}>
          <div
            className="w-full rounded-t-3xl border-t border-border bg-card p-5 pb-10"
            onClick={(ev) => ev.stopPropagation()}
          >
            <p className="text-lg font-extrabold">
              {sheet} · {zone}
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Tap a chip to log it under {sheet} in {zone}.
            </p>
            <div className="flex flex-wrap gap-2">
              {CHIPS[sheet].map((c) => (
                <button
                  key={c}
                  onClick={async () => {
                    if (userId) await addTap(userId, sheet, zone, c);
                    setSheet(null);
                  }}
                  className="rounded-full border border-border bg-surface-raised px-4 py-3 text-sm font-semibold active:bg-primary active:text-primary-foreground"
                >
                  {c}
                </button>
              ))}
              {CHIPS[sheet].length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Use the camera below — the photo is the entry.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {status && (
        <div className="fixed inset-x-0 bottom-28 z-30 mx-auto max-w-md px-4">
          <p className="rounded-xl border border-primary/50 bg-card px-4 py-3 text-sm">{status}</p>
        </div>
      )}

      <CaptureBar onPhoto={onPhoto} onVoice={onVoice} recording={recording} />
    </main>
  );
}

function EntryCard({
  entry,
  onConfirm,
  onRemove,
}: {
  entry: Entry;
  onConfirm: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const url = usePhotoUrl(entry.photo_path);
  return (
    <article className="flex gap-3 rounded-2xl border border-border bg-card p-3">
      {url ? (
        <img src={url} alt={entry.label} className="h-20 w-20 rounded-xl object-cover" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface-raised text-2xl">
          {entry.source === "voice" ? "🎙" : "•"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          {entry.section} · {entry.zone}
        </p>
        <p className="truncate text-sm font-semibold">{entry.label}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(entry.captured_at).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {entry.check_me && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onConfirm(entry.id)}
              className="rounded-full bg-grade-amber px-3 py-2 text-xs font-bold text-background"
            >
              👍 Check me — confirm
            </button>
            <button
              onClick={() => onRemove(entry.id)}
              className="rounded-full border border-border px-3 py-2 text-xs font-bold"
            >
              Bin it
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
