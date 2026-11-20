import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { folioValido } from '@/lib/evaluacionModulos';
import BotonImprimir from '@/components/cursos/BotonImprimir';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Certificado · Club Machtia', robots: { index: false, follow: false } };

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (d: Date) => `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;

/**
 * Certificado público y verificable: cualquiera con el folio puede abrir
 * esta página y comprobar que el certificado existe y es auténtico.
 * El diseño es sencillo (logo, folio, datos) — el diseño final y la
 * firma las define el cliente.
 */
export default async function PaginaCertificado({ params }: { params: { folio: string } }) {
  const folio = decodeURIComponent(params.folio).toUpperCase();
  const cert = folioValido(folio) ? await prisma.certificado.findUnique({ where: { folio } }) : null;

  if (!cert) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F4F6FB] p-6">
        <div className="max-w-[420px] text-center bg-white border border-[#E4E7EE] rounded-2xl p-8">
          <h1 className="text-[18px] font-bold mb-2">Certificado no encontrado</h1>
          <p className="text-[13px] text-[#6B7280]">
            No existe un certificado con el folio indicado. Revise que lo haya escrito completo (por ejemplo MACH-2026-AB3K-9XZ4).
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6FB] p-4 sm:p-8 print:bg-white print:p-0">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <p className="text-[12.5px] text-[#16A34A] font-semibold">✔ Certificado auténtico emitido por Club Machtia</p>
          <BotonImprimir />
        </div>

        <section className="relative bg-white border-[10px] border-double border-[#1B2A5C] rounded-sm p-8 sm:p-14 text-center print:border-[8px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-lockup-color.png" alt="Club Machtia" className="h-14 sm:h-16 mx-auto mb-6" />
          <p className="uppercase tracking-[0.3em] text-[11px] text-[#6B7280] mb-2">Certificado de finalización</p>
          <p className="text-[13px] text-[#6B7280] mb-3">Club Machtia otorga el presente certificado a</p>
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#1B2A5C] mb-4 break-words">{cert.nombreAlumno}</h1>
          <p className="text-[13px] text-[#6B7280] mb-2">por haber aprobado satisfactoriamente el curso</p>
          <h2 className="text-[20px] sm:text-[24px] font-semibold mb-5 break-words">“{cert.tituloCurso}”</h2>
          <p className="text-[13px] text-[#374151] mb-1">
            Calificación final: <strong>{cert.calificacion}</strong> de {cert.calificacionMaxima}
            {cert.horas ? <> · Duración: <strong>{cert.horas} h</strong></> : null}
          </p>
          {cert.instructor && <p className="text-[13px] text-[#374151] mb-1">Impartido por <strong>{cert.instructor}</strong></p>}
          <p className="text-[13px] text-[#374151] mb-8">Emitido el {fechaLarga(cert.emitidoEn)}</p>
          <div className="border-t border-[#E4E7EE] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11.5px] text-[#6B7280]">
            <span>Folio: <strong className="tracking-wider text-[#1B2A5C]">{cert.folio}</strong></span>
            <span>Verifique su autenticidad en www.machtiaeducacion.com/certificado/{cert.folio}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
