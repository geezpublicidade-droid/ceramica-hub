"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="neu-primary rounded-full px-5 py-2.5 text-[14px] font-medium text-white print:hidden"
    >
      Baixar PDF / Imprimir
    </button>
  );
}
