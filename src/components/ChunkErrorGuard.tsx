'use client';

import { useEffect } from 'react';

// Guardia contra "ChunkLoadError" — pedido a raíz del reporte del
// cliente el 25/26 sept 2026 de que el botón de Campaña de
// Lanzamiento "no carga" al hacerle clic desde computadora. Como
// hemos subido el proyecto muchas veces en el mismo día, es muy
// probable que el navegador de alguien tenga guardada una versión
// vieja de la página mientras el servidor ya tiene una nueva — eso
// hace que, al navegar de una sección a otra sin recargar la página
// completa (como hace Next.js normalmente para que se sienta más
// rápido), el navegador intente pedir un archivo de JavaScript que
// ya no existe, y en la práctica se ve exactamente como "hice clic y
// no pasó nada".
//
// Este componente detecta ese error específico en cualquier parte de
// la plataforma y, en vez de quedarse trabado en silencio, recarga
// la página completa UNA sola vez automáticamente (usa
// sessionStorage para no quedar en un ciclo de recargas si el
// problema fuera otro).
export default function ChunkErrorGuard() {
  useEffect(() => {
    function esErrorDeChunkViejo(mensaje: string | undefined | null) {
      if (!mensaje) return false;
      return /ChunkLoadError|Loading chunk [\d]+ failed|failed to fetch dynamically imported module/i.test(
        mensaje
      );
    }

    function recargarUnaVez() {
      const yaRecargo = window.sessionStorage.getItem('cm_chunk_reload');
      if (yaRecargo) return;
      window.sessionStorage.setItem('cm_chunk_reload', '1');
      window.location.reload();
    }

    function alError(e: ErrorEvent) {
      if (esErrorDeChunkViejo(e.message)) recargarUnaVez();
    }

    function alRechazo(e: PromiseRejectionEvent) {
      const mensaje = e.reason?.message ?? String(e.reason ?? '');
      if (esErrorDeChunkViejo(mensaje)) recargarUnaVez();
    }

    window.addEventListener('error', alError);
    window.addEventListener('unhandledrejection', alRechazo);
    return () => {
      window.removeEventListener('error', alError);
      window.removeEventListener('unhandledrejection', alRechazo);
    };
  }, []);

  return null;
}
