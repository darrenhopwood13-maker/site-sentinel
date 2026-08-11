export function Logo({ word = "Report" }: { word?: string }) {
  return (
    <span className="text-xl tracking-tight">
      <span className="font-light text-foreground/80">instruct</span>
      <span className="font-extrabold text-primary">{word}</span>
    </span>
  );
}