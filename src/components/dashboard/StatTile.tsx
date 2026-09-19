type StatTileProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-[15px] text-muted">{label}</p>
      {hint && <p className="mt-0.5 text-[13px] text-muted/80">{hint}</p>}
    </div>
  );
}
