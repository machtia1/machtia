import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { eliminarDefinitivoDb } from '@/lib/redUsuarios';

export async function POST(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { usuarioId } = await request.json();
  if (!usuarioId) {
    return NextResponse.json({ error: 'Falta el usuarioId' }, { status: 400 });
  }

  const resultado = await eliminarDefinitivoDb(usuarioId);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.motivo }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
