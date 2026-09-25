import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import WovenCloth from "@/components/ui/woven-cloth";

const heroImages = [
  "/images/ceramica-hero-1.jpg",
  "/images/ceramica-hero-2.jpg",
  "/images/ceramica-hero-3.jpg",
  "/images/ceramica-hero-4.jpg",
];

const CYCLE_SECONDS = 24;

export async function ComingSoon() {
  const t = await getTranslations("ComingSoon");
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#16090b] text-white">
      <div className="absolute inset-0">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className="hero-slide absolute inset-0"
            style={{ animationDelay: `${i * -(CYCLE_SECONDS / heroImages.length)}s` }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
        {/* véu escuro terracota — segura as fotos dos prédios ao fundo pra bandeira e o texto ficarem em destaque */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#16090b]/55 via-[#16090b]/70 to-[#16090b]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_50%_0%,rgba(179,85,58,0.28),transparent_65%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-white">
          <img src="/images/logo-ceramica-hub.png" alt="" className="h-7 w-7" />
          Cerâmica <span className="text-white">Hub</span>
        </span>
        <Link
          href="/login"
          className="glass-dark rounded-full px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/15"
        >
          {t("acessar")}
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-10">
        {/* a bandeira: pano simulado com a frase impressa, ondula junto com ele */}
        <h1 className="sr-only">{t("title")}</h1>
        <div className="relative aspect-[8/5] w-full max-w-4xl">
          <WovenCloth
            className="absolute inset-0 h-full w-full"
            labels={{
              badge: t("badge"),
              lineOne: t("flagLine1"),
              lineTwo: t("flagLine2"),
            }}
          />
        </div>

        <p className="mt-8 max-w-xl text-center text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
          {t("description")}
        </p>
      </main>

      <footer className="relative z-10 flex items-center justify-center px-6 py-8 text-[14px] text-white/70">
        {t("footer", { year })}
      </footer>
    </div>
  );
}
