# Auditoria MVP - Recuperar Ventas Fallidas

Fecha de revision: 2026-02-19
Alcance: revision completa del sistema sin cambios de codigo (solo documento)

## 1) Resumen ejecutivo

El proyecto implementa un MVP funcional de recuperacion de pagos fallidos con:
- Next.js App Router (frontend + APIs)
- NextAuth (credentials + JWT)
- MongoDB/Mongoose
- Stripe (modo principal BYOK + legado OAuth)
- Resend para emails

Estado general:
- `npm run lint`: OK (sin errores)
- `npm run build`: OK (build de produccion exitoso)
- Existen warnings de plataforma (root Turbopack y deprecacion de `middleware`)
- Flujo MVP core implementado end-to-end

## 2) Que hace el sistema

Objetivo de producto:
- Detectar `invoice.payment_failed` en Stripe
- Clasificar causa de fallo
- Crear caso de recuperacion
- Enviar secuencia de emails (dia 0/2/5) con link al Customer Portal
- Medir recuperacion vs baseline historico
- Mostrar resultados en dashboard

## 3) Como funciona (flujo end-to-end)

1. Registro/Login
- Registro via `app/api/auth/register/route.ts`
- Login via NextAuth credentials en `lib/auth/config.ts`

2. Onboarding Stripe (BYOK)
- UI en `app/onboarding/page.tsx`
- Conexion via API key en `app/api/stripe/byok/connect/route.ts`
- Guarda integracion en `PaymentIntegration` con credenciales cifradas

3. Baseline historico
- Trigger API: `app/api/stripe/baseline/route.ts`
- Calculo en `lib/stripe/baseline.ts` (90 dias)
- Guarda `baselineRecoveryRate` y `baselineCalculatedAt`

4. Webhooks Stripe
- Endpoint: `app/api/stripe/webhooks/route.ts`
- Valida firma intentando contra integraciones activas
- Procesa:
  - `invoice.payment_failed` -> crea `RecoveryCase` y dispara secuencia
  - `invoice.paid` -> marca caso como recuperado

5. Motor de recuperacion
- `lib/recovery/engine.ts`
- Genera portal URL por cliente
- Envia email step 0 inmediato
- Cron endpoint `app/api/cron/process-emails/route.ts` envia siguientes pasos

6. Tracking y dashboard
- Click tracking: `app/api/emails/track/click/route.ts`
- Metricas: `lib/utils/metrics.ts` + `app/api/dashboard/metrics/route.ts`
- Casos: `app/api/dashboard/cases/route.ts`
- UI: `app/dashboard/page.tsx`

## 4) Arquitectura y modelos

Modelos principales:
- `User`: identidad y branding email
- `PaymentIntegration`: estado Stripe BYOK, api key cifrada, webhook secret cifrado, baseline
- `RecoveryCase`: caso por invoice fallida
- `EmailSent`: tracking de envios/clicks
- `ProcessedEvent`: idempotencia de webhook (TTL 30 dias)
- `StripeAccount` (legado OAuth)
- `MetricsSnapshot` (definido pero no usado activamente)

## 5) Metricas implementadas

Definidas en `lib/utils/metrics.ts`:
- `mrrAtRisk`: suma de casos `active`
- `baselineRecoveryRate`: baseline historico guardado en integracion
- `currentRecoveryRate`: recuperadas / fallidas
- `liftIncremental`: actual - baseline
- `recoveredThisMonth`: monto recuperado en mes actual
- `avgRecoveryTime`: dias promedio hasta recuperacion

Observaciones:
- Calculo funciona para MVP
- No hay snapshots historicos persistidos aunque existe modelo `MetricsSnapshot`

## 6) Emails: templates, tipos e informacion

Tipos de secuencia (`lib/email/sequences.ts`):
- `expired_card`
- `insufficient_funds`
- `generic`

Mapeo de fallo:
- `EXPIRED_CARD` -> `expired_card`
- `INSUFFICIENT_FUNDS` -> `insufficient_funds`
- `GENERIC` -> `generic`
- `HARD_DECLINE` -> sin secuencia

Cadencia:
- Step 0: dia 0
- Step 1: dia 2
- Step 2: dia 5

