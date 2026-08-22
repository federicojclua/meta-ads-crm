# Anima MKT CRM — Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added — Stage 0: Planning & Documentation (2026-08-22)
- **Documentación de arquitectura y diseño completa para Anima MKT CRM:**
  - `README.md` — Visión general y estado del proyecto (creada y subida a GitHub, pendiente de aprobación final).
  - `PRODUCT_SPEC.md` — Especificación de producto, roles y roadmap por etapas.
  - `ARCHITECTURE.md` — Arquitectura de capas, flujo de autenticación, verificación de email, límites de Netlify Functions y diseño de API.
  - `DATA_MODEL.md` — Esquema de base de datos MongoDB (`anima_mkt_crm`) con métricas aditivas, snapshot de `metaReported.costPerActionType`, soporte multidivisa y distinción de ingresos cobrados.
  - `IMPLEMENTATION_PLAN.md` — Plan de 10 etapas ajustado: Etapa 1 integra conexión mínima a MongoDB para la colección `users` y bootstrap del `super_admin` tras verificar email.
  - `SECURITY.md` — Políticas de autenticación y autorización, reglas de aislamiento `clientId`, protección de secretos y sanitización de audit logs.
  - `ENVIRONMENT_SETUP.md` — Guía de aprovisionamiento de Firebase, MongoDB Atlas (`anima_mkt_crm`) y nuevo proyecto en Netlify (`anima-mkt-crm`).
  - `META_AUTH_SETUP.md` — Guía de integración de Meta Marketing API con permisos de solo lectura (`ads_read` para MVP), health checks de tokens y almacenamiento exclusivo server-side.
  - `GOOGLE_INTEGRATIONS.md` — Especificación de integraciones de Google para Etapa 7.
  - `AI_ARCHITECTURE.md` — Capa de abstracción de proveedores de IA para Etapa 8.
  - `TESTING_PLAN.md` — Protocolo de pruebas de aceptación manuales y de seguridad (incluyendo casos de token válido sin perfil en MongoDB, email no verificado y usuarios suspendidos).
  - `DECISIONS.md` — 10 registros de decisiones de arquitectura (ADRs).
  - `AGENTS.md` — Reglas obligatorias para desarrollo y mantenimiento por agentes.
  - `STAGE_1_INPUTS.md` — Registro de estado de variables e insumos para la Etapa 1.
- **Configuración:**
  - `.env.example` — Plantilla con placeholders limpios `<set-in-netlify>` y versión Meta v26.0.
  - `.gitignore` — Exclusiones estrictas para dependencias, builds, secretos y archivos de cuentas de servicio.
- **Control de versiones:**
  - Repositorio Git inicializado y sincronizado con repositorio privado en GitHub.
