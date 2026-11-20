/**
 * Datos bancarios / wallet de los usuarios (Entrega 3).
 * Validación, catálogo de bancos y enmascarado. Sin acceso a la base.
 */

export type TipoBanco = 'MEXICO' | 'INTERNACIONAL';

export interface DatosBanco {
  tipo: TipoBanco;
  banco: string;
  cuenta: string; // CLABE (México) o número de cuenta/IBAN (otros países)
  titular: string;
  pais?: string; // solo internacional
  adicionales?: string; // SWIFT/BIC, sucursal, etc.
}

export interface DatosWallet {
  moneda: 'USDC' | 'USDT';
  red: string;
  direccion: string;
  adicionales?: string; // memo / tag / referencia
}

export interface DatosGuardados {
  banco: DatosBanco | null;
  wallet: DatosWallet | null;
}

export const MONEDAS_WALLET = ['USDC', 'USDT'] as const;

export const REDES_WALLET: { valor: string; etiqueta: string; formato: 'EVM' | 'TRON' | 'SOLANA' }[] = [
  { valor: 'ERC-20', etiqueta: 'ERC-20 (Ethereum)', formato: 'EVM' },
  { valor: 'TRC-20', etiqueta: 'TRC-20 (Tron)', formato: 'TRON' },
  { valor: 'BEP-20', etiqueta: 'BEP-20 (BNB Smart Chain)', formato: 'EVM' },
  { valor: 'POLYGON', etiqueta: 'Polygon', formato: 'EVM' },
  { valor: 'SOLANA', etiqueta: 'Solana', formato: 'SOLANA' },
  { valor: 'ARBITRUM', etiqueta: 'Arbitrum', formato: 'EVM' },
  { valor: 'OPTIMISM', etiqueta: 'Optimism', formato: 'EVM' },
  { valor: 'AVALANCHE', etiqueta: 'Avalanche C-Chain', formato: 'EVM' },
  { valor: 'BASE', etiqueta: 'Base', formato: 'EVM' },
];

/** Bancos de México por los 3 primeros dígitos de la CLABE (claves de Banxico). */
export const BANCOS_MEXICO: Record<string, string> = {
  '002': 'Banamex',
  '006': 'Bancomext',
  '009': 'Banobras',
  '012': 'BBVA México',
  '014': 'Santander',
  '019': 'Banjército',
  '021': 'HSBC',
  '030': 'BanBajío',
  '032': 'IXE',
  '036': 'Inbursa',
  '037': 'Interacciones',
  '042': 'Mifel',
  '044': 'Scotiabank',
  '058': 'Banregio',
  '059': 'Invex',
  '060': 'Bansí',
  '062': 'Afirme',
  '072': 'Banorte',
  '103': 'American Express',
  '106': 'Bank of America',
  '108': 'MUFG',
  '110': 'JP Morgan',
  '112': 'Monex',
  '113': 'Ve por Más',
  '127': 'Banco Azteca',
  '128': 'Autofin',
  '130': 'Compartamos',
  '131': 'Banco Famsa',
  '132': 'Multiva',
  '133': 'Actinver',
  '136': 'Intercam',
  '137': 'BanCoppel',
  '138': 'ABC Capital',
  '140': 'Consubanco',
  '143': 'CIBanco',
  '145': 'BBase',
  '147': 'Bankaool',
  '148': 'PagaTodo',
  '155': 'ICBC',
  '156': 'Sabadell',
  '166': 'Banco del Bienestar',
  '168': 'Hipotecaria Federal',
  '638': 'Nu México',
  '646': 'STP',
  '684': 'Transfer',
  '722': 'Mercado Pago',
};

export const OTRO_BANCO = 'Otro banco';
export const LISTA_BANCOS_MEXICO = [...Object.values(BANCOS_MEXICO).sort((a, b) => a.localeCompare(b, 'es')), OTRO_BANCO];

