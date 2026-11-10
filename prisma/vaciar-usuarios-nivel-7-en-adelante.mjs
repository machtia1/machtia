import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// ============================================================
// Vaciado del nivel 7 en adelante — pedido por el cliente el 9 nov
// 2026: "queremos hacer un vaciado del nivel 7 en adelante, porque
// hay muchos usuarios que en realidad se colaron... borrarlos todos
// para solo ir añadiendo a los que sí tenemos registrados que
// cumplieron el requisito... guardar el acumulado que hay para hacer
// una comparación... a partir de que se borren, comenzamos a contar
// de nuevo las regalías."
//
// QUÉ HACE (solo con --ejecutar; sin esa bandera es MODO PRUEBA y no
// cambia nada):
//   1. Guarda una COPIA de todas las regalías (con nombres y correos)
//      y de todos los usuarios que se van a borrar, en las tablas
//      RespaldoRegaliaRedAlterna y RespaldoUsuarioBorrado, y escribe
//      tres archivos CSV en prisma/respaldos/ (Excel los abre).
//   2. Borra a los usuarios normales (todos los que NO son
//      restringidos de los niveles 1 al 6 ni personal administrativo)
//      junto con sus notificaciones, inscripciones a cursos y
//      preregistros.
//   3. Borra los espacios restringidos del nivel 7 en adelante (ya no
//      son restringidos: quedan abiertos al registro normal).
//   4. Borra TODAS las regalías de la Red Alterna, para que la cuenta
//      de todos empiece desde cero. La copia ya quedó guardada en el
//      paso 1.
//
// QUÉ NO TOCA:
//   - Cuentas de los niveles 1 al 6 (ni su posición en el árbol).
//   - Administrador, asistentes y profesores (cualquier rol distinto
//     de USUARIO / SOCIO).
//   - Cualquier correo que se pase en --conservar=a@x.com,b@y.com
//   - Cursos, anuncios, publicidad ni notificaciones generales.
//
// SEGURIDAD:
//   - Todo el borrado va dentro de UNA transacción: si algo falla,
//     no se cambia nada.
//   - Antes de borrar verifica que la copia de respaldo quedó
//     completa; si no coincide, se cancela.
//   - Exige que antes se haya corrido la exportación completa
//     (npm run db:exportar-todo) con todas las tablas coincidiendo.
//   - ⚠️ El borrado es irreversible — ver NOTAS_VACIADO_NIVEL_7_9NOV.md
//
// USO:
//   npm run db:vaciar-usuarios-nivel-7                  → prueba
//   npm run db:vaciar-usuarios-nivel-7 -- --ejecutar    → real
// ============================================================

const EJECUTAR = process.argv.includes('--ejecutar');
const NIVEL_MAX_CONSERVADO = 6;
const ROLES_QUE_SE_BORRAN = ['USUARIO', 'SOCIO'];

const conservarArg = process.argv.find((a) => a.startsWith('--conservar='));
const CORREOS_CONSERVAR = new Set(
  (conservarArg ? conservarArg.slice('--conservar='.length).split(',') : [])
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
);

const LOTE = new Date().toISOString();

function dinero(n) {
  return `$${Number(n).toFixed(2)}`;
}

