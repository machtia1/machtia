import { prisma } from '@/lib/prisma';
import InvitacionLanding from '@/components/InvitacionLanding';

export default async function InvitacionPage({
  params,
}: {
  params: { invitador: string };
}) {
  const invitador = await prisma.user.findUnique({
    where: { linkInvitacion: params.invitador },
    select: { id: true, nombre: true, apellido: true, status: true },
  });

  if (!invitador || invitador.status !== 'ACTIVA') {
    return (
      <div className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-[22px] font-semibold mb-3">Este enlace ya no está disponible</h1>
          <p className="text-white/60 text-[14px]">
            Verifica el link con la persona que te lo compartió, o visita clubmachtia.com para
            más información.
          </p>
        </div>
      </div>
    );
  }

  return (
    <InvitacionLanding
      invitadorLinkId={params.invitador}
      invitadorNombre={`${invitador.nombre} ${invitador.apellido}`}
    />
  );
}
