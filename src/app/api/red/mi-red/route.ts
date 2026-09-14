import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { obtenerArbolPorNiveles, contarTotalDb } from '@/lib/redUsuarios';

export async function GET(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raizIdSolicitada = searchParams.get('raizId');

  // Un usuario normal solo puede ver SU PROPIA red. Un Administrador
  // puede pedir la de cualquier persona pasando ?raizId=...
  const raizId =
    raizIdSolicitada && session.rol === 'ADMINISTRADOR' ? raizIdSolicitada : session.userId;

  const arbol = await obtenerArbolPorNiveles(raizId, 15);
  if (!arbol) {
    return NextResponse.json({ error: 'No se encontró la red' }, { status: 404 });
  }

  const conteo = await contarTotalDb(raizId);

  return NextResponse.json({ ...arbol, ...conteo, esAdministrador: session.rol === 'ADMINISTRADOR' });
}
