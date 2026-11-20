import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { INICIO_GANANCIAS_PROFESOR, porcentajeGananciaProfesor } from '@/lib/profesores';

/**
 * "Mis Ganancias" del Profesor/Facilitador:
 *  - totalUsuarios: usuarios activos de la plataforma, SIN contar los
 *    espacios restringidos, las cuentas de profesor ni al administrador.
 *  - acumulado: ganancia acumulada. Empieza a contar el 15 dic 2026 y el
 *    porcentaje todavía no está definido, así que por ahora es 0.
 */
export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session || (session.rol !== 'PROFESOR_FACILITADOR' && session.rol !== 'ADMINISTRADOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const totalUsuarios = await prisma.user.count({
    where: {
      status: 'ACTIVA',
      reservado: false,
      fueraDeRed: false,
      rol: { notIn: ['PROFESOR_FACILITADOR', 'ADMINISTRADOR'] },
      slotRestringido: { is: null },
    },
  });

  const porcentaje = porcentajeGananciaProfesor();
  const iniciaEn = new Date(INICIO_GANANCIAS_PROFESOR);
  const yaInicio = Date.now() >= iniciaEn.getTime();

  return NextResponse.json({
    totalUsuarios,
    porcentaje,
    acumulado: 0, // se calculará cuando el cliente defina el porcentaje/fórmula
    iniciaEn: iniciaEn.toISOString(),
    yaInicio,
  });
}
