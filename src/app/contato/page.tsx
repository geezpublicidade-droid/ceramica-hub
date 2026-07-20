import { Header } from "@/components/Header";
import { CinematicFooter } from "@/components/landing/CinematicFooter";

export const metadata = { title: "Contato — Cerâmica Hub" };

export default function ContatoPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface px-6 py-32 text-foreground">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight">
            Fale com a plataforma
          </h1>
          <p className="mt-6 text-[15px] leading-relaxed text-muted">
            O Cerâmica Hub é desenvolvido e mantido pela Geez Marketing. Para dúvidas sobre
            cadastro, correção de dados, solicitação de remoção ou qualquer outro assunto sobre
            a plataforma, entre em contato:
          </p>
          <div className="mt-8 flex flex-col gap-3 text-[15px]">
            <p>
              <span className="text-muted">E-mail:</span>{" "}
              <a href="mailto:geezpublicidade@gmail.com" className="text-primary underline">
                geezpublicidade@gmail.com
              </a>
            </p>
            <p>
              <span className="text-muted">Instagram:</span>{" "}
              <a
                href="https://instagram.com/geezmarketing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                @geezmarketing
              </a>
            </p>
          </div>
        </div>
      </main>
      <CinematicFooter />
    </>
  );
}
