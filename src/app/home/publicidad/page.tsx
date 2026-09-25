import Link from 'next/link';
import PublicidadCarrusel from '@/components/PublicidadCarrusel';

export default function PublicidadPage() {
  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <Link href="/home" className="text-[13px] text-cm-primary font-semibold mb-3 inline-block">
        ← Volver a inicio
      </Link>
      <h1 className="text-[22px] font-semibold mb-1">Publicidad</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Descarga estas imágenes listas para publicar en tus redes sociales y promocionar el
        negocio.
      </p>

      <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5">
        <PublicidadCarrusel />
      </div>
    </div>
  );
}
