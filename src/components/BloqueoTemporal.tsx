/**
 * Pantalla de bloqueo temporal (30 oct 2026).
 * Se activa/desactiva con BLOQUEO_ACTIVO en src/app/layout.tsx.
 * No toca base de datos ni datos de nadie.
 */
export default function BloqueoTemporal() {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Sitio temporalmente bloqueado"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        background: 'linear-gradient(135deg, #7f0000 0%, #b91c1c 50%, #7f0000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          color: '#1f2937',
          maxWidth: '440px',
          width: '100%',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: '48px', lineHeight: 1 }} aria-hidden="true">⚠️</div>
        <h1
          style={{
            margin: '16px 0 8px',
            fontSize: '22px',
            fontWeight: 800,
            color: '#b91c1c',
            letterSpacing: '0.02em',
          }}
        >
          SITIO TEMPORALMENTE BLOQUEADO
        </h1>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5 }}>
          Servicio suspendido temporalmente. Por favor contacte al administrador.
        </p>
      </div>
    </div>
  );
}
