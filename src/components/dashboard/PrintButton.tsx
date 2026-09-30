"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="neu-primary rounded-full px-6 py-3 text-[15px] font-medium text-white print:hidden">
      Imprimir / salvar PDF
    </button>
  );
}
