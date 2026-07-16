const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "pra sempre",
    description: "Pra empresa que quer entrar na rede e já aparecer no diretório.",
    features: [
      "Perfil no diretório do prédio",
      "Link direto de WhatsApp",
      "Participação na rede de apoio no Instagram",
    ],
    highlight: false,
  },
  {
    name: "Destaque",
    price: "R$ 67",
    period: "/mês",
    description: "Pra quem quer aparecer primeiro e ser visto por mais gente.",
    features: [
      "Tudo do plano Grátis",
      "Selo de verificado e prioridade na busca",
      "Post dedicado no Instagram do prédio",
      "Relatório mensal de contatos recebidos",
    ],
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section id="planos" className="relative overflow-hidden bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--primary-light), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-28">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight">
          Comece de graça. Cresça quando fizer sentido.
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 ${
                plan.highlight
                  ? "border border-white/10 bg-surface-dark text-white"
                  : "glass-light text-foreground"
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className={`mt-2 text-[14px] ${plan.highlight ? "text-white/60" : "text-muted"}`}>
                {plan.description}
              </p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                <span className={plan.highlight ? "text-white/50" : "text-muted"}>{plan.period}</span>
              </p>
              <ul className="mt-8 space-y-3 text-[14px]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className={plan.highlight ? "text-white/50" : "text-accent"}>—</span>
                    <span className={plan.highlight ? "text-white/80" : "text-muted"}>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#cadastro"
                className={`mt-8 block rounded-full px-6 py-3 text-center text-[14px] font-medium transition-opacity hover:opacity-80 ${
                  plan.highlight ? "bg-white text-foreground" : "bg-foreground text-white"
                }`}
              >
                Quero esse plano
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
