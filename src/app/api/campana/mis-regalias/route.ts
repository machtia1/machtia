import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { resumenRegaliasUsuario } from '@/lib/redAlterna';

export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const resumen = await resumenRegaliasUsuario(session.userId);
  return NextResponse.json(resumen);
}