function csvCelda(v) {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function escribirCsv(ruta, columnas, filas) {
  const lineas = [columnas.join(',')];
  for (const f of filas) lineas.push(columnas.map((c) => csvCelda(f[c])).join(','));
  // BOM para que Excel respete los acentos
  fs.writeFileSync(ruta, '﻿' + lineas.join('\n'), 'utf8');
}

async function main() {
  console.log(`== Vaciado del nivel 7 en adelante (9 nov 2026) — ${EJECUTAR ? 'MODO REAL' : 'MODO PRUEBA (no cambia nada)'} ==\n`);

  const usuarios = await prisma.user.findMany({
    include: { slotRestringido: { select: { id: true, nivel: true, posicion: true } } },
    orderBy: { creadoEn: 'asc' },
  });
  const porId = new Map(usuarios.map((u) => [u.id, u]));
  const nombreDe = (u) => `${u.nombre} ${u.apellido}`.trim();

  // ---- Quién se conserva y quién se borra ----
  const conservar = [];
  const borrar = [];
  for (const u of usuarios) {
    const nivel = u.slotRestringido?.nivel ?? null;
    let motivo = null;
    if (nivel !== null && nivel <= NIVEL_MAX_CONSERVADO) motivo = `restringido nivel ${nivel}`;
    else if (!ROLES_QUE_SE_BORRAN.includes(u.rol)) motivo = `rol ${u.rol}`;
    else if (CORREOS_CONSERVAR.has(u.correo.toLowerCase())) motivo = 'correo en --conservar';
    if (motivo) conservar.push({ u, motivo });
    else borrar.push(u);
  }
  const idsBorrar = new Set(borrar.map((u) => u.id));
  const borrarIds = [...idsBorrar];

  console.log(`Usuarios totales en la base: ${usuarios.length}`);
  console.log(`  Se CONSERVAN: ${conservar.length}`);
  const porMotivo = {};
  for (const c of conservar) porMotivo[c.motivo] = (porMotivo[c.motivo] ?? 0) + 1;
  for (const [m, n] of Object.entries(porMotivo)) console.log(`    - ${m}: ${n}`);
  console.log(`  Se BORRAN: ${borrar.length}`);

  const reservados = borrar.filter((u) => u.reservado);
  const reales = borrar.filter((u) => !u.reservado);
  console.log(`    - espacios reservados vacíos (sin persona): ${reservados.length}`);
  console.log(`    - personas reales: ${reales.length}`);

  // ---- Regalías ----
  const regalias = await prisma.regaliaRedAlterna.findMany({ orderBy: { creadoEn: 'asc' } });
  const totalRegalias = regalias.reduce((s, r) => s + Number(r.monto), 0);
  console.log(`\nRegalías en la base: ${regalias.length} (suma ${dinero(totalRegalias)} MXN) — TODAS se respaldan y se ponen en cero.`);
  const simuladas = regalias.filter((r) => r.simulada);
  console.log(`  de las cuales simuladas (nivel 1 de restringidos): ${simuladas.length}`);

  // ---- Espacios restringidos nivel 7 en adelante ----
  const slotsBorrar = await prisma.slotRestringido.findMany({
    where: { nivel: { gt: NIVEL_MAX_CONSERVADO } },
    select: { id: true, nivel: true, usuarioId: true },
  });
  const slotsBorrarIds = slotsBorrar.map((s) => s.id);
  console.log(`\nEspacios restringidos de nivel ${NIVEL_MAX_CONSERVADO + 1} en adelante que se eliminan: ${slotsBorrar.length}`);

  // Un espacio de nivel 7+ cuyo usuario se conserva sería una contradicción.
  const slotsConUsuarioConservado = slotsBorrar.filter((s) => s.usuarioId && !idsBorrar.has(s.usuarioId));
  if (slotsConUsuarioConservado.length > 0) {
    console.log(`⚠️  ${slotsConUsuarioConservado.length} espacio(s) de nivel 7+ tienen un usuario que se conservaría por rol/--conservar. Se cancela: revisa antes.`);
    for (const s of slotsConUsuarioConservado) {
      const u = porId.get(s.usuarioId);
      console.log(`     nivel ${s.nivel}: ${nombreDe(u)} <${u.correo}> (${u.rol})`);
    }
    process.exitCode = 1;
    return;
  }

  // ---- Anomalías: usuarios conservados enganchados a alguien que se borra ----
  const conservados = conservar.map((c) => c.u);
  const huerfanosRed = conservados.filter((u) => u.padreRedId && idsBorrar.has(u.padreRedId));
  const huerfanosAlterna = conservados.filter((u) => u.padreAlternaId && idsBorrar.has(u.padreAlternaId));
  const huerfanosInvitador = conservados.filter((u) => u.invitadoPorId && idsBorrar.has(u.invitadoPorId));
  console.log(`\nConservados cuyo padre en la Red General se borra (debe ser 0): ${huerfanosRed.length}`);
  console.log(`Conservados enganchados a la Red Alterna de alguien que se borra (se desenganchan): ${huerfanosAlterna.length}`);
  console.log(`Conservados invitados por alguien que se borra (se desenganchan): ${huerfanosInvitador.length}`);
  if (huerfanosRed.length > 0) {
    console.log('⚠️  Hay conservados colgados de alguien que se borra en la Red General. Se cancela: revisa antes.');
    for (const u of huerfanosRed) console.log(`     ${nombreDe(u)} <${u.correo}>`);
    process.exitCode = 1;
    return;
  }

  // ---- Preregistros a limpiar ----
  const correosBorrar = reales.map((u) => u.correo.toLowerCase());
  const linksBorrar = borrar.map((u) => u.linkInvitacion);
  const preregistrosWhere = {
    OR: [
      { slotRestringidoId: { in: slotsBorrarIds } },
      { correo: { in: correosBorrar } },
      { invitadorSlug: { in: linksBorrar } },
    ],
  };
  const preregistrosN = await prisma.preregistro.count({ where: preregistrosWhere });
  console.log(`Preregistros que se limpian (de los que se borran o invitados por ellos): ${preregistrosN}`);

  // ---- Detalle de a quién se borra ----
  console.log('\n---- PERSONAS REALES QUE SE BORRAN (revisa esta lista) ----');
  const ganadoPor = new Map();
  const generadoPor = new Map();
  for (const r of regalias) {
    ganadoPor.set(r.beneficiarioId, (ganadoPor.get(r.beneficiarioId) ?? 0) + Number(r.monto));
    generadoPor.set(r.origenId, (generadoPor.get(r.origenId) ?? 0) + Number(r.monto));
  }
  for (const u of reales) {
    const nivel = u.slotRestringido?.nivel;
    console.log(
      `  ${nombreDe(u)} <${u.correo}> · ${u.rol} · ${u.suscripcion ?? 'sin suscripción'} · ${u.status}` +
        `${nivel ? ` · nivel ${nivel}` : ''} · ganado ${dinero(ganadoPor.get(u.id) ?? 0)}`
    );
  }
  console.log('\n---- SE CONSERVAN ----');
  for (const c of conservar) {
    if (c.u.reservado) continue;
    console.log(`  ${nombreDe(c.u)} <${c.u.correo}> · ${c.motivo} · ganado ${dinero(ganadoPor.get(c.u.id) ?? 0)}`);
  }

  if (!EJECUTAR) {
    console.log('\n✋ MODO PRUEBA: no se cambió nada. Si la lista es correcta, corre de nuevo con -- --ejecutar');
    return;
  }

  // ============================================================
  // MODO REAL
  // ============================================================

  // Candado de seguridad: no se borra nada si antes no se hizo la
  // exportación completa (npm run db:exportar-todo), con todas las
  // tablas coincidiendo, en las últimas 24 horas.
  const carpetaBase = path.join(process.cwd(), 'prisma', 'respaldos');
  let exportacionValida = false;
  if (fs.existsSync(carpetaBase)) {
    const hace24h = Date.now() - 24 * 60 * 60 * 1000;
    for (const nombre of fs.readdirSync(carpetaBase)) {
      if (!nombre.startsWith('exportacion-')) continue;
      const resumen = path.join(carpetaBase, nombre, '_RESUMEN.csv');
      if (!fs.existsSync(resumen)) continue;
      if (fs.statSync(resumen).mtimeMs < hace24h) continue;
      const lineas = fs.readFileSync(resumen, 'utf8').split('\n').filter((l) => l.trim()).slice(1);
      if (lineas.length > 0 && lineas.every((l) => l.trim().endsWith(',SI'))) exportacionValida = true;
    }
  }
  if (!exportacionValida) {
    console.log('\n⛔ No se encontró una exportación completa reciente (últimas 24 h) con todas las tablas coincidiendo.');
    console.log('   Corre primero: npm run db:exportar-todo   — y guarda esa carpeta. No se borró nada.');
    process.exitCode = 1;
    return;
  }
  console.log('\n== Escribiendo archivos CSV de respaldo ==');
  const carpeta = path.join(process.cwd(), 'prisma', 'respaldos');
  fs.mkdirSync(carpeta, { recursive: true });
  const sello = LOTE.replace(/[:.]/g, '-');

  const filasRegalias = regalias.map((r) => {
    const b = porId.get(r.beneficiarioId);
    const o = porId.get(r.origenId);
    return {
      fecha: r.creadoEn,
      beneficiario_nombre: b ? nombreDe(b) : '(desconocido)',
      beneficiario_correo: b?.correo ?? '',
      origen_nombre: o ? nombreDe(o) : '(desconocido)',
      origen_correo: o?.correo ?? '',
      nivel: r.nivel,
      monto_mxn: Number(r.monto).toFixed(2),
      tabla: r.tablaAplicada,
      simulada: r.simulada ? 'si' : 'no',
    };
  });
  escribirCsv(
    path.join(carpeta, `respaldo-regalias-${sello}.csv`),
    ['fecha', 'beneficiario_nombre', 'beneficiario_correo', 'origen_nombre', 'origen_correo', 'nivel', 'monto_mxn', 'tabla', 'simulada'],
    filasRegalias
  );

  const filasAcumulado = usuarios
    .filter((u) => !u.reservado && ganadoPor.has(u.id))
    .map((u) => ({
      nombre: nombreDe(u),
      correo: u.correo,
      estado_en_el_vaciado: idsBorrar.has(u.id) ? 'BORRADO' : 'CONSERVADO',
      suscripcion: u.suscripcion ?? '',
      total_ganado_mxn: (ganadoPor.get(u.id) ?? 0).toFixed(2),
      regalias_recibidas: regalias.filter((r) => r.beneficiarioId === u.id).length,
    }))
    .sort((a, b) => Number(b.total_ganado_mxn) - Number(a.total_ganado_mxn));
  escribirCsv(
    path.join(carpeta, `respaldo-acumulado-por-persona-${sello}.csv`),
    ['nombre', 'correo', 'estado_en_el_vaciado', 'suscripcion', 'total_ganado_mxn', 'regalias_recibidas'],
    filasAcumulado
  );

  escribirCsv(
    path.join(carpeta, `respaldo-usuarios-borrados-${sello}.csv`),
    ['nombre', 'correo', 'telefono', 'pais', 'rol', 'suscripcion', 'status', 'nivel', 'invitado_por', 'membresia_expira', 'comprobante_url', 'creado', 'total_ganado_mxn'],
    reales.map((u) => ({
      nombre: nombreDe(u),
      correo: u.correo,
      telefono: u.telefono,
      pais: u.pais,
      rol: u.rol,
      suscripcion: u.suscripcion,
      status: u.status,
      nivel: u.slotRestringido?.nivel ?? '',
      invitado_por: u.invitadoPorId ? porId.get(u.invitadoPorId)?.correo ?? '' : '',
      membresia_expira: u.membresiaExpiraEn,
      comprobante_url: u.comprobantePagoUrl,
      creado: u.creadoEn,
      total_ganado_mxn: (ganadoPor.get(u.id) ?? 0).toFixed(2),
    }))
  );
  console.log(`  Guardados en: ${carpeta}`);

  console.log('\n== Respaldando en la base y borrando (una sola transacción) ==');
  await prisma.$transaction(
    async (tx) => {
      // 1) Copia en la base
      await tx.respaldoRegaliaRedAlterna.createMany({
        data: regalias.map((r) => {
          const b = porId.get(r.beneficiarioId);
          const o = porId.get(r.origenId);
          return {
            lote: LOTE,
            regaliaIdOriginal: r.id,
            beneficiarioIdOriginal: r.beneficiarioId,
            beneficiarioNombre: b ? nombreDe(b) : '(desconocido)',
            beneficiarioCorreo: b?.correo ?? '',
            origenIdOriginal: r.origenId,
            origenNombre: o ? nombreDe(o) : '(desconocido)',
            origenCorreo: o?.correo ?? '',
            nivel: r.nivel,
            monto: r.monto,
            tablaAplicada: r.tablaAplicada,
            simulada: r.simulada,
            creadoEnOriginal: r.creadoEn,
          };
        }),
      });

      await tx.respaldoUsuarioBorrado.createMany({
        data: reales.map((u) => ({
          lote: LOTE,
          usuarioIdOriginal: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          correo: u.correo,
          telefono: u.telefono,
          pais: u.pais,
          rol: u.rol,
          suscripcion: u.suscripcion,
          status: u.status,
          membresiaExpiraEn: u.membresiaExpiraEn,
          comprobantePagoUrl: u.comprobantePagoUrl,
          invitadoPorCorreo: u.invitadoPorId ? porId.get(u.invitadoPorId)?.correo ?? null : null,
          padreRedCorreo: u.padreRedId ? porId.get(u.padreRedId)?.correo ?? null : null,
          nivelRestringido: u.slotRestringido?.nivel ?? null,
          creadoEnOriginal: u.creadoEn,
          totalGanado: (ganadoPor.get(u.id) ?? 0).toFixed(2),
          totalGenerado: (generadoPor.get(u.id) ?? 0).toFixed(2),
        })),
      });

      // 2) Verificar que la copia quedó completa ANTES de borrar nada
      const copiadasRegalias = await tx.respaldoRegaliaRedAlterna.count({ where: { lote: LOTE } });
      const copiadosUsuarios = await tx.respaldoUsuarioBorrado.count({ where: { lote: LOTE } });
      if (copiadasRegalias !== regalias.length || copiadosUsuarios !== reales.length) {
        throw new Error(
          `La copia de respaldo no coincide (regalías ${copiadasRegalias}/${regalias.length}, usuarios ${copiadosUsuarios}/${reales.length}). Se cancela sin borrar nada.`
        );
      }

      // 3) Borrado, en orden seguro
      await tx.notificacionUsuario.deleteMany({ where: { destinatarioId: { in: borrarIds } } });
      await tx.notificacionOculta.deleteMany({ where: { usuarioId: { in: borrarIds } } });
      await tx.inscripcionCurso.deleteMany({ where: { usuarioId: { in: borrarIds } } });
      await tx.regaliaRedAlterna.deleteMany({});
      await tx.preregistro.deleteMany({ where: preregistrosWhere });
      await tx.slotRestringido.deleteMany({ where: { id: { in: slotsBorrarIds } } });

      await tx.user.updateMany({
        where: { id: { in: huerfanosAlterna.map((u) => u.id) } },
        data: { padreAlternaId: null, posicionEnPadreAlterna: null },
      });
      await tx.user.updateMany({
        where: { id: { in: huerfanosInvitador.map((u) => u.id) } },
        data: { invitadoPorId: null },
      });

      const borrados = await tx.user.deleteMany({ where: { id: { in: borrarIds } } });
      if (borrados.count !== borrarIds.length) {
        throw new Error(`Se esperaban borrar ${borrarIds.length} usuarios y se borraron ${borrados.count}. Se cancela.`);
      }
      console.log(`  Usuarios borrados: ${borrados.count}`);
    },
    { timeout: 120000, maxWait: 20000 }
  );

  const restantes = await prisma.user.count();
  const regaliasRestantes = await prisma.regaliaRedAlterna.count();
  const respaldadas = await prisma.respaldoRegaliaRedAlterna.count({ where: { lote: LOTE } });
  console.log('\n---- RESULTADO ----');
  console.log(`Usuarios que quedan en la base: ${restantes}`);
  console.log(`Regalías activas ahora: ${regaliasRestantes} (la cuenta empieza desde cero)`);
  console.log(`Regalías respaldadas (lote ${LOTE}): ${respaldadas}`);
  console.log('\n🎉 Listo. Siguiente paso: npm run db:simular-primer-invitado-restringidos');
  console.log('   (vuelve a poner el pago simulado de nivel 1 a los restringidos sin invitados).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
