import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";

export const metadata = { title: "Termos de Uso — Cerâmica Hub" };

export default function TermosPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight">
            Termos de Uso
          </h1>
          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted">
            <p>
              O Cerâmica Hub é uma plataforma independente, desenvolvida pela Geez Marketing,
              que conecta e divulga empresas localizadas no Espaço Cerâmica. Ao se cadastrar ou
              navegar pela plataforma, você concorda com estes termos.
            </p>
            <p>
              O cadastro de empresas passa por verificação antes da publicação. A plataforma
              pode recusar, suspender ou remover cadastros que contenham informações incorretas,
              incompletas ou que violem estes termos.
            </p>
            <p>
              As informações publicadas nas páginas comerciais são de responsabilidade da
              empresa cadastrada. O Cerâmica Hub não se responsabiliza por negociações,
              produtos ou serviços contratados entre visitantes e empresas.
            </p>
            <p>
              Estes termos podem ser atualizados a qualquer momento. Alterações relevantes
              serão comunicadas às empresas cadastradas.
            </p>
            <p>
              Dúvidas sobre estes termos podem ser enviadas pela página de{" "}
              <a href="/contato" className="text-primary underline">
                contato
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
