import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { CifradoNoConfigurado, cifradoDisponible } from '@/lib/cifrado';
import { leerDatosBancarios, guardarDatosBancarios } from '@/lib/datosBancariosServidor';
import {
  enmascarar,
  enmascararWallet,
  validarBanco,
  validarWallet,
  type DatosGuardados,
} from '@/lib/datosBancarios';

function sesion() {
  const token = cookies().get('session')?.value;
  return token ? verifySession(token) : null;
}

function vistaDueno(d: DatosGuardados | null) {
  return {
    banco: d?.banco
      ? {
          tipo: d.banco.tipo,
          banco: d.banco.banco,
          titular: d.banco.titular,
          pais: d.banco.pais ?? '',
          adicionales: d.banco.adicionales ?? '',
          cuentaEnmascarada: enmascarar(d.banco.cuenta),
        }
      : null,
    wallet: d?.wallet
      ? {
          moneda: d.wallet.moneda,
          red: d.wallet.red,
          adicionales: d.wallet.adicionales ?? '',
          direccionEnmascarada: enmascararWallet(d.wallet.direccion),
        }
      : null,
  };
}

/** Tus propios datos, con la cuenta/dirección enmascaradas. Cualquier usuario con sesión. */
export async function GET() {
  const s = sesion();
  if (!s) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!cifradoDisponible()) {
    return NextResponse.json({ error: 'Esta función aún no está disponible. Intente más tarde.' }, { status: 503 });
  }
  try {
    return NextResponse.json(vistaDueno(await leerDatosBancarios(s.userId)));
  } catch {
    return NextResponse.json({ error: 'No se pudieron leer sus datos' }, { status: 500 });
  }
}

/**
 * Guarda tus datos. Cada bloque es independiente:
 *  - ausente  → se conserva lo que ya había
 *  - null     → se elimina ese bloque
 *  - objeto   → se valida y reemplaza (si deja vacía la cuenta/dirección y
 *               ya había una del mismo tipo, se conserva la anterior)
 */
export async function PUT(request: Request) {
  const s = sesion();
  if (!s) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!cifradoDisponible()) {
    return NextResponse.json({ error: 'Esta función aún no está disponible. Intente más tarde.' }, { status: 503 });
  }

  let body: { banco?: unknown; wallet?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });

  try {
    const actual = (await leerDatosBancarios(s.userId)) ?? { banco: null, wallet: null };
    const siguiente: DatosGuardados = { ...actual };
    const errores: string[] = [];

    if (body.banco === null) siguiente.banco = null;
    else if (body.banco !== undefined) {
      const entrada = { ...(body.banco as Record<string, unknown>) };
      const sinCuenta = !String(entrada.cuenta ?? '').trim();
      const tipoNuevo = entrada.tipo === 'INTERNACIONAL' ? 'INTERNACIONAL' : 'MEXICO';
      if (sinCuenta && actual.banco && actual.banco.tipo === tipoNuevo) entrada.cuenta = actual.banco.cuenta;
      const v = validarBanco(entrada);
      if (v.limpio) siguiente.banco = v.limpio;
      else errores.push(...v.errores);
    }

    if (body.wallet === null) siguiente.wallet = null;
    else if (body.wallet !== undefined) {
      const entrada = { ...(body.wallet as Record<string, unknown>) };
      const sinDireccion = !String(entrada.direccion ?? '').trim();
      if (sinDireccion && actual.wallet && actual.wallet.red === entrada.red) entrada.direccion = actual.wallet.direccion;
      const v = validarWallet(entrada);
      if (v.limpio) siguiente.wallet = v.limpio;
      else errores.push(...v.errores);
    }

    if (errores.length) return NextResponse.json({ error: errores[0], errores }, { status: 400 });

    await guardarDatosBancarios(s.userId, siguiente);
    return NextResponse.json({ ok: true, ...vistaDueno(siguiente) });
  } catch (e) {
    if (e instanceof CifradoNoConfigurado) {
      return NextResponse.json({ error: 'Esta función aún no está disponible. Intente más tarde.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'No se pudieron guardar sus datos. Intente de nuevo.' }, { status: 500 });
  }
}
