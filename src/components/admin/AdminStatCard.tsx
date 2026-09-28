/** Card de estatística reaproveitado pela home do /admin e por qualquer
 * resumo de seção (ex: publicidade) -- mesmo `rounded-2xl border p-4` com
 * destaque terracota opcional quando o número pede atenção (ex: pendências). */
export function AdminStatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-white/70"}`}>
      <p className="text-[20px] font-semibold text-foreground sm:text-[22px]">{value}</p>
      <p className="mt-1 text-[13px] text-muted">{label}</p>
    </div>
  );
}
