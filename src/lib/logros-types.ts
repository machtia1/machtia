export type CategoriaLogro = 'academico' | 'red' | 'ganancias';

export interface LogroDefinicion {
  id: string;
  categoria: CategoriaLogro;
  nombre: string;
  descripcion: string;
  /** Si es false, el logro todavía no se puede calcular (depende de un módulo que no existe aún). */
  disponible: boolean;
}

export interface LogroConEstado extends LogroDefinicion {
  desbloqueado: boolean;
  progresoActual: number;
  progresoMeta: number;
}

export interface LogrosUsuario {
  academicos: LogroConEstado[];
  red: LogroConEstado[];
  ganancias: LogroConEstado[];
}

export const LOGROS_ACADEMICOS: LogroDefinicion[] = [
  { id: 'primer-paso', categoria: 'academico', nombre: 'Primer Paso', descripcion: 'Completa 1 curso', disponible: false },
  { id: 'aprendiz-constante', categoria: 'academico', nombre: 'Aprendiz Constante', descripcion: 'Completa 2 cursos', disponible: false },
  { id: 'manos-a-la-obra', categoria: 'academico', nombre: 'Manos a la Obra', descripcion: 'Completa 1 taller', disponible: false },
  { id: 'creador-en-accion', categoria: 'academico', nombre: 'Creador en Acción', descripcion: 'Completa 2 talleres', disponible: false },
  { id: 'conexion-de-saberes', categoria: 'academico', nombre: 'Conexión de Saberes', descripcion: 'Asiste a 2 seminarios online', disponible: false },
  { id: 'impulsor-educativo', categoria: 'academico', nombre: 'Impulsor Educativo', descripcion: 'Organiza eventos educativos', disponible: false },
  { id: 'maestro-del-aprendizaje', categoria: 'academico', nombre: 'Maestro del Aprendizaje', descripcion: 'Completa 10 cursos', disponible: false },
  { id: 'experto-tematico', categoria: 'academico', nombre: 'Experto Temático', descripcion: 'Completa 15+ cursos de una temática', disponible: false },
];

export const LOGROS_RED: LogroDefinicion[] = [
  { id: 'fundador-de-la-red', categoria: 'red', nombre: 'Fundador de la Red', descripcion: 'Únete antes del lanzamiento', disponible: true },
  { id: 'impulsor-del-lanzamiento', categoria: 'red', nombre: 'Impulsor del Lanzamiento', descripcion: 'Invita a 2 personas en campaña', disponible: true },
  { id: 'embajador-machtia', categoria: 'red', nombre: 'Embajador Machtia', descripcion: 'Invita a 8 personas directas', disponible: true },
  { id: 'lider-de-expansion', categoria: 'red', nombre: 'Líder de Expansión', descripcion: 'Invita a 20 personas directas', disponible: true },
  { id: 'capitan-del-lanzamiento', categoria: 'red', nombre: 'Capitán del Lanzamiento', descripcion: 'Invita a 30 personas directas', disponible: true },
  { id: 'constructor-de-comunidad', categoria: 'red', nombre: 'Constructor de Comunidad', descripcion: 'Forma una red de 20 personas', disponible: true },
  { id: 'arquitecto-de-redes', categoria: 'red', nombre: 'Arquitecto de Redes', descripcion: 'Forma una red de 60 personas', disponible: true },
  { id: 'visionario-de-la-red', categoria: 'red', nombre: 'Visionario de la Red', descripcion: 'Alcanza una red de 200 personas', disponible: true },
];

export const LOGROS_GANANCIAS: LogroDefinicion[] = [
  { id: 'primer-impulso', categoria: 'ganancias', nombre: 'Primer Impulso', descripcion: 'Recibe tu primera comisión directa', disponible: true },
  { id: 'la-red-responde', categoria: 'ganancias', nombre: 'La Red Responde', descripcion: 'Recibe tu primera comisión de la Red', disponible: true },
  { id: 'ascenso-50', categoria: 'ganancias', nombre: 'Ascenso 50', descripcion: 'Alcanza USD 50 en ganancias', disponible: true },
  { id: 'hito-100', categoria: 'ganancias', nombre: 'Hito 100', descripcion: 'Alcanza USD 100 en ganancias', disponible: true },
  { id: 'cumbre-1000', categoria: 'ganancias', nombre: 'Cumbre 1000', descripcion: 'Supera USD 1,000 en ganancias', disponible: true },
];
