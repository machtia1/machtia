# Entrega 2A — Perfil del profesor y Mis Cursos (20 nov 2026)

## Qué incluye
1. **Mi perfil (Profesor/Facilitador):** foto, nombre público, especialidad/título principal y estudios (texto libre,
   sin subir documentos). Al guardar, aparece en **"Conoce a nuestros instructores"** (sección Cursos) y sus cursos quedan ligados a él.
2. **Mis Cursos → Crear nuevo curso:**
   - Datos: portada, título, categoría, tema, temario (opcional) y horas.
   - **Módulos:** se elige cuántos (1 a 12). Cada módulo = título + video MP4 (hasta 200 MB, subida directa a Vercel Blob,
     con barra de avance) + **0 a 4 preguntas** de opción múltiple (2 a 4 opciones, una o varias correctas marcadas).
   - **Calificación:** mínima y máxima configurables por el profesor (por defecto 70 y 100).
   - **Archivos adicionales:** opcional (PDF, Word, PowerPoint, Excel, ZIP; hasta 50 MB c/u).
   - **Publicación automática:** si tiene portada y el video de todos los módulos, al guardar se publica solo y aparece en
     Cursos (carrusel "Nuevos en Machtia" y búsqueda). Si falta algo queda como **borrador** y se le dice qué falta.
   - Editar, reordenar/quitar módulos y borrar (solo si no tiene alumnos inscritos).
3. **Administrador:** en Panel → Profesores, sección "Cursos de profesores": **Ocultar / Volver a mostrar** cualquier curso.
   Si un curso está oculto, sigue oculto aunque el profesor lo edite.

## Valores iniciales (configurables si el cliente pide otro)
Hasta 12 módulos, 4 preguntas por módulo, 2–4 opciones, video MP4 ≤ 200 MB, calificación 0–100 con mínima 70.
Constantes en `src/lib/cursosProfesor.ts`. La subida está aislada en `src/lib/subidaDirecta.ts` y
`/api/profesor/subida` para poder cambiar de proveedor de video después del 15 de diciembre.

## Base de datos (IMPORTANTE)
Migración: `prisma/migrations/20261120010000_cursos_profesor` (solo **agrega** columnas y tablas; no borra datos).
Antes de desplegar, respaldo; después: `npx prisma migrate deploy`.
Requiere `BLOB_READ_WRITE_TOKEN` en Vercel (el mismo que ya usan los comprobantes).

## Pendiente (Entrega 2B)
Evaluación por módulo del lado del alumno (usa las preguntas ya guardadas), cálculo de calificación y reintentos,
descarga de archivos adicionales, y **certificado automático** con folio y verificación (falta diseño/firmante del cliente).
