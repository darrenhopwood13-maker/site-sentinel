import { useCallback, useEffect, useState } from "react";

export type Zone = "Ground" | "Level 1" | "Level 2" | "Core" | "Roof" | "Compound";
export const ZONES: Zone[] = ["Ground", "Level 1", "Level 2", "Core", "Roof", "Compound"];

export type Section =
  | "Progress"
  | "Deliveries"
  | "Labour"
  | "Plant"
  | "Issues"
  | "Safety"
  | "Visitors"
  | "Photos";

export const SECTIONS: { key: Section; icon: string; hint: string }[] = [
  { key: "Progress", icon: "🏗", hint: "Work done" },
  { key: "Deliveries", icon: "🚚", hint: "Materials in" },
  { key: "Labour", icon: "👷", hint: "Rolled forward" },
  { key: "Plant", icon: "🚜", hint: "On hire" },
  { key: "Issues", icon: "⚠", hint: "Blockers" },
  { key: "Safety", icon: "🦺", hint: "Observations" },
  { key: "Visitors", icon: "🪪", hint: "On site" },
  { key: "Photos", icon: "📸", hint: "Evidence" },
];

export type Entry = {
  id: string;
  section: Section;
  zone: Zone;
  at: string;
  source: "tap" | "photo" | "voice";
  label: string;
  photo?: string;
  checkMe?: boolean;
};

const KEY = "instructreport.day";

function today() {
  return new Date().toISOString().slice(0, 10);
}

type DayState = { date: string; zone: Zone; entries: Entry[] };

function read(): DayState {
  if (typeof window === "undefined") return { date: today(), zone: "Ground", entries: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as DayState | null;
    if (raw && raw.date === today()) return raw;
  } catch {
    /* ignore */
  }
  return { date: today(), zone: "Ground", entries: [] };
}

export function useSiteLog() {
  const [state, setState] = useState<DayState>({ date: today(), zone: "Ground", entries: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const setZone = useCallback((zone: Zone) => setState((s) => ({ ...s, zone })), []);

  const add = useCallback(
    (entry: Omit<Entry, "id" | "at" | "zone"> & { zone?: Zone }) =>
      setState((s) => ({
        ...s,
        entries: [
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            zone: entry.zone ?? s.zone,
            ...entry,
          },
          ...s.entries,
        ],
      })),
    [],
  );

  const confirm = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        entries: s.entries.map((e) => (e.id === id ? { ...e, checkMe: false } : e)),
      })),
    [],
  );

  const remove = useCallback(
    (id: string) => setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) })),
    [],
  );

  return { ...state, ready, setZone, add, confirm, remove };
}

export const DISCLAIMER =
  "This AI analysis is an advisory tool. Final sequence decisions must be verified on-site by the Lead Site Manager.";