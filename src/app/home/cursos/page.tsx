import { Suspense } from 'react';
import CursosHub from '@/components/cursos/CursosHub';
import LoadingLogo from '@/components/LoadingLogo';

export default function CursosPage() {
  return (
    <Suspense fallback={<LoadingLogo fullScreen label="Cargando cursos..." />}>
      <CursosHub tipo="CURSO" />
    </Suspense>
  );
}
