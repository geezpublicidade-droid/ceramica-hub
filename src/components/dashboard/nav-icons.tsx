type IconProps = { className?: string };

const base = "h-5 w-5 shrink-0";

/** Ícones de traço simples (stroke, 20x20) pro menu do painel -- sem lib
 * externa, mesmo espírito dos SVGs inline já usados no resto do site
 * (BackLink, CollectiveMovement). */

export function IconOverview({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="7" height="7" rx="1.5" />
      <rect x="10.5" y="2.5" width="7" height="4.5" rx="1.5" />
      <rect x="10.5" y="9.5" width="7" height="8" rx="1.5" />
      <rect x="2.5" y="11.5" width="7" height="6" rx="1.5" />
    </svg>
  );
}

export function IconProfile({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6.5" r="3.25" />
      <path d="M3.5 17c.9-3.3 3.6-5 6.5-5s5.6 1.7 6.5 5" />
    </svg>
  );
}

export function IconPhotos({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4" width="15" height="12" rx="2" />
      <circle cx="7" cy="8.5" r="1.4" />
      <path d="M2.5 14l4.2-4.2c.7-.7 1.7-.7 2.4 0l1.4 1.4M11.5 12.5l1-1c.7-.7 1.7-.7 2.4 0l2.6 2.6" />
    </svg>
  );
}

export function IconServices({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6.5" width="15" height="9.5" rx="2" />
      <path d="M7 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M2.5 10.5h15" />
    </svg>
  );
}

export function IconPromotions({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.8 2.8l6.4 6.4a1.7 1.7 0 0 1 0 2.4l-5.6 5.6a1.7 1.7 0 0 1-2.4 0L2.8 10.8V4.5A1.7 1.7 0 0 1 4.5 2.8h6.3z" />
      <circle cx="6.7" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconResults({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17V9.5M8 17V3M13 17v-6M18 17v-3" />
    </svg>
  );
}

export function IconPlan({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M2.5 8h15" />
      <path d="M5.5 12h3" />
    </svg>
  );
}

export function IconSettings({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.8v1.7M10 15.5v1.7M17.2 10h-1.7M4.5 10H2.8M15 5l-1.2 1.2M6.2 13.8L5 15M15 15l-1.2-1.2M6.2 6.2L5 5" />
    </svg>
  );
}

export function IconSupport({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.2" />
      <circle cx="10" cy="10" r="3" />
      <path d="M4.9 4.9l2.9 2.9M15.1 4.9l-2.9 2.9M4.9 15.1l2.9-2.9M15.1 15.1l-2.9-2.9" />
    </svg>
  );
}

export function IconCoupon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8.2a1.8 1.8 0 0 0 0 3.6V15a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-3.2a1.8 1.8 0 0 1 0-3.6V5a1 1 0 0 0-1-1h-13a1 1 0 0 0-1 1v3.2z" />
      <path d="M8 4v12" strokeDasharray="1.6 2.2" />
    </svg>
  );
}
