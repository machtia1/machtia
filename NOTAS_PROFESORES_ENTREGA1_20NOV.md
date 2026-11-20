# Entrega 1 — Cuentas restringidas y Profesor/Facilitador (20 nov 2026)

## Qué incluye
1. **Espacios restringidos: solo 3 tipos** — Socio Fundador, Asociado y Administrativo/Operativo
   (internamente sigue siendo el rol `ASISTENTE_ADMINISTRATIVO`; solo cambió el nombre que se ve).
   Se quitó "Profesor Facilitador" del registro restringido (API y formulario) y de los filtros de Mis Referidos.
2. **Espacios de Profesor/Facilitador** (máximo 400, se crean conforme se necesitan)
   - Panel de Administrador → pestaña **Profesores** (`/home/profesores`): contador "X de 400",
     botón **Crear nuevo espacio**, enlace de cada espacio con **Copiar enlace**, y **Eliminar** si nadie lo ha usado.
   - Cada enlace: `/invitacion-profesor/<token>` (página sencilla, sin videos ni contador).
   - Registro simple: nombre + correo → correo con enlace → completa sus datos y contraseña
     (**sin suscripción y sin comprobante de pago**). Queda "pendiente" y el administrador solo lo **autoriza**
     en *Aprobar registros*. Al rechazarlo, el espacio vuelve a quedar disponible con el mismo enlace.
   - Un enlace solo sirve para **un** profesor.
   - El profesor **no entra a la Red**, no tiene invitador ni regalías, no paga membresía.
     No aparece en la Búsqueda de Usuarios de Mis Referidos.
3. **Panel del Profesor**: solo *Mis Ganancias*, *Mis Cursos* y *Mi perfil* (nada de Red, invitaciones ni regalías).
   - **Mis Ganancias**: total de usuarios activos de la plataforma (sin espacios restringidos, sin profesores,
     sin administrador) y ganancia acumulada = **$0.00**; empieza a acumular el **15 dic 2026**.
   - *Mis Cursos* y *Mi perfil* quedan como base; se completan en la Entrega 2.

## Configurable sin tocar código
- `PROFESOR_PORCENTAJE_GANANCIAS` (variable de entorno en Vercel): porcentaje de ganancia del profesor.
  Hoy no está definido (0). La fórmula del acumulado se activará cuando el cliente la confirme.
- Máximo de espacios y fecha de inicio: `src/lib/profesores.ts`.

## Base de datos (IMPORTANTE)
Migración nueva: `prisma/migrations/20261120000000_espacios_profesor` (solo **agrega** una tabla y una columna;
no modifica ni borra datos). Antes de desplegar, hacer respaldo en Aiven.
Después del despliegue: `npx prisma migrate deploy`.

### Convertir profesores que ya estén en espacios restringidos a Asociado
```
node prisma/convertir-profesores-restringidos-a-asociado.mjs            # solo muestra qué cambiaría
node prisma/convertir-profesores-restringidos-a-asociado.mjs --aplicar  # aplica
```
Solo toca usuarios que ocupan un espacio restringido; los profesores nuevos no se tocan.

## Archivos principales
- `prisma/schema.prisma` (modelo `EspacioProfesor`, `Preregistro.espacioProfesorId`)
- `src/lib/profesores.ts`
- API: `api/admin/profesores`, `api/admin/profesores/eliminar`, `api/profesor/ganancias`;
  modificados `api/preregistro`, `api/preregistro/[token]`, `api/registro`, `api/admin/aprobar`, `api/admin/rechazar`, `api/usuarios/buscar`
- UI: `components/AdminProfesores.tsx`, `InvitacionProfesor.tsx`, `PanelProfesor.tsx`; modificados
  `RegistroCompleto`, `Dashboard`, `AdminTabs`, `MisReferidos`, `PanelAprobaciones`, `AdminRedGeneral`
- Páginas: `app/home/profesores`, `app/invitacion-profesor/[token]`

## Pendiente (no incluido aquí)
Entrega 2: perfil público del profesor + carrusel de instructores, Mis Cursos (módulos, videos, preguntas,
calificación, archivos, certificado). Entrega 3: datos bancarios.
