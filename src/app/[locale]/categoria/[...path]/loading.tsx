/** Esqueleto da vitrine enquanto a página dinâmica carrega: mesmas proporções do hero, carrossel e cards, sem salto de layout. */
export default function CategoryLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex-1 animate-pulse">
      <div className="flex flex-col bg-graphite lg:min-h-[440px] lg:flex-row">
        <div className="flex-1 px-5 pb-10 pt-32 sm:px-[var(--page-padding)] lg:w-[72%] lg:flex-none">
          <div className="h-4 w-40 rounded bg-white/15" />
          <div className="mt-5 h-12 w-3/4 max-w-xl rounded bg-white/15" />
          <div className="mt-4 h-5 w-2/3 max-w-md rounded bg-white/10" />
          <div className="mt-8 h-14 max-w-2xl rounded-full bg-white/20" />
        </div>
        <div className="h-48 bg-primary/80 lg:h-auto lg:w-[28%]" />
      </div>

      <div className="container-page pt-10">
        <div className="h-8 w-64 rounded bg-black/10" />
        <div className="mt-5 h-[280px] rounded-2xl bg-black/10 sm:h-[300px] lg:h-[320px]" />

        <div className="mt-10 flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="h-10 w-28 shrink-0 rounded-full bg-black/10" />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 pb-20 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="aspect-video bg-black/10" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 rounded bg-black/10" />
                <div className="h-4 w-1/2 rounded bg-black/10" />
                <div className="h-14 rounded bg-black/5" />
                <div className="h-11 rounded-full bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
