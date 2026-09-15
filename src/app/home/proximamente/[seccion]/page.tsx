import { notFound } from 'next/navigation';
import ProximamenteGenerico from '@/components/ProximamenteGenerico';

const TITULOS: Record<string, string> = {
  'biblioteca-digital': 'Biblioteca Digital',
  'universidad-machtia': 'Universidad Machtia®',
  'eventos-especiales': 'Eventos especiales',
  'sep-conocer': 'SEP-Conocer',
  romi: 'Romi®',
  'servicios-digitales': 'Servicios Digitales',
  sorteos: 'Sorteos',
  'fundacion-machtia': 'Fundación Machtia®',
  'negocios-alianzas': 'Negocios y Alianzas',
};

export default function ProximamentePage({ params }: { params: { seccion: string } }) {
  const titulo = TITULOS[params.seccion];
  if (!titulo) notFound();
  return <ProximamenteGenerico titulo={titulo} />;
}
