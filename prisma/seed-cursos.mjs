// Siembra inicial de Cursos y Talleres — "Elemento 4" (26 sept
// 2026). Crea instructores, rutas de aprendizaje, cursos/talleres
// con sus lecciones, y algunos eventos en vivo próximos, para que la
// sección no se vea vacía y se pueda probar el flujo completo
// (buscar, filtrar, inscribirse, avanzar lecciones, evaluación).
//
// Seguro de correr más de una vez: si ya hay cursos sembrados
// (busca por título), no los vuelve a crear.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INSTRUCTORES = [
  { nombre: 'Laura Gómez', especialidad: 'Marketing y negocios' },
  { nombre: 'Carlos Ruiz', especialidad: 'Finanzas personales' },
  { nombre: 'Ana Torres', especialidad: 'Creatividad y contenido' },
  { nombre: 'Miguel Ángel', especialidad: 'Desarrollo personal' },
  { nombre: 'Sofía Ramírez', especialidad: 'Salud y bienestar' },
  { nombre: 'David Chávez', especialidad: 'Habilidades digitales' },
];

const RUTAS = [
  { titulo: 'Emprende desde cero', descripcion: 'Aprende los fundamentos para crear y hacer crecer tu negocio.', nivel: 'BASICO', color: '#2E3192' },
  { titulo: 'Domina tus finanzas', descripcion: 'Mejora tu relación con el dinero y alcanza tus metas.', nivel: 'BASICO', color: '#16A34A' },
  { titulo: 'Marketing para negocios', descripcion: 'Estrategias prácticas para atraer más clientes.', nivel: 'INTERMEDIO', color: '#DB2777' },
];

function lecciones(temas) {
  return temas.map((titulo, i) => ({
    titulo,
    orden: i + 1,
    tipoContenido: i % 3 === 2 ? 'LECTURA' : 'VIDEO',
    contenidoUrl: i % 3 === 2 ? null : 'https://example.com/video-demo.mp4',
    contenidoTexto:
      i % 3 === 2
        ? 'Contenido de lectura de ejemplo para esta lección. Aquí iría el material real del curso.'
        : null,
    duracionMinutos: 6 + (i % 4) * 3,
  }));
}

