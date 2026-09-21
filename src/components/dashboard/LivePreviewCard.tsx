import Link from "next/link";
import type { Business } from "@/data/businesses";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import { editarHref } from "@/lib/dashboard-anchors";

type PreviewPhoto = { id: string; url: string };

/** Réplica em miniatura do card real da diretória (mesmo componente visual
 * de BusinessCardGrid) -- deixa o empresário ver com os próprios olhos como
 * a empresa aparece pra quem visita o Cerâmica Hub, em vez de só um link. */
export function LivePreviewCard({ business, photos }: { business: Business; photos: PreviewPhoto[] }) {
  return (
    <div className="glass-light rounded-3xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[15px] font-medium uppercase tracking-[0.15em] text-muted">
          Como visitantes veem sua página
        </p>
        {business.status === "approved" ? (
          <Link
            href={`/empresa/${business.slug}`}
            target="_blank"
            className="text-[14px] font-medium text-primary hover:underline"
          >
            Ver página completa →
          </Link>
        ) : (
          <span className="text-[13px] text-muted">Disponível após a aprovação</span>
        )}
      </div>

      <div className="mt-4 flex gap-5 rounded-2xl border border-border bg-white/70 p-5">
        <BusinessAvatar
          business={business}
          className="h-16 w-16 shrink-0 rounded-full bg-white"
          textClassName="text-[18px] font-semibold text-foreground"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[18px] font-semibold text-foreground">{business.name}</h3>
            {business.verified && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">
                Verificado
              </span>
            )}
          </div>
          <p className="mt-1 text-[14px] text-muted">{business.floor}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {business.description || "Sua página ainda não tem descrição — é a primeira coisa que visitantes leem."}
          </p>
        </div>
      </div>

      {photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {photos.slice(0, 6).map((photo) => (
            <div key={photo.id} className="aspect-square overflow-hidden rounded-xl bg-black/5">
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-primary/5 px-4 py-3 text-[14px] text-foreground">
          Você ainda não adicionou fotos. Perfis com fotos recebem mais contatos —{" "}
          <Link href={editarHref("fotos")} className="font-medium text-primary hover:underline">
            adicionar agora
          </Link>
          .
        </p>
      )}
    </div>
  );
}
