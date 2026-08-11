import { ZONES, type Zone } from "@/lib/site-log";

export function ZoneStrip({
  zone,
  covered,
  onSelect,
}: {
  zone: Zone;
  covered: Set<Zone>;
  onSelect: (z: Zone) => void;
}) {
  return (
    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
      {ZONES.map((z) => {
        const active = z === zone;
        return (
          <button
            key={z}
            onClick={() => onSelect(z)}
            className={`flex snap-start items-center gap-2 whitespace-nowrap rounded-full border px-4 py-3 text-sm font-semibold transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/80"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${covered.has(z) ? "bg-grade-green" : "bg-muted-foreground/50"}`}
            />
            {z}
          </button>
        );
      })}
    </div>
  );
}