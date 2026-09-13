export interface Pais {
  nombre: string;
  lada: string;
}

// Los países más comunes para este mercado, más los principales de
// habla hispana e inglesa. Es fácil agregar más países después —
// solo se agrega una línea aquí, no requiere tocar el resto del
// formulario.
export const PAISES: Pais[] = [
  { nombre: 'México', lada: '+52' },
  { nombre: 'Estados Unidos', lada: '+1' },
  { nombre: 'Canadá', lada: '+1' },
  { nombre: 'Guatemala', lada: '+502' },
  { nombre: 'Belice', lada: '+501' },
  { nombre: 'Honduras', lada: '+504' },
  { nombre: 'El Salvador', lada: '+503' },
  { nombre: 'Nicaragua', lada: '+505' },
  { nombre: 'Costa Rica', lada: '+506' },
  { nombre: 'Panamá', lada: '+507' },
  { nombre: 'Colombia', lada: '+57' },
  { nombre: 'Venezuela', lada: '+58' },
  { nombre: 'Ecuador', lada: '+593' },
  { nombre: 'Perú', lada: '+51' },
  { nombre: 'Bolivia', lada: '+591' },
  { nombre: 'Chile', lada: '+56' },
  { nombre: 'Argentina', lada: '+54' },
  { nombre: 'Uruguay', lada: '+598' },
  { nombre: 'Paraguay', lada: '+595' },
  { nombre: 'República Dominicana', lada: '+1' },
  { nombre: 'Cuba', lada: '+53' },
  { nombre: 'Puerto Rico', lada: '+1' },
  { nombre: 'España', lada: '+34' },
];

export const ESTADOS_MEXICO: string[] = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de México',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
];

export function ladaPorPais(nombrePais: string): string {
  return PAISES.find((p) => p.nombre === nombrePais)?.lada ?? '';
}
