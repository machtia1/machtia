'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Da la hora oficial del servidor (no la del teléfono). Se sincroniza al abrir
 * la página y cada 10 minutos. Si el servidor no responde en 4 segundos, usa
 * el reloj del dispositivo para no dejar la pantalla esperando.
 */
export function useHoraServidor() {
  const desfase = useRef(0);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function sincronizar() {
      const control = new AbortController();
      const limite = setTimeout(() => control.abort(), 4000);
      try {
        const inicio = Date.now();
        const res = await fetch('/api/hora', { cache: 'no-store', signal: control.signal });
        const fin = Date.now();
        const datos = await res.json();
        if (res.ok && typeof datos.ahora === 'number') {
          // El servidor contestó, en promedio, a mitad del viaje de ida y vuelta.
          desfase.current = datos.ahora - (inicio + fin) / 2;
        }
      } catch {
        // Sin conexión con el servidor: se conserva el desfase anterior (o 0).
      } finally {
        clearTimeout(limite);
        if (!cancelado) setListo(true);
      }
    }

    sincronizar();
    const id = setInterval(sincronizar, 10 * 60 * 1000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, []);

  const ahora = useCallback(() => Date.now() + desfase.current, []);
  return { listo, ahora };
}
