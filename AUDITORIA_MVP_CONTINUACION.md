# Auditoria MVP - Continuacion (Hardening Pre-Beta)

Fecha: 2026-02-19
Alcance: segunda pasada tecnica enfocada en seguridad, operacion y consistencia de endpoints.

## 1) Estado rapido

- `lint`: OK
- `build`: OK
- Flujo core: operativo
- Riesgos criticos de operacion: detectados

## 2) Hallazgos nuevos importantes

## Criticos

1. Cron sin proteccion efectiva cuando `CRON_SECRET` esta vacio
- Evidencia:
  - `mi-app/app/api/cron/process-emails/route.ts:9`
  - La validacion solo corre si `cronSecret` tiene valor.
- Estado actual de entorno local: `CRON_SECRET=EMPTY`.
- Impacto: cualquiera puede invocar el endpoint y disparar procesamiento de secuencias.

2. Override global de destinatario activo
- Evidencia:
  - `mi-app/app/api/stripe/webhooks/route.ts:154`
  - Usa `process.env.TEST_OVERRIDE_EMAIL || invoice.customer_email`.
- Estado actual de entorno local: `TEST_OVERRIDE_EMAIL=SET`.
- Impacto: todos los correos podrian redirigirse a un email de prueba en lugar del cliente real.

## Altos

3. Open redirect en tracking link
- Evidencia: `mi-app/app/api/emails/track/click/route.ts:35`
- Impacto: puede usarse para phishing/redireccion maliciosa.

4. OAuth legacy con `state` no firmado
- Evidencia:
  - `mi-app/app/api/stripe/connect/route.ts:18`
  - `mi-app/app/api/stripe/callback/route.ts:26`
- Impacto: riesgo de manipulación del estado si ese flujo se usa.

## Medios

5. Middleware con validacion superficial de sesion
- Evidencia: `mi-app/middleware.ts:10`
- Impacto: acceso edge validado por cookie presente, no verificacion criptografica completa.

6. Webhook matching con complejidad lineal
- Evidencia: `mi-app/app/api/stripe/webhooks/route.ts:29`
- Impacto: latencia creciente con mas integraciones activas.

7. Baseline potencialmente truncado en `uncollectible`
- Evidencia: `mi-app/lib/stripe/baseline.ts:69`
- Impacto: posible subestimacion del total de fallidos historicos.

## 3) Matriz de endpoints (auth/seguridad)

Protegidos con `auth()`:
- `app/api/stripe/byok/connect/route.ts`
- `app/api/stripe/byok/disconnect/route.ts`
- `app/api/stripe/byok/webhook-secret/route.ts`
- `app/api/stripe/status/route.ts`
- `app/api/stripe/baseline/route.ts`
- `app/api/stripe/connect/route.ts`
- `app/api/dashboard/metrics/route.ts`
- `app/api/dashboard/cases/route.ts`
- `app/api/settings/route.ts`

Publicos por diseño:
- `app/api/stripe/webhooks/route.ts` (firma Stripe)
- `app/api/emails/track/click/route.ts` (tracking + redirect)
- `app/api/auth/register/route.ts` (alta de usuarios)
- `app/api/cron/process-emails/route.ts` (debe estar protegido por secret)
- `app/api/stripe/callback/route.ts` (OAuth callback)

## 4) Checklist de validacion pre-beta

Bloqueantes recomendados antes de beta externa:
- [ ] Definir `CRON_SECRET` robusto y exigirlo siempre
- [ ] Desactivar `TEST_OVERRIDE_EMAIL` fuera de QA
- [ ] Restringir redirecciones de click tracking a dominios permitidos
- [ ] Decidir camino unico BYOK/OAuth (y eliminar rama inconsistente)
- [ ] Completar `.env.example` con variables reales (`APP_ENCRYPTION_KEY`, `CRON_SECRET`, `TEST_OVERRIDE_EMAIL`)

Recomendados en siguiente iteracion:
- [ ] Migrar `middleware.ts` -> `proxy.ts` (Next.js 16)
- [ ] Mejorar verificacion de sesion en capa edge
- [ ] Añadir tracking de opens/bounces o remover campos no usados
- [ ] Persistir snapshots periodicos (`MetricsSnapshot`) o eliminar modelo
- [ ] Agregar tests minimos (webhook, cron, click tracking, baseline)

## 5) Veredicto actualizado

MVP funcional para pruebas controladas.
No apto para exposicion masiva sin corregir primero los bloqueantes operativos (cron y override de emails) y el hardening de redireccion de tracking.
