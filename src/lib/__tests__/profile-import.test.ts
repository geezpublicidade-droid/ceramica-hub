import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categoryFromGoogleTypes, draftFromGooglePlace, scheduleFromGoogle, whatsappFromGoogle } from "../google/map-place.ts";
import { completenessScore, draftFromPayload, emptyDraft, mergeImport } from "../profile/draft.ts";

describe("scheduleFromGoogle", () => {
  it("converte domingo=0 para sun e ordena as faixas", () => {
    const schedule = scheduleFromGoogle([
      { open: { day: 1, hour: 14, minute: 0 }, close: { day: 1, hour: 18, minute: 0 } },
      { open: { day: 1, hour: 8, minute: 0 }, close: { day: 1, hour: 12, minute: 0 } },
      { open: { day: 0, hour: 9, minute: 30 }, close: { day: 0, hour: 13, minute: 0 } },
    ]);
    assert.deepEqual(schedule?.mon, [["08:00", "12:00"], ["14:00", "18:00"]]);
    assert.deepEqual(schedule?.sun, [["09:30", "13:00"]]);
  });

  it("fechamento no dia seguinte é cortado em 23:59 e período sem fechamento vira 24h", () => {
    const schedule = scheduleFromGoogle([
      { open: { day: 5, hour: 18, minute: 0 }, close: { day: 6, hour: 2, minute: 0 } },
      { open: { day: 2, hour: 0, minute: 0 } },
    ]);
    assert.deepEqual(schedule?.fri, [["18:00", "23:59"]]);
    assert.deepEqual(schedule?.tue, [["00:00", "23:59"]]);
  });

  it("sem períodos devolve null", () => {
    assert.equal(scheduleFromGoogle(undefined), null);
    assert.equal(scheduleFromGoogle([]), null);
  });
});

describe("mapeamento do lugar", () => {
  it("escolhe a categoria pelo tipo do Google", () => {
    assert.equal(categoryFromGoogleTypes(["dentist"]), "Saúde & Estética");
    assert.equal(categoryFromGoogleTypes(["lawyer"]), "Direito");
    assert.equal(categoryFromGoogleTypes(["car_wash"]), "");
  });

  it("extrai o WhatsApp sem o código do país", () => {
    assert.equal(whatsappFromGoogle("(11) 4000-1234", "+55 11 4000-1234"), "1140001234");
    assert.equal(whatsappFromGoogle("(11) 94000-1234", undefined), "11940001234");
    assert.equal(whatsappFromGoogle("123", undefined), "");
  });

  it("site do Instagram vira @usuario em vez de site", () => {
    const draft = draftFromGooglePlace({ websiteUri: "https://www.instagram.com/minha.loja/?hl=pt" });
    assert.equal(draft.instagram, "@minha.loja");
    assert.equal(draft.websiteUrl, "");
  });
});

describe("rascunho do perfil", () => {
  it("a importação só preenche o que está vazio, a menos que se peça para sobrescrever", () => {
    const typed = { ...emptyDraft, name: "Minha Loja" };
    const imported = { name: "Nome do Google", websiteUrl: "https://x.com.br" };
    assert.equal(mergeImport(typed, imported).name, "Minha Loja");
    assert.equal(mergeImport(typed, imported).websiteUrl, "https://x.com.br");
    assert.equal(mergeImport(typed, imported, true).name, "Nome do Google");
  });

  it("payload estranho do banco vira rascunho vazio sem estourar", () => {
    assert.deepEqual(draftFromPayload(null), emptyDraft);
    const draft = draftFromPayload({ name: 5, services: [{ name: "Corte" }, "lixo", { name: "" }], photos: ["https://a.com/1.jpg", 3], schedule: "x" });
    assert.equal(draft.name, "");
    assert.deepEqual(draft.services, [{ name: "Corte", description: "", price: "" }]);
    assert.deepEqual(draft.photos, ["https://a.com/1.jpg"]);
    assert.equal(draft.schedule, null);
  });

  it("a pontuação cresce conforme o perfil é preenchido", () => {
    assert.equal(completenessScore(emptyDraft), 0);
    const full = {
      ...emptyDraft,
      shortDescription: "x".repeat(50),
      logoUrl: "l",
      coverPhotoUrl: "c",
      whatsapp: "11999999999",
      instagram: "@a",
      openingHoursText: "8h às 18h",
      services: [1, 2, 3].map((n) => ({ name: `s${n}`, description: "", price: "" })),
      photos: ["a", "b", "c"],
      faqs: [1, 2].map((n) => ({ question: `q${n}`, answer: "a" })),
      differentials: ["d"],
    };
    assert.equal(completenessScore(full), 100);
  });
});
