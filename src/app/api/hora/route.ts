import { NextResponse } from 'next/server';

// Hora oficial del servidor. Los contadores de la página de invitación la usan
// para no depender del reloj del teléfono de cada persona (que puede estar
// adelantado o atrasado). Nunca se guarda en caché.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { ahora: Date.now() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
