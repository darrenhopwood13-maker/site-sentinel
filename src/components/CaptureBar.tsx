import { Link } from "@tanstack/react-router";
import { useRef } from "react";

export function CaptureBar({
  onPhoto,
  onVoice,
  recording,
}: {
  onPhoto: (file: File) => void;
  onVoice: () => void;
  recording: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 pb-6 pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPhoto(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => input.current?.click()}
          className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground active:scale-[0.98]"
        >
          📸 Photo
        </button>
        <button
          onClick={onVoice}
          className={`flex h-16 w-24 items-center justify-center rounded-2xl border text-lg font-bold transition-colors ${
            recording
              ? "animate-pulse border-destructive bg-destructive text-destructive-foreground"
              : "border-border bg-surface-raised text-foreground"
          }`}
        >
          {recording ? "■ Stop" : "🎙 Voice"}
        </button>
        <Link
          to="/reports"
          search={{ generate: undefined }}
          className="flex h-16 w-20 items-center justify-center rounded-2xl border border-primary/60 text-sm font-bold text-primary"
        >
          Reports
        </Link>
      </div>
    </div>
  );
}