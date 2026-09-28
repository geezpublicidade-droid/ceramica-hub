/** Pill de status reaproveitada por todo card do admin que precisa de um
 * badge colorido (fase de campanha, status de posição de anúncio, etc.) --
 * cada chamador só passa o label e a classe de cor já resolvida. */
export function StatusBadge({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${className}`}>{label}</span>;
}
