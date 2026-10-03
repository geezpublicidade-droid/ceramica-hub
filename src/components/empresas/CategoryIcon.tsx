import {
  FlaskConical,
  Gavel,
  GraduationCap,
  HeartPulse,
  Laptop,
  Layers,
  Ruler,
  Scale,
  Sparkles,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  scale: Scale,
  "heart-pulse": HeartPulse,
  utensils: Utensils,
  sparkles: Sparkles,
  laptop: Laptop,
  "graduation-cap": GraduationCap,
  ruler: Ruler,
  "trending-up": TrendingUp,
  gavel: Gavel,
  "flask-conical": FlaskConical,
  layers: Layers,
};

/** Ícone linear da categoria (nome salvo em `categories.icon`); desconhecido cai em "layers". */
export function CategoryIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Layers;
  return <Icon className={className} strokeWidth={1.5} aria-hidden="true" />;
}
