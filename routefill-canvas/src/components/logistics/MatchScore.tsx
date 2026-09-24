export function MatchScore({
  value,
  tone = "primary",
  label = "AI Match Score",
}: {
  value: number;
  tone?: "primary" | "muted";
  label?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span
          className={`text-[11px] uppercase tracking-[0.16em] ${
            tone === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        <span
          className={`font-display text-base font-bold ${
            tone === "primary" ? "text-primary-foreground" : "text-foreground"
          }`}
        >
          {value}%
        </span>
      </div>
      <div
        className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${
          tone === "primary" ? "bg-primary-foreground/25" : "bg-muted"
        }`}
      >
        <div
          className={`h-full rounded-full ${
            tone === "primary" ? "bg-primary-foreground" : "bg-primary"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
