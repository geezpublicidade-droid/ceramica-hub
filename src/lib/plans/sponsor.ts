import type { FeatureKey } from "./features.ts";

/** Recursos de patrocínio que o admin liga um a um na proposta (viram overrides com a janela de veiculação). */
export const SPONSOR_TOGGLES: readonly FeatureKey[] = [
  "tour_3d",
  "premium_benefits",
  "banner_home",
  "banner_category",
  "sponsor_carousel",
  "editorial_content",
  "sponsored_event",
  "segment_exclusivity",
  "sponsor_top_priority",
];
