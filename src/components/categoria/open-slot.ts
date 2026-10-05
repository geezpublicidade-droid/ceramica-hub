import type { CSSProperties } from "react";

/** Fundos das vagas livres ("Anuncie aqui"): variações da paleta terracota/grafite, alternadas por posição. */
const OPEN_SLOT_BACKGROUNDS: CSSProperties[] = [
  { backgroundColor: "var(--primary)", backgroundImage: "radial-gradient(circle at 80% 15%, rgba(255,255,255,0.22), transparent 55%)" },
  {
    backgroundColor: "#2e2e2e",
    backgroundImage:
      "radial-gradient(circle at 25% 20%, color-mix(in srgb, var(--primary) 60%, transparent), transparent 62%), repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)",
  },
  {
    backgroundColor: "color-mix(in srgb, var(--primary) 72%, #000)",
    backgroundImage: "radial-gradient(circle at 15% 85%, rgba(255,255,255,0.18), transparent 55%)",
  },
];

export function openSlotBackground(index: number): CSSProperties {
  return OPEN_SLOT_BACKGROUNDS[index % OPEN_SLOT_BACKGROUNDS.length];
}
