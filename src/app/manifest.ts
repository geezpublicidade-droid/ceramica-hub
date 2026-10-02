import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cerâmica Hub",
    short_name: "Cerâmica Hub",
    description: "Empresas, benefícios e eventos do Espaço Cerâmica.",
    start_url: "/membro",
    scope: "/",
    display: "standalone",
    background_color: "#f6f2eb",
    theme_color: "#b3553a",
    lang: "pt-BR",
    icons: [
      { src: "/api/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/api/pwa-icon/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
