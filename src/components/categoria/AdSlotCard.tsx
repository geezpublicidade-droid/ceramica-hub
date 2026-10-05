import { ArrowRight, Megaphone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { openSlotBackground } from "./open-slot";

type AdSlotCardProps = {
  index: number;
  title: string;
  description: string;
  ctaLabel: string;
  badge: string;
  href: string;
};

/** Vaga de destaque livre na grade: cor da marca + "Anuncie aqui", leva à página de planos. */
export function AdSlotCard({ index, title, description, ctaLabel, badge, href }: AdSlotCardProps) {
  return (
    <Link
      href={href}
      className="group lift relative flex aspect-video min-h-[190px] flex-col justify-end overflow-hidden rounded-2xl p-5 text-white"
      style={openSlotBackground(index)}
    >
      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-medium text-primary">
        <Megaphone aria-hidden="true" className="h-3.5 w-3.5" />
        {badge}
      </span>
      <p className="text-[clamp(1.3rem,2.2vw,1.7rem)] font-semibold leading-tight">{title}</p>
      <p className="mt-1 line-clamp-2 text-[14px] text-white/85">{description}</p>
      <span className="mt-3 inline-flex items-center gap-2 text-[15px] font-medium">
        {ctaLabel}
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
