'use client';

// Pantalla de error propia de "Campaña de Lanzamiento" — pedida por
// el cliente el 25/26 sept 2026: al dar clic en el botón desde
// computadora, la sección "no carga". Revisamos el código dos veces
// y el botón en sí es un link normal, sin nada raro — pero como
// hemos subido código muchas veces hoy, es muy probable que el
// navegador de quien prueba tenga en caché una versión vieja de la
// página (un "chunk" de JavaScript que ya no existe en el servidor
// después de un nuevo despliegue), lo que en React se ve
// exactamente así: se hace clic y no pasa nada, sin ningún letrero.
// Esta pantalla evita que quede "trabada" en silencio: si algo falla
// al cargar esta sección, ahora aparece un aviso claro con un botón
// para reintentar, en vez de no mostrar nada.
export default function CampanaLanzamientoError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-[18px] font-semibold mb-2">No se pudo cargar Campaña de Lanzamiento</h1>
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
