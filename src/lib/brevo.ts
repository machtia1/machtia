// ============================================================
// Brevo (antes Sendinblue) — envío de correos transaccionales
// ------------------------------------------------------------
// IMPORTANTE: necesita la variable de entorno BREVO_API_KEY.
// Esa NO es el correo/contraseña del panel web de Brevo — es una
// API Key que se genera dentro del panel, en:
//   SMTP & API → API Keys → Generate a new API key
//
// Mientras BREVO_API_KEY no esté configurada, esta función no
// truena: solo deja un aviso en consola y no envía nada, para que
// puedas seguir probando el resto del flujo sin bloquearte.
// ============================================================

interface EnviarCorreoParams {
  destinatarioCorreo: string;
  destinatarioNombre: string;
  asunto: string;
  htmlContenido: string;
}

export async function enviarCorreoBrevo({
  destinatarioCorreo,
  destinatarioNombre,
  asunto,
  htmlContenido,
}: EnviarCorreoParams): Promise<{ enviado: boolean; motivo?: string }> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn(
      '[Brevo] BREVO_API_KEY no está configurada — correo NO enviado (modo desarrollo).'
    );
    return { enviado: false, motivo: 'BREVO_API_KEY no configurada' };
  }

  const remitenteCorreo = process.env.BREVO_REMITENTE_CORREO ?? 'no-responder@machtiaeducacion.com';
  const remitenteNombre = process.env.BREVO_REMITENTE_NOMBRE ?? 'Club Machtia';

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: remitenteCorreo, name: remitenteNombre },
        to: [{ email: destinatarioCorreo, name: destinatarioNombre }],
        subject: asunto,
        htmlContent: htmlContenido,
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      console.error('[Brevo] Error al enviar correo:', res.status, detalle);
      return { enviado: false, motivo: `Brevo respondió ${res.status}` };
    }

    return { enviado: true };
  } catch (error) {
    console.error('[Brevo] Error de red al enviar correo:', error);
    return { enviado: false, motivo: 'Error de red' };
  }
}
