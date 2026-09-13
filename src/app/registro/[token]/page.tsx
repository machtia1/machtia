import RegistroCompleto from '@/components/RegistroCompleto';

export default function RegistroPage({ params }: { params: { token: string } }) {
  return <RegistroCompleto token={params.token} />;
}
