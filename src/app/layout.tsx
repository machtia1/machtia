import type { Metadata } from 'next';
import './globals.css';
import ChunkErrorGuard from '@/components/ChunkErrorGuard';
import BloqueoTemporal from '@/components/BloqueoTemporal';

// Bloqueo temporal de todo el sitio. true = bloqueado, false = normal.
const BLOQUEO_ACTIVO = false;

export const metadata: Metadata = {
  title: 'Club Machtia',
  description: 'Plataforma educativa Club Machtia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {BLOQUEO_ACTIVO ? (
          <BloqueoTemporal />
        ) : (
          <>
            <ChunkErrorGuard />
            {children}
          </>
        )}
      </body>
    </html>
  );
}
