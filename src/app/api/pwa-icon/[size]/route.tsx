import { ImageResponse } from "next/og";

const ALLOWED_SIZES = [180, 192, 512];

/** Ícone do app gerado na hora: monograma "CH" sobre o terracota da marca. */
export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: rawSize } = await params;
  const size = Number(rawSize);
  if (!ALLOWED_SIZES.includes(size)) return new Response("Tamanho inválido.", { status: 400 });

  // Ícone "maskable" precisa de margem de segurança (~20%) pro sistema recortar.
  const maskable = new URL(request.url).searchParams.get("maskable") === "1";
  const fontSize = Math.round(size * (maskable ? 0.34 : 0.46));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b3553a",
          color: "#f6f2eb",
          fontSize,
          fontWeight: 700,
          letterSpacing: -fontSize * 0.04,
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        CH
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
