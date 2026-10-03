import { loadLogoDataUri, parseOgFormat, renderCard } from "@/lib/og/card";
import { getBusinessBySlug } from "@/lib/services/platform";

export const dynamic = "force-dynamic";

/**
 * Imagem de compartilhamento/arte da empresa: `?formato=og` (miniatura de link), `feed` (Instagram 4:5)
 * ou `story`. Só empresa aprovada; usa a logo e os dados reais cadastrados, nunca foto de capa sem autorização.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const format = parseOgFormat(new URL(request.url).searchParams.get("formato"));

  const business = await getBusinessBySlug(slug);
  if (!business || business.status !== "approved") return new Response("Não encontrada", { status: 404 });

  return renderCard({
    format,
    eyebrow: business.verified ? "Empresa verificada" : "No Espaço Cerâmica",
    title: business.name,
    subtitle: business.category,
    meta: business.floor,
    logo: await loadLogoDataUri(business.logo),
    initials: business.initials,
    cta: "Veja no Cerâmica Hub",
  });
}
