import Link from "next/link";
import { getTranslations } from "next-intl/server";
import WovenCloth from "@/components/ui/woven-cloth";

export async function ComingSoon() {
  const t = await getTranslations("ComingSoon");
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#16090b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_circle_at_50%_0%,rgba(179,85,58,0.28),transparent_65%)]" />

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
        {/* a bandeira: tecido tramado tremulando, com a frase sobre ele */}
        <div className="relative h-[420px] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#16090b] shadow-[0_40px_90px_-30px_rgba(179,85,58,0.55)] sm:h-[520px]">
          <WovenCloth className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_50%,rgba(22,9,11,0.7),rgba(22,9,11,0.15)_75%)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <span className="mb-5 inline-flex items-center rounded-full border border-white/25 bg-black/25 px-4 py-1.5 text-[13px] font-medium uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm sm:text-[14px]">
              {t("badge")}
            </span>
            <h1 className="max-w-3xl text-[9vw] font-semibold leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:text-6xl md:text-7xl">
              {t("title")}
            </h1>
          </div>
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
