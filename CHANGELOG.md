# Anima MKT CRM — Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added — Stage 0: Planning & Documentation (2026-08-22)
- **Documentación de arquitectura, diseño e identidad visual para Anima MKT CRM:**
  - `README.md` — Visión general, estructura y stack tecnológico.
  - `PRODUCT_SPEC.md` — Especificación de producto, roles, roadmap e identidad visual funcional (blanco cálido, rojo principal, gris carbón, verde/amarillo funcionales).
  - `ARCHITECTURE.md` — Arquitectura de capas, flujo de autenticación con verificación de email, tokens de diseño y límites de ejecución de Netlify Functions.
  - `DATA_MODEL.md` — Esquema de base de datos MongoDB (`anima_mkt_crm`) con métricas aditivas, snapshot de `metaReported.costPerActionType`, soporte multidivisa y distinción de ingresos cobrados.
  - `IMPLEMENTATION_PLAN.md` — Plan de 10 etapas ajustado: Etapa 1 integra conexión mínima a MongoDB para la colección `users`, verificación de correo y bootstrap del `super_admin`.
  - `SECURITY.md` — Políticas de autenticación y autorización, reglas de aislamiento `clientId`, protección de secretos y sanitización de audit logs.
  - `ENVIRONMENT_SETUP.md` — Guía de aprovisionamiento de Firebase, MongoDB Atlas (`anima_mkt_crm`) y nuevo proyecto en Netlify (`anima-mkt-crm`).
  - `META_AUTH_SETUP.md` — Guía de integración de Meta Marketing API con permisos de solo lectura (`ads_read` para MVP), health checks de tokens y almacenamiento exclusivo server-side.
  - `GOOGLE_INTEGRATIONS.md` — Especificación de integraciones de Google para Etapa 7.
  - `AI_ARCHITECTURE.md` — Capa de abstracción de proveedores de IA para Etapa 8.
  - `TESTING_PLAN.md` — Protocolo de 15 pruebas de aceptación manuales y de seguridad.
  - `DECISIONS.md` — 11 registros de decisiones de arquitectura (ADRs), incluyendo ADR-011 sobre Identidad Visual Operativa.
  - `AGENTS.md` — 12 reglas obligatorias para desarrollo y mantenimiento por agentes.
  - `STAGE_1_INPUTS.md` — Registro de estado de variables e insumos para la Etapa 1.
- **Configuración:**
  - `.env.example` — Plantilla con placeholders limpios `<set-in-netlify>` y versión Meta v26.0.
  - `.gitignore` — Exclusiones estrictas para dependencias, builds, secretos y archivos de cuentas de servicio.
- **Control de versiones:**
  - Repositorio Git inicializado y sincronizado con repositorio privado en GitHub.
