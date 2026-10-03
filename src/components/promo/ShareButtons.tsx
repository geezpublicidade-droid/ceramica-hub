"use client";

import { socialShareUrl, withUtm, type SocialShareTarget } from "@/lib/share-links";
import { CopyButton } from "@/components/promo/CopyButton";

type ShareButtonsProps = {
  /** URL absoluta da página a compartilhar */
  url: string;
  text: string;
  /** nome da campanha nos links (aparece em utm_campaign) */
  campaign: string;
  labels: { title: string; copy: string; copied: string };
};

const TARGETS: { target: SocialShareTarget; label: string; source: string }[] = [
  { target: "whatsapp", label: "WhatsApp", source: "whatsapp" },
  { target: "facebook", label: "Facebook", source: "facebook" },
  { target: "linkedin", label: "LinkedIn", source: "linkedin" },
];

/** Compartilhar a página nas redes; cada botão leva a URL com utm_source da própria rede, para medir o retorno. */
export function ShareButtons({ url, text, campaign, labels }: ShareButtonsProps) {
  const link = (source: string) => withUtm(url, { source, medium: "compartilhar", campaign });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[13px] font-medium uppercase tracking-[0.14em] text-muted">{labels.title}</span>
      {TARGETS.map(({ target, label, source }) => (
        <a
          key={target}
          href={socialShareUrl(target, link(source), text)}
          target="_blank"
          rel="noopener noreferrer"
          className="neu inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-medium text-foreground"
        >
          {label}
        </a>
      ))}
      <CopyButton text={link("link_copiado")} label={labels.copy} copiedLabel={labels.copied} />
    </div>
  );
}
