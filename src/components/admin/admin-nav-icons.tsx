type IconProps = { className?: string };

const base = "h-5 w-5 shrink-0";

/** Ícones de traço simples (stroke, 20x20) pro menu do painel administrativo
 * -- mesmo espírito dos ícones do dashboard da empresa (ver
 * dashboard/nav-icons.tsx), só que específicos das seções de admin. */

export function IconFinance({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 5.8v8.4M12.4 7.6c0-1-1-1.7-2.4-1.7s-2.4.7-2.4 1.7c0 2.4 4.8 1.2 4.8 3.6 0 1-1 1.7-2.4 1.7s-2.4-.7-2.4-1.7" />
    </svg>
  );
}

export function IconLgpd({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.8l6 2.2v4.2c0 4-2.6 6.9-6 8-3.4-1.1-6-4-6-8V5l6-2.2z" />
      <path d="M7.3 10l1.9 1.9L13 8" />
    </svg>
  );
}

export function IconAds({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.8 8.2v3.6a1 1 0 0 0 1 1h1.6l1.3 3.4a1 1 0 0 0 1.85-.7L7.6 12.8h1L17 15.6V4.4L8.6 7.2h-4.8a1 1 0 0 0-1 1z" />
      <path d="M8.6 7.2v5.6" />
    </svg>
  );
}

export function IconBlog({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 2.8h8.2l3.3 3.3v11a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1v-13.3a1 1 0 0 1 1-1z" />
      <path d="M6.8 9h6.4M6.8 12h6.4M6.8 15h4" />
    </svg>
  );
}

export function IconPartners({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.8 9.8l3.2-3.2a1.4 1.4 0 0 1 2 0l.6.6-4 4" />
      <path d="M17.2 9.8L14 6.6a1.4 1.4 0 0 0-2 0l-.6.6 4 4" />
      <path d="M4.4 10.4l3 3a1.6 1.6 0 0 0 2.3 0l.3-.3a1.6 1.6 0 0 1 2.3 0l.3.3a1.6 1.6 0 0 0 2.3 0l3-3" />
    </svg>
  );
}

export function IconLeads({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.8 3.5h14.4L11.7 10v5.3l-3.4 1.7V10L2.8 3.5z" />
    </svg>
  );
}

export function IconHotels({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.8 16.5V5a1 1 0 0 1 1-1h4.4a1 1 0 0 1 1 1v11.5" />
      <path d="M9.2 9.5h6a1 1 0 0 1 1 1v6" />
      <path d="M5 6.8h1.6M5 9.5h1.6M5 12.2h1.6M11.8 12.5h1.6M11.8 15h1.6" />
    </svg>
  );
}

export function IconAuditoriums({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.8" y="3.5" width="14.4" height="9.5" rx="1.4" />
      <path d="M6.5 16.5h7M10 13v3.5" />
    </svg>
  );
}

export function IconRealEstate({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L10 3l7 6.5" />
      <path d="M4.8 8.2v8.3h10.4V8.2" />
      <path d="M8.3 16.5v-4.3h3.4v4.3" />
    </svg>
  );
}

export function IconEvents({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.8" y="4" width="14.4" height="12.5" rx="1.6" />
      <path d="M2.8 7.8h14.4M6.2 2.5v3M13.8 2.5v3" />
      <circle cx="10" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconReviews({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3l2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7z" />
    </svg>
  );
}

export function IconUsers({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.2" cy="6.5" r="2.6" />
      <path d="M2 17c.7-2.9 2.6-4.5 5.2-4.5s4.5 1.6 5.2 4.5" />
      <path d="M12.8 4.3a2.6 2.6 0 0 1 0 4.9M15.6 17c-.5-2.2-1.6-3.6-3.3-4.3" />
    </svg>
  );
}
