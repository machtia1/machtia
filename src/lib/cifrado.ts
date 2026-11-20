import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Cifrado de datos sensibles en la base (AES-256-GCM).
 *
 * La llave sale de la variable de entorno DATOS_BANCARIOS_KEY (32 bytes
 * en base64 o 64 caracteres hexadecimales). Sin llave NO se guarda nada:
 * es preferible fallar a guardar datos bancarios sin cifrar.
 *
 * Formato guardado: "v1.<iv>.<etiqueta>.<texto cifrado>" (todo en base64).
 * GCM además autentica: si alguien altera el valor en la base, al
 * descifrarlo falla en lugar de devolver datos falsos.
 */

export class CifradoNoConfigurado extends Error {
  constructor() {
    super('El cifrado de datos bancarios no está configurado en el servidor');
  }
}

function leerLlave(): Buffer {
  const crudo = (process.env.DATOS_BANCARIOS_KEY ?? '').trim();
  if (!crudo) throw new CifradoNoConfigurado();
  let llave: Buffer | null = null;
  if (/^[0-9a-fA-F]{64}$/.test(crudo)) llave = Buffer.from(crudo, 'hex');
  else {
    const b = Buffer.from(crudo, 'base64');
    if (b.length === 32) llave = b;
  }
  if (!llave) throw new CifradoNoConfigurado();
  return llave;
}

export function cifradoDisponible(): boolean {
  try {
    leerLlave();
    return true;
  } catch {
    return false;
  }
}

export function cifrar(texto: string): string {
  const llave = leerLlave();
  const iv = randomBytes(12);
  const cifrador = createCipheriv('aes-256-gcm', llave, iv);
  const datos = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), datos.toString('base64')].join('.');
}

export function descifrar(valor: string): string {
  const llave = leerLlave();
  const partes = valor.split('.');
  if (partes.length !== 4 || partes[0] !== 'v1') throw new Error('Formato de dato cifrado no reconocido');
  const descifrador = createDecipheriv('aes-256-gcm', llave, Buffer.from(partes[1], 'base64'));
  descifrador.setAuthTag(Buffer.from(partes[2], 'base64'));
  return Buffer.concat([descifrador.update(Buffer.from(partes[3], 'base64')), descifrador.final()]).toString('utf8');
}