const CURSOS = [
  {
    titulo: 'Marketing digital',
    descripcionBreve: 'Los fundamentos para promocionar cualquier negocio en redes e internet.',
    categoria: 'MARKETING',
    nivel: 'BASICO',
    instructor: 'Laura Gómez',
    ruta: 'Marketing para negocios',
    esNuevo: false,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.8,
    numCalificaciones: 1200,
    temas: ['¿Qué es el marketing digital?', 'Redes sociales para tu negocio', 'Anuncios pagados básicos', 'Mide tus resultados'],
  },
  {
    titulo: 'Inglés 1',
    descripcionBreve: 'Primeros pasos para comunicarte en inglés en situaciones cotidianas.',
    categoria: 'IDIOMAS',
    nivel: 'BASICO',
    instructor: 'Ana Torres',
    esNuevo: false,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.7,
    numCalificaciones: 980,
    temas: ['Saludos y presentaciones', 'Números y fechas', 'Preguntas básicas', 'Vocabulario del día a día', 'Práctica de conversación'],
  },
  {
    titulo: 'Emprende desde cero',
    descripcionBreve: 'Todo lo que necesitas saber antes de lanzar tu primer negocio.',
    categoria: 'NEGOCIOS',
    nivel: 'INTERMEDIO',
    instructor: 'Miguel Ángel',
    ruta: 'Emprende desde cero',
    esNuevo: false,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.9,
    numCalificaciones: 860,
    temas: ['Encuentra tu idea de negocio', 'Valida tu idea con clientes reales', 'Arma tu plan básico', 'Primeros pasos legales'],
  },
  {
    titulo: 'Bienestar personal',
    descripcionBreve: 'Hábitos simples para sentirte mejor física y mentalmente.',
    categoria: 'SALUD',
    nivel: 'BASICO',
    instructor: 'Sofía Ramírez',
    esNuevo: false,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.8,
    numCalificaciones: 740,
    temas: ['Rutinas matutinas', 'Manejo del estrés', 'Alimentación consciente'],
  },
  {
    titulo: 'Productividad con IA',
    descripcionBreve: 'Usa herramientas de inteligencia artificial para trabajar más rápido.',
    categoria: 'HABILIDADES_DIGITALES',
    nivel: 'BASICO',
    instructor: 'David Chávez',
    esNuevo: true,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.9,
    numCalificaciones: 320,
    temas: ['Introducción a la IA generativa', 'Automatiza tareas repetitivas', 'Prompts efectivos', 'Casos de uso reales'],
  },
  {
    titulo: 'Gestión del tiempo',
    descripcionBreve: 'Organiza tu día y deja de sentirte abrumado.',
    categoria: 'HABILIDADES_DIGITALES',
    nivel: 'BASICO',
    instructor: 'Carlos Ruiz',
    esNuevo: true,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.8,
    numCalificaciones: 280,
    temas: ['Prioriza lo importante', 'Herramientas de organización', 'Evita las distracciones'],
  },
  {
    titulo: 'Fotografía para redes',
    descripcionBreve: 'Toma mejores fotos para tu negocio con solo tu celular.',
    categoria: 'MARKETING',
    nivel: 'INTERMEDIO',
    instructor: 'Ana Torres',
    esNuevo: true,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.7,
    numCalificaciones: 210,
    temas: ['Luz y composición', 'Edición básica', 'Cómo mostrar tus productos'],
  },
  {
    titulo: 'Comunicación efectiva',
    descripcionBreve: 'Aprende a expresarte con claridad en cualquier situación.',
    categoria: 'NEGOCIOS',
    nivel: 'BASICO',
    instructor: 'Miguel Ángel',
    esNuevo: true,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.8,
    numCalificaciones: 190,
    temas: ['Escucha activa', 'Comunicación asertiva', 'Hablar en público'],
  },
  {
    titulo: '5 hábitos para ser más productivo',
    descripcionBreve: 'Una clase corta y directa para aplicar hoy mismo.',
    categoria: 'HABILIDADES_DIGITALES',
    nivel: 'BASICO',
    instructor: 'David Chávez',
    esNuevo: false,
    esEspecial: false,
    esCorto: true,
    calificacionPromedio: 4.6,
    numCalificaciones: 150,
    temas: ['Los 5 hábitos, explicados rápido'],
  },
  {
    titulo: 'Cómo organizar tus finanzas',
    descripcionBreve: 'Clase corta para poner en orden tus cuentas en una tarde.',
    categoria: 'FINANZAS',
    nivel: 'BASICO',
    instructor: 'Carlos Ruiz',
    ruta: 'Domina tus finanzas',
    esNuevo: false,
    esEspecial: false,
    esCorto: true,
    calificacionPromedio: 4.7,
    numCalificaciones: 140,
    temas: ['Ordena tus gastos', 'Arma tu primer presupuesto'],
  },
  {
    titulo: 'Genera ideas para tu negocio',
    descripcionBreve: 'Ejercicios rápidos de lluvia de ideas aplicados a negocios reales.',
    categoria: 'NEGOCIOS',
    nivel: 'BASICO',
    instructor: 'Miguel Ángel',
    ruta: 'Emprende desde cero',
    esNuevo: false,
    esEspecial: false,
    esCorto: true,
    calificacionPromedio: 4.6,
    numCalificaciones: 120,
    temas: ['Técnicas de lluvia de ideas', 'Filtra tus mejores ideas'],
  },
  {
    titulo: 'Introducción al marketing digital',
    descripcionBreve: 'La clase corta perfecta si vas empezando.',
    categoria: 'MARKETING',
    nivel: 'BASICO',
    instructor: 'Laura Gómez',
    ruta: 'Marketing para negocios',
    esNuevo: false,
    esEspecial: false,
    esCorto: true,
    calificacionPromedio: 4.7,
    numCalificaciones: 110,
    temas: ['Qué es y por qué importa', 'Primeros pasos'],
  },
  {
    titulo: 'Finanzas personales desde cero',
    descripcionBreve: 'El curso especial más completo para tomar control de tu dinero.',
    categoria: 'FINANZAS',
    nivel: 'BASICO',
    instructor: 'Carlos Ruiz',
    ruta: 'Domina tus finanzas',
    esNuevo: false,
    esEspecial: true,
    esCorto: false,
    calificacionPromedio: 4.9,
    numCalificaciones: 1450,
    temas: ['Diagnóstico financiero', 'Presupuesto realista', 'Ahorro automático', 'Salir de deudas', 'Primeras inversiones', 'Metas a largo plazo', 'Fondo de emergencia', 'Revisión y ajustes', 'Herramientas recomendadas', 'Plan de acción final', 'Preguntas frecuentes', 'Cierre y siguientes pasos'],
  },
  {
    titulo: 'Domina tus finanzas: nivel avanzado',
    descripcionBreve: 'Curso especial para llevar tus finanzas personales al siguiente nivel.',
    categoria: 'FINANZAS',
    nivel: 'AVANZADO',
    instructor: 'Carlos Ruiz',
    ruta: 'Domina tus finanzas',
    esNuevo: false,
    esEspecial: true,
    esCorto: false,
    calificacionPromedio: 4.8,
    numCalificaciones: 340,
    temas: ['Diversifica tus ingresos', 'Estrategias de inversión', 'Planeación fiscal básica'],
  },
  {
    titulo: 'Marketing para negocios: estrategia avanzada',
    descripcionBreve: 'Curso especial con las tácticas que usan las marcas más exitosas.',
    categoria: 'MARKETING',
    nivel: 'AVANZADO',
    instructor: 'Laura Gómez',
    ruta: 'Marketing para negocios',
    esNuevo: false,
    esEspecial: true,
    esCorto: false,
    calificacionPromedio: 4.9,
    numCalificaciones: 410,
    temas: ['Funnels de venta', 'Email marketing', 'Fidelización de clientes', 'Campañas multicanal'],
  },
];

