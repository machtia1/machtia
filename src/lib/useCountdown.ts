'use client';

import { useEffect, useState } from 'react';

/** Cuenta regresiva en vivo hacia una fecha ISO. Actualiza cada minuto. */
export function useCountdown(target: string, textoAlLlegar = '¡Ya está disponible!') {
  const [text, setText] = useState('calculando…');

  useEffect(() => {
    const targetDate = new Date(target).getTime();

    function tick() {
      const diff = targetDate - Date.now();
      if (diff <= 0) {
        setText(textoAlLlegar);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      setText(`${d}d ${h}h ${m}m`);
    }

    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [target, textoAlLlegar]);

  return text;
}
