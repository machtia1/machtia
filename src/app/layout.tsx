import type { Metadata, Viewport } from 'next';
import './globals.css';
import ChunkErrorGuard from '@/components/ChunkErrorGuard';
import BloqueoTemporal from '@/components/BloqueoTemporal';

// Bloqueo temporal de todo el sitio. true = bloqueado, false = normal.
const BLOQUEO_ACTIVO = false;

// Dirección pública del sitio: hace falta para que la imagen de vista previa
// (WhatsApp, Facebook, etc.) lleve una dirección completa. Usa la misma
// variable que ya usan los correos (NEXT_PUBLIC_APP_URL); si no existe o está
// mal escrita, usa el dominio principal en vez de romper el sitio.
function direccionDelSitio(): URL {
  const candidatas = [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL];
  for (const candidata of candidatas) {
    if (!candidata) continue;
    try {
      return new URL(candidata);
    } catch {
      /* dirección inválida: se prueba la siguiente */
    }
  }
  return new URL('https://www.machtiaeducacion.com');
}

const TITULO = 'Machtia';
const DESCRIPCION = 'Machtia®, plataforma educativa.';

export const metadata: Metadata = {
  metadataBase: direccionDelSitio(),
  title: TITULO,
  description: DESCRIPCION,
  applicationName: TITULO,
  // Los íconos (favicon, ícono de iPhone) salen de src/app/icon.png,
  // apple-icon.png y favicon.ico: Next.js los detecta solo.
  openGraph: {
    type: 'website',
    siteName: TITULO,
    title: TITULO,
    description: DESCRIPCION,
    locale: 'es_MX',
    images: [{ url: '/brand/og-machtia.jpg', width: 1200, height: 630, alt: 'Machtia®' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: ['/brand/og-machtia.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0E27',
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
