import RestablecerPassword from '@/components/RestablecerPassword';

export default function RestablecerPage({ params }: { params: { token: string } }) {
  return <RestablecerPassword token={params.token} />;
}
