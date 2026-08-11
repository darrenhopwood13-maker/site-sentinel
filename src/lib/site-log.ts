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
  captured_at: string;
  source: "tap" | "photo" | "voice";
  label: string;
  photo_path?: string | null;
  check_me: boolean;
};

export const DISCLAIMER =
  "This AI analysis is an advisory tool. Final sequence decisions must be verified on-site by the Lead Site Manager.";

export function today() {
  return new Date().toISOString().slice(0, 10);
}