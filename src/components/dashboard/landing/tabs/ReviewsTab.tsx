import type { TabProps } from "../types";
import { TabIntro } from "../ui";

const STATUS: Record<string, { label: string; className: string }> = {
  aprovado: { label: "Publicada", className: "bg-whatsapp/10 text-whatsapp" },
  pendente: { label: "Em moderação", className: "bg-amber-100 text-amber-800" },
  rejeitado: { label: "Não publicada", className: "bg-black/5 text-muted" },
};

/** Depoimentos: só leitura. A moderação é feita pela equipe do Hub antes de qualquer avaliação ir ao ar. */
export function ReviewsTab({ data }: TabProps) {
  const { reviews } = data;
  return (
    <div className="space-y-5">
      <TabIntro>As avaliações vêm de membros logados e passam por moderação antes de aparecer na página. Em áreas regulamentadas (como saúde), seguimos as regras do conselho profissional. Sem avaliação publicada, a seção fica só com o convite para avaliar.</TabIntro>
      {reviews.length === 0 ? (
        <p className="text-[14.5px] text-muted">Ainda não há avaliações. Peça a clientes que avaliem pela página da empresa.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const status = STATUS[review.status] ?? STATUS.pendente;
            return (
              <li key={review.id} className="rounded-lg border border-border bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <strong className="text-[14.5px]">{review.name}</strong>
                  <span className="text-[14px] text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${status.className}`}>{status.label}</span>
                </div>
                <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/80">{review.comment}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
