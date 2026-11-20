import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { leerDatosBancarios } from '@/lib/datosBancariosServidor';

// Evita que Excel interprete una celda como fórmula (=, +, -, @).
function celda(v: unknown): string {
  let t = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}

/** CSV con los datos descifrados de todos los usuarios, para preparar pagos. Solo Administrador. */
export async function GET() {
  const token = cookies().get('session')?.value;
  const s = token ? verifySession(token) : null;
  if (!s || s.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const filas = await prisma.datosBancarios.findMany({
    select: { usuarioId: true, usuario: { select: { nombre: true, apellido: true, correo: true } } },
  });
  const encabezado = ['Nombre', 'Correo', 'Tipo de cuenta', 'Banco', 'País del banco', 'CLABE / Cuenta', 'Beneficiario', 'Datos adicionales banco', 'Moneda wallet', 'Red wallet', 'Dirección wallet', 'Datos adicionales wallet'];
  const lineas = [encabezado.map(celda).join(',')];
  let fallidos = 0;
  for (const f of filas) {
    try {
      const d = await leerDatosBancarios(f.usuarioId);
      if (!d) continue;
      lineas.push(
        [
          `${f.usuario.nombre} ${f.usuario.apellido}`.trim(),
          f.usuario.correo,
          d.banco ? (d.banco.tipo === 'MEXICO' ? 'México (CLABE)' : 'Internacional') : '',
          d.banco?.banco, d.banco?.pais, d.banco?.cuenta, d.banco?.titular, d.banco?.adicionales,
          d.wallet?.moneda, d.wallet?.red, d.wallet?.direccion, d.wallet?.adicionales,
        ].map(celda).join(',')
      );
    } catch {
      fallidos++;
    }
  }
  console.info(`[datos-bancarios] admin ${s.userId} exportó ${lineas.length - 1} registros (${fallidos} con error)`);
  return new NextResponse('﻿' + lineas.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="datos-bancarios.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
