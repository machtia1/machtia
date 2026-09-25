import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { obtenerArbolAlternaPorNiveles } from '@/lib/redAlterna';

/**
 * Vista de árbol GRÁFICO de la Campaña de Lanzamiento — pedida por
 * el cliente el 25 sept 2026, igual que el árbol de Mi Red 2x15 pero
 * con 8 posiciones por nivel en vez de 2.
 */
export async function GET(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raizIdSolicitada = searchParams.get('raizId');
  const raizId =
    raizIdSolicitada && session.rol === 'ADMINISTRADOR' ? raizIdSolicitada : session.userId;

  const arbol = await obtenerArbolAlternaPorNiveles(raizId, 5);
  if (!arbol) {
    return NextResponse.json({ error: 'No se encontró el árbol' }, { status: 404 });
  }

  return NextResponse.json(arbol);
}
