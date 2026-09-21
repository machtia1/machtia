/**
 * Ícono de carga animado con el logo de Club Machtia (crece y se
 * encoge en bucle) — pedido por el cliente el 20 sept 2026 para
 * reemplazar los textos planos de "Cargando..." en toda la
 * plataforma.
 */
export default function LoadingLogo({
  size = 40,
  label,
  fullScreen = false,
  className = '',
}: {
  size?: number;
  label?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  const contenido = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <img
        src="/brand/icon-color.png"
        alt="Cargando"
        style={{ width: size, height: size }}
        className="animate-logo-pulse"
      />
      {label && <p className="text-[#6B7280] text-[13px]">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6FB]">{contenido}</div>
    );
  }

  return <div className="py-8">{contenido}</div>;
}
