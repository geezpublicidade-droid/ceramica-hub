import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";

export const metadata = { title: "Política de Privacidade — Cerâmica Hub" };

export default function PrivacidadePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight">
            Política de Privacidade
          </h1>
          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted">
            <p>
              Coletamos apenas os dados necessários para operar o diretório: informações de
              cadastro da empresa (nome, contato, localização, categoria) e dados básicos de uso
              da plataforma (como visualizações e cliques em contato), usados para os relatórios
              mostrados à própria empresa.
            </p>
            <p>
              Os dados de contato de uma empresa (WhatsApp, Instagram, site) são exibidos
              publicamente na página comercial, pois esse é o propósito do cadastro. Dados
              internos como senha e comprovantes de verificação nunca são exibidos publicamente.
            </p>
            <p>
              Não vendemos nem compartilhamos dados com terceiros para fins de publicidade. O
              acesso aos dados administrativos é restrito à equipe responsável pela plataforma.
            </p>
            <p>
              Uma empresa pode solicitar a correção ou remoção dos seus dados a qualquer momento
              pela página de{" "}
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
