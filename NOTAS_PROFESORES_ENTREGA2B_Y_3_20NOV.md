# Entrega 2B (evaluación y certificado) y Entrega 3 (datos bancarios) — 20 nov 2026

## Entrega 2B — Evaluación por módulo, calificación, certificado y archivos

**Reglas (configuración inicial, ajustable):**
- Cada módulo puede tener hasta 4 preguntas de opción múltiple (2 a 4 opciones; una o varias correctas). Las capturó el profesor en la 2A.
- Una pregunta cuenta solo si el alumno marca EXACTAMENTE las respuestas correctas.
- Nota del módulo: de 0 a la calificación máxima del curso (por defecto 100). Reintentos permitidos; se conserva la mejor nota de cada módulo.
- Calificación del curso: promedio de los módulos que tienen examen. Se aprueba con la calificación mínima del curso (por defecto 70; la define el profesor).
- El alumno debe marcar el módulo como completado antes de presentar su examen.
- Al terminar todos los módulos y presentar todos los exámenes, con promedio aprobatorio, el certificado se emite solo (una vez por alumno y curso).
- Cursos sin preguntas por módulo (los anteriores) siguen igual: evaluación general y sin certificado.
- Las respuestas correctas nunca salen del servidor; la calificación se hace en el servidor.
- Archivos adicionales: los ven y descargan solo los alumnos inscritos, y únicamente si el profesor activó esa opción.

**Certificado:** folio único tipo `MACH-2026-AB3K-9XZ4`; página pública `https://www.machtiaeducacion.com/certificado/<folio>` (sirve como verificación) con botón "Descargar / imprimir (PDF)". Guarda copia de nombre, curso, instructor, horas y calificación. Diseño sencillo (logo, datos, folio); el diseño final y la firma están pendientes del cliente.

**Archivos nuevos/modificados:** `src/lib/evaluacionModulos.ts`; `api/cursos/[id]/modulos/[leccionId]/evaluacion` (GET/POST), `api/cursos/[id]/certificado`; modificados `api/cursos/[id]` (examenes, archivos), `.../lecciones/[leccionId]/completar` (revisa cierre), `.../evaluacion` (rechaza evaluación general si el curso tiene exámenes por módulo); `app/certificado/[folio]/page.tsx`; `components/cursos/DetalleCurso.tsx`, `BotonImprimir.tsx`.
**Migración:** `20261120020000_evaluacion_certificado` (tablas ResultadoModulo y Certificado; no toca datos existentes).

## Entrega 3 — Datos bancarios (todos los usuarios, incluido el administrador)

- Cuenta bancaria: México (CLABE de 18 dígitos con validación del dígito verificador + banco por catálogo, que se autoselecciona según la CLABE + beneficiario) u otro país (cuenta/IBAN + banco + país + beneficiario + datos adicionales opcionales).
- Wallet: moneda USDC o USDT, red (ERC-20, TRC-20, BEP-20, Polygon, Solana, Arbitrum, Optimism, Avalanche C-Chain, Base), dirección validada según la red y datos adicionales (memo/tag).
- Se puede llenar banco, wallet o ambos.
- Todo se guarda CIFRADO (AES-256-GCM) en la columna `datosCifrados`. Solo el Administrador ve los datos completos (pantalla "Datos bancarios" del panel de administración, con descarga CSV). El dueño ve su información enmascarada (•••• 1234) y puede editarla; si deja la cuenta/dirección vacía al editar se conserva la anterior.
- Cada consulta del administrador queda registrada en los logs del servidor.
- Los respaldos (`exportar-base-completa`) incluyen la tabla, pero los datos salen cifrados.

**REQUISITO ANTES DE USAR:** crear en Vercel la variable de entorno `DATOS_BANCARIOS_KEY` (Production, Preview y Development) y volver a desplegar. Generar la llave con:
`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
GUARDAR LA LLAVE EN UN LUGAR SEGURO FUERA DE VERCEL: si se pierde, los datos cifrados no se pueden recuperar. Mientras no exista la variable, la pantalla responde "función no disponible" y NO guarda nada.

**Archivos:** `src/lib/cifrado.ts`, `datosBancarios.ts`, `datosBancariosServidor.ts`; `api/datos-bancarios`, `api/admin/datos-bancarios` (+ `[usuarioId]`, `exportar`); `components/DatosBancarios.tsx`, `AdminDatosBancarios.tsx`; páginas `home/mi-oficina/datos-bancarios`, `home/datos-bancarios`; enlaces en `Dashboard.tsx`, `AdminTabs.tsx`, `PanelProfesor.tsx`.
**Migración:** `20261120030000_datos_bancarios`.
**Catálogo de bancos de México:** conviene que el cliente confirme si falta alguno (existe la opción "Otro banco").
