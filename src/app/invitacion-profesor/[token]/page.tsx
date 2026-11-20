import { prisma } from '@/lib/prisma';
import InvitacionProfesor from '@/components/InvitacionProfesor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Machtia · Registro de Profesor/Facilitador' };

export default async function InvitacionProfesorPage({ params }: { params: { token: string } }) {
  const espacio = await prisma.espacioProfesor.findUnique({
    where: { inviteLink: params.token },
    select: { status: true },
  });

  if (!espacio || espacio.status !== 'INVITADO') {
    return (
      <div className="min-h-svh bg-[linear-gradient(180deg,#ffffff_0%,#f3f8fc_100%)] text-cm-tinta flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <img src="/brand/logo-lockup-color.png" alt="Machtia" className="h-10 w-auto mx-auto mb-6" />
          <h1 className="text-[22px] font-extrabold mb-3">Este enlace ya no está disponible</h1>
          <p className="text-slate-600 text-[14.5px]">
            Verifica el enlace con la persona que te lo compartió.
          </p>
        </div>
      </div>
    );
  }

  return <InvitacionProfesor token={params.token} />;
}
