export function formatStage(stage: string): string {
  return stage.replace(/_/g, " ");
}

export function formatPbv(pbv: number | null): string {
  if (pbv === null || Number.isNaN(pbv)) return "—";
  return pbv.toFixed(1);
}

export function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const day = 86_400_000;
  if (diffMs < 60_000) return "just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  if (diffMs < 30 * day) return `${Math.floor(diffMs / day)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
