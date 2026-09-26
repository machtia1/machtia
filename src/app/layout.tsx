import type { Metadata } from 'next';
import './globals.css';
import ChunkErrorGuard from '@/components/ChunkErrorGuard';

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
        <ChunkErrorGuard />
        {children}
      </body>
    </html>
  );
}
