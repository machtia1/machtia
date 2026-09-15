import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { arbolRedAlterna, TABLA_COMISIONES } from '@/lib/redAlterna';

export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const arbol = await arbolRedAlterna(session.userId);
  return NextResponse.json({ ...arbol, tablas: TABLA_COMISIONES });
}
