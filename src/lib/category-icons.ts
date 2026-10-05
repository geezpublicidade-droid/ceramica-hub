import {
  Scale,
  HeartPulse,
  UtensilsCrossed,
  Shirt,
  Megaphone,
  GraduationCap,
  PenTool,
  TrendingUp,
  Gavel,
  FlaskConical,
  Ellipsis,
} from "lucide-react";

/** Ícone de cada categoria real (src/data/businesses.ts), usado na faixa da home e no menu. */
export const CATEGORY_ICONS: Record<string, typeof Scale> = {
  "Contabilidade & Jurídico": Scale,
  "Saúde & Estética": HeartPulse,
  Alimentação: UtensilsCrossed,
  "Moda & Beleza": Shirt,
  "Tecnologia & Marketing": Megaphone,
  Educação: GraduationCap,
  "Design & Arquitetura": PenTool,
  Investimentos: TrendingUp,
  Direito: Gavel,
  Laboratório: FlaskConical,
  Outros: Ellipsis,
};
