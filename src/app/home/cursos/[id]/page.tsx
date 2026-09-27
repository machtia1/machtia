import DetalleCurso from '@/components/cursos/DetalleCurso';

export default function DetalleCursoPage({ params }: { params: { id: string } }) {
  return <DetalleCurso id={params.id} tipoRuta="cursos" />;
}
