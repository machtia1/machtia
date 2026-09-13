import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface SessionPayload {
  userId: string;
  correo: string;
  rol: string;
}

/** Firma un JWT de sesión, válido por 7 días. */
export function signSession(payload: SessionPayload): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno.');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/** Verifica un JWT de sesión. Devuelve null si es inválido o expiró. */
export function verifySession(token: string): SessionPayload | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export type DashboardRole = 'administrador' | 'profesor' | 'socio' | 'usuario' | 'asistente';

/** Convierte el enum Rol de Prisma (BD) al formato corto que usa el Dashboard. */
export function mapRolToDashboard(rol: string): DashboardRole {
  switch (rol) {
    case 'ADMINISTRADOR':
      return 'administrador';
    case 'PROFESOR_FACILITADOR':
      return 'profesor';
    case 'SOCIO':
      return 'socio';
    case 'ASISTENTE_ADMINISTRATIVO':
      return 'asistente';
    case 'USUARIO':
    default:
      return 'usuario';
  }
}