/** Dígito verificador de la CLABE (algoritmo oficial: pesos 3-7-1). */
export function clabeValida(clabe: string): boolean {
  if (!/^\d{18}$/.test(clabe)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(clabe[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(clabe[17]);
}

export function bancoDeClabe(clabe: string): string | null {
  return BANCOS_MEXICO[clabe.slice(0, 3)] ?? null;
}

const limpiarTexto = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export function validarBanco(entrada: unknown): { errores: string[]; limpio: DatosBanco | null } {
  const errores: string[] = [];
  const e = (entrada ?? {}) as Record<string, unknown>;
  const tipo: TipoBanco = e.tipo === 'INTERNACIONAL' ? 'INTERNACIONAL' : 'MEXICO';
  const titular = limpiarTexto(e.titular, 120);
  let banco = limpiarTexto(e.banco, 80);
  const adicionales = limpiarTexto(e.adicionales, 200);

  if (titular.length < 3) errores.push('Escriba el nombre completo del beneficiario (titular de la cuenta).');

  if (tipo === 'MEXICO') {
    const cuenta = String(e.cuenta ?? '').replace(/[\s-]/g, '');
    if (!/^\d{18}$/.test(cuenta)) errores.push('La CLABE debe tener exactamente 18 dígitos.');
    else if (!clabeValida(cuenta)) errores.push('La CLABE no es válida (el dígito verificador no coincide). Revísela.');
    const delaClabe = /^\d{18}$/.test(cuenta) ? bancoDeClabe(cuenta) : null;
    if (!banco) errores.push('Seleccione el banco.');
    else if (delaClabe && banco !== delaClabe && banco !== OTRO_BANCO) {
      errores.push(`Esa CLABE corresponde a ${delaClabe}, no a ${banco}. Revise el banco o la CLABE.`);
    } else if (!delaClabe && /^\d{18}$/.test(cuenta) && banco !== OTRO_BANCO && !LISTA_BANCOS_MEXICO.includes(banco)) {
      errores.push('Seleccione un banco de la lista.');
    }
    if (delaClabe && banco === OTRO_BANCO) banco = delaClabe;
    return errores.length ? { errores, limpio: null } : { errores, limpio: { tipo, banco, cuenta, titular, adicionales: adicionales || undefined } };
  }

  const cuenta = String(e.cuenta ?? '').replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{4,34}$/.test(cuenta)) errores.push('El número de cuenta (o IBAN) debe tener de 4 a 34 letras o números.');
  if (banco.length < 2) errores.push('Escriba el nombre del banco.');
  const pais = limpiarTexto(e.pais, 60);
  if (pais.length < 2) errores.push('Escriba el país del banco.');
  return errores.length
    ? { errores, limpio: null }
    : { errores, limpio: { tipo, banco, cuenta, titular, pais, adicionales: adicionales || undefined } };
}

export function validarWallet(entrada: unknown): { errores: string[]; limpio: DatosWallet | null } {
  const errores: string[] = [];
  const e = (entrada ?? {}) as Record<string, unknown>;
  const moneda = e.moneda;
  if (moneda !== 'USDC' && moneda !== 'USDT') errores.push('Elija la moneda: USDC o USDT.');
  const red = REDES_WALLET.find((r) => r.valor === e.red);
  if (!red) errores.push('Seleccione la red de la wallet.');
  const direccion = String(e.direccion ?? '').replace(/\s/g, '');
  if (red) {
    const buena =
      red.formato === 'EVM'
        ? /^0x[a-fA-F0-9]{40}$/.test(direccion)
        : red.formato === 'TRON'
          ? /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(direccion)
          : /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(direccion);
    if (!direccion) errores.push('Escriba la dirección de la wallet.');
    else if (!buena) errores.push(`La dirección no tiene el formato de la red ${red.etiqueta}. Revise que sea de esa red.`);
  }
  const adicionales = limpiarTexto(e.adicionales, 200);
  return errores.length || !red
    ? { errores, limpio: null }
    : { errores, limpio: { moneda: moneda as 'USDC' | 'USDT', red: red.valor, direccion, adicionales: adicionales || undefined } };
}

/** "•••• 1234" — para mostrar al dueño sin exponer el dato completo. */
export function enmascarar(valor: string, visibles = 4): string {
  if (!valor) return '';
  return valor.length <= visibles ? valor : `•••• ${valor.slice(-visibles)}`;
}

export function enmascararWallet(direccion: string): string {
  return direccion.length <= 10 ? direccion : `${direccion.slice(0, 6)}…${direccion.slice(-4)}`;
}
