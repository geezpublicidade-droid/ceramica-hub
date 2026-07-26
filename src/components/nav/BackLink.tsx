export function BackLink({ href, label = "Voltar" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-white px-5 py-3 text-[16px] font-semibold text-foreground shadow-sm transition hover:border-foreground/30 hover:bg-foreground/5"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {label}
    </a>
  );
}
