import { ImageResponse } from "next/og";

export const OG_FORMATS = {
  /** miniatura de link (Facebook, WhatsApp, Google, LinkedIn) */
  og: { width: 1200, height: 630 },
  /** post do Instagram/Facebook em retrato 4:5 */
  feed: { width: 1080, height: 1350 },
  /** story / reels */
  story: { width: 1080, height: 1920 },
} as const;
export type OgFormat = keyof typeof OG_FORMATS;

export function parseOgFormat(raw: string | null): OgFormat {
  return raw === "feed" || raw === "story" ? raw : "og";
}

const PRIMARY = "#b3553a";
const BACKGROUND = "#f6f2eb";
const FOREGROUND = "#2e2e2e";
const MUTED = "#86868b";
const MAX_LOGO_BYTES = 2_000_000;

/**
 * Logo da empresa como data URI PNG/JPEG (o gerador de imagem não lê WebP nem URL lenta). Falha de
 * rede, tipo estranho ou arquivo grande demais = null, e o cartão usa as iniciais.
 */
export async function loadLogoDataUri(url: string | undefined | null): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_LOGO_BYTES) return null;
    const type = response.headers.get("content-type") ?? "";
    if (/image\/(png|jpe?g)/i.test(type)) return `data:${type.split(";")[0]};base64,${buffer.toString("base64")}`;
    // WebP/AVIF/SVG: converte para PNG quando o sharp está disponível
    const { default: sharp } = await import("sharp");
    const png = await sharp(buffer).resize(480, 480, { fit: "inside" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export type CardContent = {
  format: OgFormat;
  /** linha pequena acima do título (ex.: "Saúde & Estética") */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** local/andar/sala ou contagem */
  meta?: string;
  logo: string | null;
  initials: string;
  /** frase de chamada no rodapé */
  cta: string;
};

function titleSize(length: number, format: OgFormat): number {
  const base = format === "og" ? 64 : 88;
  if (length > 48) return base * 0.62;
  if (length > 30) return base * 0.78;
  return base;
}

/** Cartão visual da marca (fundo areia, faixa terracota, logo em círculo) em qualquer formato. */
export function renderCard(content: CardContent): ImageResponse {
  const { format, title, subtitle, meta, logo, initials, cta, eyebrow } = content;
  const size = OG_FORMATS[format];
  const horizontal = format === "og";
  const logoSize = horizontal ? 230 : 340;
  const padX = horizontal ? 72 : 84;
  const padTop = format === "story" ? 230 : horizontal ? 56 : 84;
  const padBottom = format === "story" ? 270 : horizontal ? 52 : 84;

  const logoNode = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: logoSize,
        height: logoSize,
        borderRadius: logoSize,
        background: "#ffffff",
        border: "2px solid rgba(0,0,0,0.08)",
        boxShadow: "0 24px 60px -30px rgba(0,0,0,0.35)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- gerador de imagem (satori), não é página
        <img src={logo} alt="" width={Math.round(logoSize * 0.78)} height={Math.round(logoSize * 0.78)} style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ display: "flex", fontSize: logoSize * 0.38, fontWeight: 700, color: PRIMARY }}>{initials}</div>
      )}
    </div>
  );

  const textNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: horizontal ? "flex-start" : "center", textAlign: horizontal ? "left" : "center", flex: horizontal ? "1 1 auto" : "0 0 auto", marginLeft: horizontal ? 56 : 0, marginTop: horizontal ? 0 : 56 }}>
      {eyebrow && (
        <div style={{ display: "flex", fontSize: horizontal ? 26 : 34, letterSpacing: 3, textTransform: "uppercase", color: PRIMARY, fontWeight: 600, marginBottom: 14 }}>{eyebrow}</div>
      )}
      <div style={{ display: "flex", fontSize: titleSize(title.length, format), lineHeight: 1.08, fontWeight: 700, color: FOREGROUND }}>{title}</div>
      {subtitle && <div style={{ display: "flex", fontSize: horizontal ? 34 : 44, color: PRIMARY, marginTop: 18, fontWeight: 600 }}>{subtitle}</div>}
      {meta && <div style={{ display: "flex", fontSize: horizontal ? 28 : 36, color: MUTED, marginTop: 14 }}>{meta}</div>}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: BACKGROUND, padding: `${padTop}px ${padX}px ${padBottom}px`, position: "relative", justifyContent: "space-between" }}>
        <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: horizontal ? 18 : "100%", height: horizontal ? "100%" : 22, background: PRIMARY }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: horizontal ? "flex-start" : "center" }}>
          <div style={{ display: "flex", fontSize: horizontal ? 32 : 42, fontWeight: 700, color: FOREGROUND }}>Cerâmica</div>
          <div style={{ display: "flex", fontSize: horizontal ? 32 : 42, fontWeight: 700, color: PRIMARY, marginLeft: 10 }}>Hub</div>
        </div>

        <div style={{ display: "flex", flexDirection: horizontal ? "row" : "column", alignItems: "center", justifyContent: horizontal ? "flex-start" : "center" }}>
          {logoNode}
          {textNode}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: horizontal ? "space-between" : "center", flexDirection: horizontal ? "row" : "column" }}>
          <div style={{ display: "flex", fontSize: horizontal ? 28 : 38, color: FOREGROUND }}>{cta}</div>
          <div
            style={{
              display: "flex",
              marginTop: horizontal ? 0 : 20,
              padding: horizontal ? "12px 26px" : "16px 36px",
              borderRadius: 999,
              background: PRIMARY,
              color: "#ffffff",
              fontSize: horizontal ? 26 : 34,
              fontWeight: 600,
            }}
          >
            ceramicahub.com.br
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