Templates (`lib/email/templates.ts`):
- 9 templates (3 tipos x 3 steps)
- Datos usados en template:
  - `companyName`, `companyLogo`, `senderName`
  - `portalUrl` (con tracking)
  - `amount`, `currency`
  - `brandColor`, `brandButtonColor`, `brandButtonTextColor`

Tracking:
- Click: implementado (`clicked`, `clickedAt`)
- Open: campos existen (`opened`, `openedAt`) pero no hay endpoint/evento que los actualice

## 7) Configuracion y entorno

`.env.local` incluye variables necesarias para flujo BYOK + cron.
Diferencia relevante: `.env.example` no incluye algunas variables criticas actuales:
- `APP_ENCRYPTION_KEY`
- `TEST_OVERRIDE_EMAIL`
- `CRON_SECRET`

Impacto:
- Riesgo de onboarding incompleto en nuevos entornos por documentacion parcial

## 8) Hallazgos (errores/riesgos detectados)

### Alta prioridad

1. Open redirect en tracking de clicks
- Archivo: `mi-app/app/api/emails/track/click/route.ts:35`
- Problema: redirecciona `redirect` sin validar dominio/origen.
- Riesgo: phishing o abuso de redireccion abierta.

2. `state` OAuth legacy sin firma criptografica
- Archivos:
  - `mi-app/app/api/stripe/connect/route.ts:18`
  - `mi-app/app/api/stripe/callback/route.ts:26`
- Problema: `state` solo Base64 JSON, no firmado.
- Riesgo: tampering del flujo OAuth si se usa ese camino.

### Media prioridad

3. Middleware valida solo presencia de cookie, no sesion real
- Archivo: `mi-app/middleware.ts:4`
- Problema: chequeo superficial de token en cookie.
- Riesgo: control de acceso menos robusto en edge (aunque layouts tambien chequean `auth()`).

4. Webhook signature resolution O(N) por integraciones activas
- Archivo: `mi-app/app/api/stripe/webhooks/route.ts:29`
- Problema: intenta verificar firma contra todas las integraciones activas.
- Riesgo: escalabilidad y latencia a medida que crece la base.

5. Baseline: conteo `uncollectible` sin paginacion
- Archivo: `mi-app/lib/stripe/baseline.ts:69`
- Problema: usa una sola llamada con `limit: 100`.
- Riesgo: subestimar fallas historicas en cuentas grandes.

6. Flujo legacy OAuth y BYOK conviven con modelos distintos
- Archivos:
  - `mi-app/app/api/stripe/callback/route.ts:4`
  - `mi-app/app/api/stripe/status/route.ts:19`
- Problema: OAuth guarda en `StripeAccount`; status/dashboard dependen de `PaymentIntegration`.
- Riesgo: inconsistencia funcional si alguien usa OAuth legacy.

### Baja prioridad / deuda tecnica

7. `MetricsSnapshot` definido pero no utilizado
- Archivo: `mi-app/lib/db/models/MetricsSnapshot.ts`

8. Open/Bounce analytics no implementados
- Evidencia: solo click tracking activo, no open tracking real.

9. Warning de Next.js por deprecacion de middleware
- Build warning: migrar `middleware.ts` a `proxy.ts` segun recomendacion de Next.js 16.

10. Warning de root Turbopack por lockfiles multiples
- Build warning: configurar `turbopack.root` o limpiar lockfile extra.

## 9) Calidad tecnica actual

Fortalezas:
- Flujo principal de negocio implementado y coherente
- Cifrado de secretos con AES-256-GCM (`lib/security/crypto.ts`)
- Idempotencia de webhooks con `ProcessedEvent`
- Build/lint verdes
- UX clara para onboarding/settings/dashboard

Brechas MVP:
- Falta endurecimiento de seguridad en tracking redirect
- Falta cerrar deuda de migracion BYOK vs OAuth
- Falta observabilidad de opens/bounces
- Falta suite de tests automatizados (no se encontraron tests)

## 10) Conclusion MVP

El MVP esta funcional para validar hipotesis de recuperacion de pagos (deteccion, secuencias, tracking basico y metricas clave).

Para considerarlo "bien" en entorno real, recomiendo resolver primero:
1. Validacion segura de redirect en click tracking
2. Decision final BYOK vs OAuth (y eliminar camino inconsistente)
3. Completar `.env.example` con variables reales del sistema
4. Mejorar validacion de acceso en middleware/proxy

Con esos ajustes, la base actual queda solida para beta controlada.
