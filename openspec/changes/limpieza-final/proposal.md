# Propuesta: Limpieza final y candados de arquitectura

> Estado: **propuesta**. Último change del roadmap.

## Intención

Cuando todos los contextos estén migrados, quitar lo que quede de la estructura vieja y convertir las convenciones en verificaciones automáticas, para que la arquitectura no se degrade de nuevo.

## ¿Cambia comportamiento observable?

No.

## Alcance

### Incluido

- **Backend:** borrar `src/controllers/`, `src/services/`, `src/routes/`, `src/middlewares/`, `src/validators/` y `src/entities/` (lo que quede, ya movido a los módulos). El `DataSource` toma las entidades solo de `src/modules/**`.
- **Frontend:**
  - Borrar `src/components/`, `src/admin/`, `src/pages/`, `src/hooks/`, `src/utils/`, `src/context/` y `src/button/` una vez vacíos.
  - Migrar a TypeScript lo que siga en `.jsx`/`.js` y apagar `allowJs`.
- **Estilos:** reemplazar las ~3.600 líneas de CSS suelto (`checkout.css`, `perfil.css`, `styleperfil.css`, etc.) y los 64 colores hex escritos a mano por los tokens de Tailwind del design system "Barrio Moderno".
- **Calidad:**
  - ESLint en 0 errores en ambas apps y **bloqueante** en el CI.
  - Umbrales de cobertura: dominio ≥ 80 %, global ≥ 50 %.
  - Las reglas de dependencias de `core-backend` siguen activas.
- **Agentes y docs:**
  - Archivar o reescribir `.claude/agents/*` y `.agents/skills/*` del plan v1 (contradicen ADR-03 y ADR-04).
  - Actualizar `CLAUDE.md`, `README.md` y `DOCUMENTACION_SISTEMA_PERMISOS.md`.
  - Decidir si `postman_tests/` se mantiene o se reemplaza por los tests de integración.
- **Repo:** `TiendasMassBack-main/` y `TiendasMassFront-main/` traen el sufijo `-main` de una descarga en zip. Evaluar renombrarlas (`backend/`, `frontend/`), actualizando los workflows y las rutas.

### Excluido

- Funcionalidad nueva.

## Dependencias

- Todos los changes anteriores.

## Decisiones abiertas

- Renombrar las carpetas de las apps: tiene costo en el historial y en las rutas de Azure, y el beneficio es solo de claridad.

## Criterios de éxito

- [ ] El árbol de `src/` de ambas apps coincide con la sección 4 del roadmap.
- [ ] El CI bloquea por lint, tipos, tests, cobertura y reglas de dependencias.
- [ ] 0 archivos `.js`/`.jsx` en `TiendasMassFront-main/src`.
