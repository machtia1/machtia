import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    redirect('/');
  }

  return <>{children}</>;
}