const TALLERES = [
  {
    titulo: 'Taller: Planifica tu negocio en 2027',
    descripcionBreve: 'Sesión práctica en vivo para armar tu plan del año.',
    categoria: 'NEGOCIOS',
    nivel: 'BASICO',
    instructor: 'Laura Gómez',
    esNuevo: true,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.8,
    numCalificaciones: 60,
    temas: ['Diagnóstico rápido', 'Metas del año', 'Plan de acción'],
  },
  {
    titulo: 'Taller: Finanzas personales en vivo',
    descripcionBreve: 'Sesión práctica para resolver tus dudas de dinero en tiempo real.',
    categoria: 'FINANZAS',
    nivel: 'BASICO',
    instructor: 'Carlos Ruiz',
    esNuevo: true,
    esEspecial: false,
    esCorto: false,
    calificacionPromedio: 4.7,
    numCalificaciones: 45,
    temas: ['Preguntas y respuestas', 'Casos reales'],
  },
];

async function obtenerOCrearInstructor(nombre) {
  const info = INSTRUCTORES.find((i) => i.nombre === nombre);
  let instructor = await prisma.instructor.findFirst({ where: { nombre } });
  if (!instructor) {
    instructor = await prisma.instructor.create({
      data: { nombre, especialidad: info?.especialidad ?? 'Instructor Machtia' },
    });
    console.log(`✅ Instructor creado: ${nombre}`);
  }
  return instructor;
}

async function obtenerOCrearRuta(titulo) {
  if (!titulo) return null;
  const info = RUTAS.find((r) => r.titulo === titulo);
  let ruta = await prisma.rutaAprendizaje.findFirst({ where: { titulo } });
  if (!ruta) {
    ruta = await prisma.rutaAprendizaje.create({
      data: {
        titulo,
        descripcion: info?.descripcion ?? '',
        nivel: info?.nivel ?? 'BASICO',
        color: info?.color ?? '#2E3192',
      },
    });
    console.log(`✅ Ruta de aprendizaje creada: ${titulo}`);
  }
  return ruta;
}

async function sembrarCurso(datos, tipo) {
  const existente = await prisma.curso.findFirst({ where: { titulo: datos.titulo } });
  if (existente) {
    console.log(`⏭️  Ya existe, se omite: ${datos.titulo}`);
    return;
  }

  const instructor = await obtenerOCrearInstructor(datos.instructor);
  const ruta = await obtenerOCrearRuta(datos.ruta);
  const temasLecciones = lecciones(datos.temas);
  const duracionMinutos = temasLecciones.reduce((s, l) => s + l.duracionMinutos, 0);

  await prisma.curso.create({
    data: {
      tipo,
      titulo: datos.titulo,
      descripcionBreve: datos.descripcionBreve,
      categoria: datos.categoria,
      nivel: datos.nivel,
      instructorId: instructor.id,
      rutaAprendizajeId: ruta?.id,
      duracionMinutos,
      calificacionPromedio: datos.calificacionPromedio,
      numCalificaciones: datos.numCalificaciones,
      esNuevo: datos.esNuevo,
      esEspecial: datos.esEspecial,
      esCorto: datos.esCorto,
      lecciones: { create: temasLecciones },
    },
  });
  console.log(`✅ ${tipo === 'TALLER' ? 'Taller' : 'Curso'} creado: ${datos.titulo}`);
}

async function sembrarEventos() {
  const existentes = await prisma.eventoCurso.count();
  if (existentes > 0) {
    console.log('⏭️  Ya hay eventos sembrados, se omite.');
    return;
  }

  const base = Date.now();
  const dias = (n) => new Date(base + n * 86400000);

  await prisma.eventoCurso.createMany({
    data: [
      { titulo: 'Taller: Planifica tu negocio en 2027', instructorNombre: 'Laura Gómez', fechaHora: dias(3) },
      { titulo: 'Clase en vivo: Finanzas personales', instructorNombre: 'Carlos Ruiz', fechaHora: dias(6) },
      { titulo: 'Sesión de preguntas: Marketing digital', instructorNombre: 'Laura Gómez', fechaHora: dias(9) },
      { titulo: 'Clase en vivo: Productividad con IA', instructorNombre: 'David Chávez', fechaHora: dias(13) },
      { titulo: 'Taller: Comunicación efectiva', instructorNombre: 'Miguel Ángel', fechaHora: dias(17) },
      { titulo: 'Clase en vivo: Bienestar personal', instructorNombre: 'Sofía Ramírez', fechaHora: dias(21) },
    ],
  });
  console.log('✅ 6 eventos sembrados.');
}

async function main() {
  console.log('== Sembrar Cursos, Talleres, instructores, rutas y eventos (26 sept 2026) ==');
  for (const c of CURSOS) await sembrarCurso(c, 'CURSO');
  for (const t of TALLERES) await sembrarCurso(t, 'TALLER');
  await sembrarEventos();
  console.log('🎉 Listo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
