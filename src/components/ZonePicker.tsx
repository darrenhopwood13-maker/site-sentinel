import { useState } from "react";
import { ZONES, type Zone } from "@/lib/site-log";

export function ZonePicker({
  zone,
  covered,
  onSelect,
}: {
  zone: Zone;
  covered: Set<Zone>;
  onSelect: (z: Zone) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-16 w-full items-center justify-between rounded-2xl border border-border bg-card px-4 text-left active:scale-[0.99]"
      >
        <span className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${covered.has(zone) ? "bg-grade-green" : "bg-muted-foreground/50"}`}
          />
          <span>
            <span className="block text-base font-bold">{zone}</span>
            <span className="text-xs text-muted-foreground">
              {covered.size}/{ZONES.length} zones covered
            </span>
          </span>
        </span>
        <span className="text-xs font-bold text-primary">Change zone ▾</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="w-full rounded-t-3xl border-t border-border bg-card p-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-extrabold">Pick your zone</p>
            <p className="mb-4 text-xs text-muted-foreground">
              A green dot means that zone already has a photo today.
            </p>
            <div className="space-y-2">
              {ZONES.map((z) => (
                <button
                  key={z}
                  onClick={() => {
                    onSelect(z);
                    setOpen(false);
                  }}
                  className={`flex h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left text-base font-semibold ${
                    z === zone
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface-raised text-foreground"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${covered.has(z) ? "bg-grade-green" : "bg-muted-foreground/50"}`}
                  />
                  {z}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
