'use client';

export default function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="h-9 px-4 rounded-xl bg-cm-primary text-white text-[12.5px] font-semibold hover:opacity-90"
    >
      Descargar / imprimir (PDF)
    </button>
  );
}
