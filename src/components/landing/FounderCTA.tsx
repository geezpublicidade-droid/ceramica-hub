import { FadeUp } from "@/components/motion/FadeUp";

const ADMIN_WHATSAPP = "5511999999999";
const ADMIN_MESSAGE = "Olá! Quero cadastrar minha empresa no Cerâmica Hub.";

const benefits = [
  "Perfil público no diretório",
  "Divulgação na fase inicial da plataforma",
  "Presença garantida nas categorias",
  "Contato direto pelo WhatsApp",
  "Participação nas primeiras ações",
  "Possibilidade de novas parcerias",
];

export function FounderCTA() {
  return (
    <section id="cadastro" className="bg-surface-dark px-6 py-32 text-foreground-dark">
      <div className="mx-auto max-w-4xl text-center">
        <FadeUp className="text-[13px] font-medium uppercase tracking-[0.2em] text-connection">
          Fase de lançamento
        </FadeUp>
        <FadeUp
          delay={0.05}
          className="mx-auto mt-5 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight"
        >
          Faça parte da primeira geração de empresas da Cerâmica Hub.
        </FadeUp>
        <FadeUp delay={0.1} className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-white/60">
          Cadastre seu negócio gratuitamente e receba o selo de Empresa Fundadora da
          plataforma.
        </FadeUp>

        <FadeUp
          delay={0.15}
          className="glass-dark mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-3 rounded-2xl p-6 text-left sm:grid-cols-2"
        >
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5 text-[14px] text-white/75">
              <span aria-hidden="true" className="mt-0.5 text-connection">
                ✓
              </span>
              {benefit}
            </div>
          ))}
        </FadeUp>

        <FadeUp delay={0.2} className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(ADMIN_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white px-8 py-4 text-[15px] font-medium text-black transition-transform hover:scale-[1.03]"
          >
            Cadastrar minha empresa gratuitamente
          </a>
          <a
            href="#empresas-destaque"
            className="rounded-full border border-white/25 px-8 py-4 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Conhecer a plataforma
          </a>
        </FadeUp>
      </div>
    </section>
  );
}
