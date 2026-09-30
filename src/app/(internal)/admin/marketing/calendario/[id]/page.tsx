import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth-guards";
import {
  CONTENT_CHANNEL_LABEL,
  CONTENT_KIND_LABEL,
  CONTENT_STATUS_LABEL,
  getContentComments,
  getContentItemById,
  getContentVersions,
} from "@/lib/services/content-calendar";
import { getAssignableAdmins } from "@/lib/services/admins";
import { listCompaniesForAdmin } from "@/lib/services/companies";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContentItemForm } from "@/components/admin/ContentItemForm";
import { ContentItemActions } from "@/components/admin/ContentItemActions";
import { ContentStatusBadge } from "@/components/admin/ContentStatusBadge";

export const metadata = { title: "Peça de conteúdo — Cerâmica Hub" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default async function ContentItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { adminRole } = await requireAdminPage(["super_admin", "admin", "marketing", "conteudo"]);
  const { id } = await params;

  const item = await getContentItemById(id);
  if (!item) notFound();

  const [comments, versions, admins, companies] = await Promise.all([
    getContentComments(id),
    getContentVersions(id),
    getAssignableAdmins(),
    listCompaniesForAdmin(),
  ]);

  const meta = [
    CONTENT_KIND_LABEL[item.kind],
    item.channel ? CONTENT_CHANNEL_LABEL[item.channel] : null,
    item.businessName,
  ].filter(Boolean);

  return (
    <AdminShell currentPath="/admin/marketing/calendario" adminRole={adminRole}>
      <div>
        <Link href={`/admin/marketing/calendario?mes=${item.scheduledFor.slice(0, 7)}`} className="text-[14px] text-muted hover:text-foreground">
          ← Calendário
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{item.title}</h1>
          <ContentStatusBadge status={item.status} />
        </div>
        <p className="mt-2 text-[15px] text-muted">{meta.join(" · ")}</p>
        <p className="mt-1 text-[13px] text-muted">
          Criado por {item.createdByEmail ?? "—"} em {formatDateTime(item.createdAt)}
          {item.updatedByEmail && ` · Última alteração por ${item.updatedByEmail} em ${formatDateTime(item.updatedAt)}`}
          {item.approvedAt && ` · Aprovado por ${item.approvedByEmail ?? "—"} em ${formatDateTime(item.approvedAt)}`}
        </p>
      </div>

      <ContentItemActions itemId={item.id} status={item.status} />

      <ContentItemForm item={item} defaultDate={item.scheduledFor} options={{ admins, companies }} />

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Comentários ({comments.length})</h2>
        <div className="mt-3 flex flex-col gap-2">
          {comments.length === 0 && <p className="text-[15px] text-muted">Nenhum comentário ainda.</p>}
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-border bg-white/70 px-4 py-3">
              <p className="text-[12px] text-muted">
                {comment.adminEmail ?? "—"} · {formatDateTime(comment.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] text-foreground">{comment.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-foreground">Versões ({versions.length})</h2>
        <div className="mt-3 flex flex-col gap-2">
          {versions.map((version) => (
            <details key={version.id} className="rounded-2xl border border-border bg-white/70 px-4 py-3">
              <summary className="cursor-pointer text-[14px] text-foreground">
                v{version.versionNumber} · {CONTENT_STATUS_LABEL[version.status]} · {version.changedByEmail ?? "—"} ·{" "}
                {formatDateTime(version.createdAt)}
              </summary>
              <div className="mt-2 flex flex-col gap-1 text-[14px] text-muted">
                <p className="font-medium text-foreground">{version.title}</p>
                {version.briefing && <p className="whitespace-pre-wrap">Briefing: {version.briefing}</p>}
                {version.body && <p className="whitespace-pre-wrap">{version.body}</p>}
              </div>
            </details>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
