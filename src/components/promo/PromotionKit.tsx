import QRCode from "qrcode";
import { CopyButton } from "@/components/promo/CopyButton";
import { SHARE_CHANNELS, trackedLink, type ShareChannelKey } from "@/lib/share-links";

type PromotionKitProps = {
  /** URL pública da empresa (sem UTM), ex.: https://ceramicahub.com.br/empresa/duavesso-studio */
  profileUrl: string;
  /** endereço do site (para montar os links das imagens) */
  siteUrl: string;
  slug: string;
  name: string;
};

const CHANNEL_COPY: Record<ShareChannelKey, { label: string; hint: string }> = {
  instagram_bio: { label: "Instagram · link da bio", hint: "Cole em “Site” no perfil do Instagram." },
  instagram_story: { label: "Instagram · stories", hint: "Use no adesivo de link dos stories." },
  instagram_post: { label: "Instagram · posts e reels", hint: "Para legendas, comentários fixados e anúncios." },
  facebook: { label: "Facebook", hint: "Para posts, grupos e anúncios no Facebook." },
  whatsapp: { label: "WhatsApp", hint: "Para mensagens, status e lista de transmissão." },
  google_business: { label: "Google Meu Negócio", hint: "Cole no botão “Site” ou “Agendamento” do seu perfil no Google." },
  linkedin: { label: "LinkedIn", hint: "Para posts e para a página da empresa." },
  email: { label: "Assinatura de e-mail", hint: "Coloque na assinatura dos seus e-mails." },
  qr_impresso: { label: "Materiais impressos (QR Code)", hint: "Cartão, balcão, folheto: o QR Code abaixo leva a este link." },
};

const ARTS = [
  { format: "feed", title: "Post (4:5)", hint: "Instagram e Facebook", aspect: "aspect-[4/5]" },
  { format: "story", title: "Story (9:16)", hint: "Stories e reels", aspect: "aspect-[9/16]" },
  { format: "og", title: "Link (1,91:1)", hint: "Miniatura ao colar o link", aspect: "aspect-[1200/630]" },
] as const;

/** Tudo para divulgar uma empresa: artes prontas para baixar e um link rastreado (UTM) por canal. */
export async function PromotionKit({ profileUrl, siteUrl, slug, name }: PromotionKitProps) {
  const links = SHARE_CHANNELS.map((channel) => ({
    key: channel.key,
    url: trackedLink(profileUrl, channel.key, "divulgacao"),
  }));
  const qrLink = links.find((link) => link.key === "qr_impresso")!.url;
  const qrDataUrl = await QRCode.toDataURL(qrLink, { margin: 1, width: 360, color: { dark: "#2e2e2e", light: "#ffffff" } });

  return (
    <div className="flex flex-col gap-8">
      <section className="glass-light rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Artes prontas</h2>
        <p className="mt-1 text-[15px] text-muted">
          Geradas com a logo e os dados de {name}. Baixe e poste, ou use em anúncios. Atualizam sozinhas quando o perfil muda.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {ARTS.map((art) => {
            const src = `${siteUrl}/api/og/empresa/${slug}?formato=${art.format}`;
            return (
              <figure key={art.format} className="flex flex-col gap-3">
                <div className={`w-full overflow-hidden rounded-2xl border border-border bg-white ${art.aspect}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada na hora, dimensões variam por formato */}
                  <img src={src} alt={`Arte ${art.title} de ${name}`} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <figcaption className="flex items-center justify-between gap-2">
                  <span>
                    <span className="block text-[15px] font-medium text-foreground">{art.title}</span>
                    <span className="block text-[13px] text-muted">{art.hint}</span>
                  </span>
                  <a href={src} download={`${slug}-${art.format}.png`} className="neu-primary inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-medium text-white">
                    Baixar
                  </a>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <section className="glass-light rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Links rastreados</h2>
        <p className="mt-1 text-[15px] text-muted">
          Use cada link no canal indicado. Assim o painel de Resultados mostra de onde vêm as visitas à sua página.
        </p>
        <ul className="mt-5 flex flex-col divide-y divide-border">
          {links.map((link) => (
            <li key={link.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-foreground">{CHANNEL_COPY[link.key].label}</p>
                <p className="text-[13px] text-muted">{CHANNEL_COPY[link.key].hint}</p>
                <p className="mt-1 truncate text-[12px] text-muted/80">{link.url}</p>
              </div>
              <CopyButton text={link.url} label="Copiar link" copiedLabel="Copiado!" />
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-light flex flex-wrap items-center gap-6 rounded-3xl p-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR Code em data URI */}
        <img src={qrDataUrl} alt={`QR Code para a página de ${name}`} width={180} height={180} className="rounded-2xl border border-border bg-white p-2" />
        <div className="min-w-[200px] flex-1">
          <h2 className="text-lg font-semibold text-foreground">QR Code para impressos</h2>
          <p className="mt-1 text-[15px] text-muted">Leva direto à sua página e conta como visita de “impresso”. Imprima em cartões, balcão ou folhetos.</p>
          <a href={qrDataUrl} download={`${slug}-qrcode.png`} className="neu mt-3 inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-medium text-foreground">
            Baixar QR Code
          </a>
        </div>
      </section>
    </div>
  );
}
