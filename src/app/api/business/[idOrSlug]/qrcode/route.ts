import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getBusinessById, getBusinessBySlug, UUID_RE } from "@/lib/services/platform";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** QR Code do perfil público de uma empresa — pra placas de parceiro físicas
 * (masterplan 2026-2030, produto físico). Aceita id ou slug, mesmo padrão
 * de resolveBusiness() em empresa/[slug]/page.tsx. */
export async function GET(request: Request, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  const business = UUID_RE.test(idOrSlug) ? await getBusinessById(idOrSlug) : await getBusinessBySlug(idOrSlug);
  if (!business || business.status !== "approved") {
    return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  }

  const targetUrl = `${siteUrl}/empresa/${business.slug}`;
  const png = await QRCode.toBuffer(targetUrl, { type: "png", width: 640, margin: 2 });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qrcode-${business.slug}.png"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
