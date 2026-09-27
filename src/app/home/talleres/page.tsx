import { Suspense } from 'react';
import CursosHub from '@/components/cursos/CursosHub';
import LoadingLogo from '@/components/LoadingLogo';

export default function TalleresPage() {
  return (
    <Suspense fallback={<LoadingLogo fullScreen label="Cargando talleres..." />}>
      <CursosHub tipo="TALLER" />
    </Suspense>
  );
}
