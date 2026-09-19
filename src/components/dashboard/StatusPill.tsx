export type StatusPillTone = "positive" | "pending" | "neutral" | "negative";

const TONE_CLASSES: Record<StatusPillTone, string> = {
  positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  neutral: "bg-black/5 text-muted border-transparent",
  negative: "bg-red-50 text-red-600 border-red-200",
};

export function StatusPill({ label, tone }: { label: string; tone: StatusPillTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium ${TONE_CLASSES[tone]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
