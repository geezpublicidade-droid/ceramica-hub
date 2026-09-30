import { UnsubscribeButton } from "@/components/marketing/UnsubscribeButton";

export const metadata = { title: "Cancelar inscrição — Cerâmica Hub", robots: { index: false, follow: false } };

/** Página pública de descadastro (link no rodapé de todo e-mail de marketing).
 * A confirmação é um clique explícito: abrir o link não descadastra, pra
 * scanners de e-mail que pré-visitam links não cancelarem a inscrição. */
export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white/80 p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Cancelar inscrição</h1>
        <p className="mt-3 text-[16px] text-muted">
          Você deixará de receber e-mails de divulgação do Cerâmica Hub. Comunicados essenciais da sua conta continuam
          sendo enviados.
        </p>
        <UnsubscribeButton token={token} />
      </div>
    </main>
  );
}
