import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PLAN_FEATURES, FEATURE_KEYS, UNLIMITED, normalizeFeatureKey } from "../plans/features.ts";
import {
  canAccess,
  computeUsage,
  diffFeatures,
  getLimit,
  publishedItems,
  resolveEffectivePlan,
  resolveFeatures,
  type PlanState,
} from "../plans/resolve.ts";

const F = DEFAULT_PLAN_FEATURES;
const NOW = new Date("2026-10-07T12:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000).toISOString();

const state = (patch: Partial<PlanState> = {}): PlanState => ({
  plan: "destaque",
  status: "active",
  startedAt: day(-30),
  expiresAt: day(10),
  updatedAt: day(-30),
  manualOverride: false,
  trial: { status: "none", plan: null, endsAt: null },
  ...patch,
});

describe("matriz de fábrica segue a especificação", () => {
  it("Gratuito: só página básica", () => {
    assert.equal(getLimit(F.presenca, "services"), 0);
    assert.equal(getLimit(F.presenca, "gallery_images"), 0);
    assert.equal(getLimit(F.presenca, "active_promotions"), 0);
    for (const key of ["whatsapp", "social_media", "business_hours", "full_description", "lead_forms", "tour_3d", "metrics_summary"]) {
      assert.equal(canAccess(F.presenca, key), false, key);
    }
    assert.equal(canAccess(F.presenca, "basic_page"), true);
    assert.equal(canAccess(F.presenca, "claim_profile"), true);
    assert.equal(F.presenca.landing_layout, "basic");
  });

  it("Profissional: 3 serviços, 3 fotos, 1 promoção, sem cupom, vídeo, formulário nem 3D", () => {
    assert.deepEqual([getLimit(F.profissional, "services"), getLimit(F.profissional, "gallery_images"), getLimit(F.profissional, "active_promotions")], [3, 3, 1]);
    assert.equal(canAccess(F.profissional, "whatsapp"), true);
    assert.equal(canAccess(F.profissional, "trackable_coupons"), false);
    assert.equal(canAccess(F.profissional, "featured_video"), false);
    assert.equal(canAccess(F.profissional, "lead_form"), false);
    assert.equal(canAccess(F.profissional, "custom_hero"), false);
    assert.equal(F.profissional.landing_layout, "standard");
  });

  it("Destaque: 6/6/4, cupons e prioridade; ainda sem vídeo, formulário e 3D", () => {
    assert.deepEqual([getLimit(F.destaque, "services"), getLimit(F.destaque, "gallery_images"), getLimit(F.destaque, "active_promotions")], [6, 6, 4]);
    for (const key of ["trackable_coupons", "category_priority", "search_priority", "rotating_card", "opportunities", "metrics_basic"]) {
      assert.equal(canAccess(F.destaque, key), true, key);
    }
    assert.equal(canAccess(F.destaque, "lead_forms"), false);
    assert.equal(canAccess(F.destaque, "featured_videos"), false);
    assert.equal(F.destaque.landing_layout, "standard");
  });

  it("Experiência: serviços ilimitados, 30 fotos, 1 vídeo, landing completa, sem 3D", () => {
    assert.equal(F.experiencia.services, UNLIMITED);
    assert.equal(getLimit(F.experiencia, "services"), Infinity);
    assert.equal(getLimit(F.experiencia, "gallery_images"), 30);
    assert.equal(getLimit(F.experiencia, "featured_videos"), 1);
    for (const key of ["custom_hero", "custom_sections", "lead_forms", "faq", "metrics_full"]) assert.equal(canAccess(F.experiencia, key), true, key);
    assert.equal(canAccess(F.experiencia, "tour_3d"), false);
    assert.equal(F.experiencia.landing_layout, "landing");
  });

  it("Premium: tudo do Experiência + tour 3D, selo, networking e 1 produção 3D", () => {
    for (const key of FEATURE_KEYS) {
      if (canAccess(F.experiencia, key)) assert.equal(canAccess(F.premium, key), true, `premium perdeu ${key}`);
    }
    for (const key of ["tour_3d", "premium_badge", "institutional_content", "networking_priority", "metrics_premium"]) assert.equal(canAccess(F.premium, key), true, key);
    assert.equal(getLimit(F.premium, "tour3d_productions_per_cycle"), 1);
  });

  it("Patrocinador: base do Experiência + patrocínio; tour 3D e banners só por override", () => {
    for (const key of FEATURE_KEYS) {
      if (canAccess(F.experiencia, key)) assert.equal(canAccess(F.patrocinador, key), true, `patrocinador perdeu ${key}`);
    }
    for (const key of ["metrics_campaign", "custom_proposal", "exclusive_ad_spaces", "institutional_landing", "campaign_segmentation"]) assert.equal(canAccess(F.patrocinador, key), true, key);
    for (const key of ["tour_3d", "banner_home", "banner_category", "sponsor_carousel", "sponsored_event", "segment_exclusivity"]) assert.equal(canAccess(F.patrocinador, key), false, key);
  });

  it("cada plano superior mantém os limites numéricos do anterior", () => {
    const ladder = ["presenca", "profissional", "destaque", "experiencia", "premium"] as const;
    for (const key of ["services", "gallery_images", "active_promotions", "featured_videos"]) {
      for (let i = 1; i < ladder.length; i += 1) {
        assert.ok(getLimit(F[ladder[i]], key) >= getLimit(F[ladder[i - 1]], key), `${key}: ${ladder[i]} < ${ladder[i - 1]}`);
      }
    }
  });
});

describe("chaves e apelidos", () => {
  it("aceita os nomes da especificação", () => {
    assert.equal(normalizeFeatureKey("featured_video"), "featured_videos");
    assert.equal(normalizeFeatureKey("full_metrics"), "metrics_full");
    assert.equal(normalizeFeatureKey("nao_existe"), null);
    assert.equal(canAccess(F.premium, "nao_existe"), false);
  });
});

describe("resolveEffectivePlan", () => {
  const at = { now: NOW, graceDays: 7 };

  it("ativo e dentro do prazo vale o plano contratado", () => {
    const r = resolveEffectivePlan(state(), at);
    assert.equal(r.plan, "destaque");
    assert.equal(r.reason, "active");
    assert.equal(r.daysUntilExpiry, 10);
    assert.equal(r.downgraded, false);
  });

  it("vencido dentro da tolerância mantém o plano e avisa", () => {
    const r = resolveEffectivePlan(state({ expiresAt: day(-3) }), at);
    assert.equal(r.plan, "destaque");
    assert.equal(r.inGrace, true);
    assert.ok(r.graceEndsAt);
  });

  it("vencido depois da tolerância volta ao gratuito", () => {
    const r = resolveEffectivePlan(state({ expiresAt: day(-8) }), at);
    assert.equal(r.plan, "presenca");
    assert.equal(r.reason, "free_expired");
    assert.equal(r.downgraded, true);
    assert.equal(r.contractedPlan, "destaque");
  });

  it("a tolerância é configurável", () => {
    assert.equal(resolveEffectivePlan(state({ expiresAt: day(-8) }), { now: NOW, graceDays: 15 }).plan, "destaque");
    assert.equal(resolveEffectivePlan(state({ expiresAt: day(-1) }), { now: NOW, graceDays: 0 }).plan, "presenca");
  });

  it("inadimplente (past_due) conta a tolerância a partir do vencimento", () => {
    assert.equal(resolveEffectivePlan(state({ status: "past_due", expiresAt: day(-2) }), at).plan, "destaque");
    assert.equal(resolveEffectivePlan(state({ status: "past_due", expiresAt: day(-9) }), at).plan, "presenca");
  });

  it("suspenso, pendente e expirado ficam no gratuito", () => {
    assert.equal(resolveEffectivePlan(state({ status: "suspended" }), at).reason, "free_suspended");
    assert.equal(resolveEffectivePlan(state({ status: "pending" }), at).reason, "free_pending");
    assert.equal(resolveEffectivePlan(state({ status: "expired" }), at).plan, "presenca");
  });

  it("cancelado vale até o vencimento e depois cai", () => {
    assert.equal(resolveEffectivePlan(state({ status: "canceled", expiresAt: day(5) }), at).reason, "canceled_until_expiry");
    assert.equal(resolveEffectivePlan(state({ status: "canceled", expiresAt: day(-1) }), at).plan, "presenca");
    assert.equal(resolveEffectivePlan(state({ status: "canceled", expiresAt: null }), at).plan, "presenca");
  });

  it("cortesia ignora vencimento, mas não a suspensão", () => {
    assert.equal(resolveEffectivePlan(state({ manualOverride: true, expiresAt: day(-90) }), at).plan, "destaque");
    assert.equal(resolveEffectivePlan(state({ manualOverride: true, expiresAt: day(-90) }), at).reason, "courtesy");
    assert.equal(resolveEffectivePlan(state({ manualOverride: true, status: "suspended" }), at).plan, "presenca");
  });

  it("sem vencimento fica ativo para sempre", () => {
    assert.equal(resolveEffectivePlan(state({ expiresAt: null }), at).plan, "destaque");
  });

  it("teste ativo sobe o plano temporariamente; teste vencido não", () => {
    const free = state({ plan: "presenca", expiresAt: null, trial: { status: "active", plan: "destaque", endsAt: day(5) } });
    assert.equal(resolveEffectivePlan(free, at).plan, "destaque");
    assert.equal(resolveEffectivePlan(free, at).reason, "trial");
    const ended = state({ plan: "presenca", expiresAt: null, trial: { status: "active", plan: "destaque", endsAt: day(-1) } });
    assert.equal(resolveEffectivePlan(ended, at).plan, "presenca");
    const lower = state({ plan: "premium", expiresAt: null, trial: { status: "active", plan: "destaque", endsAt: day(5) } });
    assert.equal(resolveEffectivePlan(lower, at).plan, "premium");
  });
});

describe("overrides de recurso", () => {
  it("liga o tour 3D no patrocinador e respeita a validade", () => {
    const active = resolveFeatures(F.patrocinador, "patrocinador", [{ featureKey: "tour_3d", value: true }], NOW);
    assert.equal(canAccess(active, "tour_3d"), true);
    const expired = resolveFeatures(F.patrocinador, "patrocinador", [{ featureKey: "tour_3d", value: true, expiresAt: day(-1) }], NOW);
    assert.equal(canAccess(expired, "tour_3d"), false);
    const future = resolveFeatures(F.patrocinador, "patrocinador", [{ featureKey: "tour_3d", value: true, startsAt: day(2) }], NOW);
    assert.equal(canAccess(future, "tour_3d"), false);
  });

  it("override de limite e desligamento de recurso", () => {
    const f = resolveFeatures(F.profissional, "profissional", [{ featureKey: "services", value: 5 }, { featureKey: "whatsapp", value: false }], NOW);
    assert.equal(getLimit(f, "services"), 5);
    assert.equal(canAccess(f, "whatsapp"), false);
  });

  it("recurso ausente no banco cai no padrão de fábrica; plano desconhecido cai no gratuito", () => {
    assert.equal(canAccess(resolveFeatures({ services: 9 }, "destaque", [], NOW), "trackable_coupons"), true);
    assert.equal(getLimit(resolveFeatures(undefined, "plano-inexistente", [], NOW), "services"), 0);
  });
});

describe("diffFeatures (confirmação de troca de plano)", () => {
  it("destaque → profissional perde cupons, prioridade e quantidade", () => {
    const diff = diffFeatures(F.destaque, F.profissional);
    const lost = diff.lost.map((c) => c.key);
    for (const key of ["trackable_coupons", "category_priority", "rotating_card", "services", "gallery_images", "active_promotions"]) assert.ok(lost.includes(key as never), key);
    assert.equal(diff.gained.length, 0);
  });

  it("profissional → experiência libera formulário, vídeo e landing", () => {
    const gained = diffFeatures(F.profissional, F.experiencia).gained.map((c) => c.key);
    for (const key of ["lead_forms", "featured_videos", "custom_hero", "faq", "metrics_full"]) assert.ok(gained.includes(key as never), key);
  });

  it("planos iguais não geram diferença", () => {
    const diff = diffFeatures(F.premium, F.premium);
    assert.equal(diff.gained.length + diff.lost.length + diff.changed.length, 0);
  });
});

describe("conteúdo publicado x limite", () => {
  it("publica só os ativos até o limite e nunca descarta o resto", () => {
    const items = [{ id: 1 }, { id: 2, active: false }, { id: 3 }, { id: 4 }, { id: 5 }];
    assert.deepEqual(publishedItems(items, 2).map((i) => i.id), [1, 3]);
    assert.deepEqual(publishedItems(items, Infinity).map((i) => i.id), [1, 3, 4, 5]);
    assert.deepEqual(publishedItems(items, 0), []);
    assert.equal(items.length, 5);
  });

  it("uso x limite informa excedente depois de um downgrade", () => {
    const usage = computeUsage(F.profissional, { services: 6, gallery_images: 2, active_promotions: 1, featured_videos: 0 });
    const services = usage.find((row) => row.key === "services")!;
    assert.equal(services.over, true);
    assert.equal(services.remaining, 0);
    assert.equal(usage.find((row) => row.key === "gallery_images")!.remaining, 1);
    assert.equal(usage.find((row) => row.key === "active_promotions")!.percent, 100);
    const unlimited = computeUsage(F.experiencia, { services: 40 }).find((row) => row.key === "services")!;
    assert.equal(unlimited.over, false);
    assert.equal(unlimited.remaining, Infinity);
  });
});
