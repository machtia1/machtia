'use client';

export default function DetalleTallerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-[18px] font-semibold mb-2">No se pudo cargar este taller</h1>
        <p className="text-[#6B7280] text-[14px] leading-relaxed mb-5">
          Puede ser un problema temporal de conexión o una versión vieja guardada en tu navegador.
          Intenta de nuevo — si sigue sin cargar, recarga la página completa (Ctrl+Shift+R o
          Cmd+Shift+R) o entra en una ventana de incógnito.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => reset()}
            className="h-10 px-4 rounded-lg bg-cm-primary text-white text-[13px] font-semibold"
          >
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-4 rounded-lg border border-[#E4E7EE] text-[13px] font-semibold"
          >
            Recargar página
          </button>
        </div>
      </div>
    </div>
  );
}
