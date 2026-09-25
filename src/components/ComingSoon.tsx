import Link from "next/link";
import { getTranslations } from "next-intl/server";
import WovenCloth from "@/components/ui/woven-cloth";

export async function ComingSoon() {
  const t = await getTranslations("ComingSoon");
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-graphite text-white">
      <div className="absolute inset-0">
        <WovenCloth className="absolute inset-0 h-full w-full" />
        {/* véu grafite — garante leitura do texto sobre a trama */}
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_45%,rgba(30,30,30,0.72),rgba(30,30,30,0.25)_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
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

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="glass-dark mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium uppercase tracking-[0.18em] text-white/80 sm:text-[14px]">
          {t("badge")}
        </span>
        <h1 className="max-w-3xl text-[11vw] font-semibold leading-[1] tracking-tight text-white sm:text-6xl md:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/70 sm:text-[19px]">
          {t("description")}
        </p>
      </main>

      <footer className="relative z-10 flex items-center justify-center px-6 py-8 text-[14px] text-white/70">
        {t("footer", { year })}
      </footer>
    </div>
  );
}
