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
  { nombre: 'Brasil', lada: '+55' },
  { nombre: 'Portugal', lada: '+351' },
  { nombre: 'Francia', lada: '+33' },
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

// Código ISO de 2 letras por país, usado para mostrar la banderita
// junto a cada persona en "Mis Invitados" (pedido por el cliente el
// 25 sept 2026). Se arma el emoji de bandera a partir del código
// (ej. "MX" → 🇲🇽) en vez de usar imágenes, para que nunca truene
// por una URL caída.
const CODIGO_ISO_POR_PAIS: Record<string, string> = {
  México: 'MX',
  'Estados Unidos': 'US',
  Canadá: 'CA',
  Guatemala: 'GT',
  Belice: 'BZ',
  Honduras: 'HN',
  'El Salvador': 'SV',
  Nicaragua: 'NI',
  'Costa Rica': 'CR',
  Panamá: 'PA',
  Colombia: 'CO',
  Venezuela: 'VE',
  Ecuador: 'EC',
  Perú: 'PE',
  Bolivia: 'BO',
  Chile: 'CL',
  Argentina: 'AR',
  Uruguay: 'UY',
  Paraguay: 'PY',
  'República Dominicana': 'DO',
  Cuba: 'CU',
  'Puerto Rico': 'PR',
  España: 'ES',
  Brasil: 'BR',
  Portugal: 'PT',
  Francia: 'FR',
};

export function banderaPorPais(nombrePais?: string | null): string {
  const codigo = nombrePais ? CODIGO_ISO_POR_PAIS[nombrePais] : undefined;
  if (!codigo) return '🌐';
  // Cada letra del código ISO se convierte en su "regional indicator
  // symbol" — combinados, los navegadores los renderizan como la
  // bandera del país.
  return codigo
    .toUpperCase()
    .split('')
    .map((letra) => String.fromCodePoint(127397 + letra.charCodeAt(0)))
    .join('');
}
