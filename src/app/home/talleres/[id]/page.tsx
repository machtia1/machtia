import DetalleCurso from '@/components/cursos/DetalleCurso';

export default function DetalleTallerPage({ params }: { params: { id: string } }) {
  return <DetalleCurso id={params.id} tipoRuta="talleres" />;
}
