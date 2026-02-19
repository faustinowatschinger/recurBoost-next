# Plan de migracion Stripe: de Connect OAuth a BYOK (cuenta del usuario)

## Objetivo
Permitir que el producto funcione sin depender de una cuenta Stripe plataforma propia, usando la cuenta del usuario directamente (Bring Your Own Key, BYOK).

## Estado actual (resumen)
- Flujo actual: Stripe Connect OAuth Standard.
- Dependencias de plataforma:
  - `STRIPE_CLIENT_ID` en `app/api/stripe/connect/route.ts`.
  - `STRIPE_SECRET_KEY` en `lib/stripe/client.ts`.
  - `STRIPE_WEBHOOK_SECRET` global en `app/api/stripe/webhooks/route.ts`.
- Se guarda `stripeAccountId` + `accessToken` por usuario en `StripeAccount`.
- Se crean webhooks por cuenta conectada en callback OAuth.
- Baseline y portal usan Stripe SDK.

## Problemas a resolver antes/despues de migrar
1. Webhook secret global incorrecto para endpoints por cuenta.
- Hoy se crea endpoint por cuenta pero se valida firma con un solo secret global.
- Se debe guardar secret por usuario/integracion y validar contra ese secret.

2. `baselineCalculated` puede dar falso cuando el valor es `0`.
- `!!account?.baselineRecoveryRate` considera `0` como false.
- Debe validar `!== undefined` o `!= null`.

3. `state` OAuth no esta firmado.
- No esta atado criptograficamente a la sesion.
- Si se mantiene OAuth en paralelo, firmar/validar state.

4. Obtencion de decline code incompleta.
- En webhook se lee `invoice.payment_intent.last_payment_error` sin expand.
- Hay que recuperar PaymentIntent cuando venga como string.

## Arquitectura objetivo (BYOK)
El usuario conecta su cuenta Stripe aportando credenciales/configuracion propia.

### Modelo recomendado de integracion
- Una entidad por usuario: `PaymentIntegration` o ampliar `StripeAccount`.
- Campos minimos:
  - `userId`
  - `provider`: `"stripe"`
  - `mode`: `"byok"` o `"connect_oauth"`
  - `stripeAccountId`
  - `apiKeyEncrypted`
  - `apiKeyLast4`
  - `webhookSecretEncrypted`
  - `webhookEndpointId` (opcional)
  - `status` (`active`, `invalid`, `disconnected`)
  - `lastValidationAt`
  - `createdAt`, `updatedAt`

### Seguridad obligatoria
- Nunca guardar API keys ni webhook secrets en texto plano.
- Encriptar en backend con una key maestra (`APP_ENCRYPTION_KEY`).
- Desencriptar solo en runtime y solo en server.
- Redactar secretos en logs.
- Rotacion: permitir reemplazar key/secret desde settings.

## Flujos a implementar

### 1) Onboarding BYOK
1. Usuario abre onboarding.
2. Elige "Conectar Stripe con API Key".
3. Ingresa:
- Stripe Secret Key (ideal: restricted key con permisos minimos).
- Webhook secret (si webhook se crea manualmente), o autorizar creacion automatica.
4. Backend valida key:
- `stripe.accounts.retrieve()` o lectura simple permitida.
5. Backend guarda integracion encriptada.
6. Si es posible, crea endpoint webhook y guarda `webhookEndpointId` + secret.
7. Marcar integracion como activa.

### 2) Webhook
1. Endpoint recibe evento Stripe.
2. Resolver integracion correcta (por header/contexto/endpoint secret).
3. Validar firma con el secret de esa integracion.
4. Procesar `invoice.payment_failed`, `invoice.paid`, `customer.subscription.updated`.
5. Idempotencia por `event.id` + guardado de eventos procesados.

### 3) Baseline
1. Buscar integracion activa del usuario.
2. Crear cliente Stripe con su key desencriptada.
3. Importar 90 dias y calcular baseline.
4. Guardar baseline aunque sea `0`.

### 4) Recovery Engine
1. Para cada `RecoveryCase`, resolver integracion del usuario.
2. Crear portal URL con la key del usuario.
3. Mantener fallback seguro si falla portal creation.

## Cambios de codigo concretos

### A. Config y utilidades
- Crear `lib/security/crypto.ts`:
  - `encrypt(plain: string): string`
  - `decrypt(cipher: string): string`
- Nueva variable env:
  - `APP_ENCRYPTION_KEY=...` (32 bytes base64 o hex)

### B. Modelos
- Opcion 1: ampliar `lib/db/models/StripeAccount.ts`.
- Opcion 2 (preferida): nuevo `lib/db/models/PaymentIntegration.ts`.
- Agregar indices por `userId`, `provider`, `status`.

### C. Cliente Stripe por usuario
- Reemplazar `lib/stripe/client.ts` (singleton global) por:
  - `getStripeForUser(userId: string)`
  - `getStripeForIntegration(integrationId: string)`
- Mantener un cliente admin solo si todavia existe flujo Connect paralelo.

### D. API onboarding/settings
- Nuevo endpoint:
  - `app/api/stripe/byok/connect/route.ts` (POST)
- Nuevo endpoint:
  - `app/api/stripe/byok/disconnect/route.ts` (POST)
- Actualizar settings:
  - Mostrar estado BYOK.
  - Mostrar ultimos 4 caracteres de key, nunca la key completa.
  - Boton de rotar credenciales.

### E. Webhooks
- Refactor `app/api/stripe/webhooks/route.ts` para:
  - Resolver secret por integracion.
  - Verificacion robusta por firma.
  - Idempotencia por `event.id`.
  - Mejor lectura de decline code (consultar PaymentIntent si hace falta).

### F. Baseline
- Refactor `lib/stripe/baseline.ts`:
  - Cliente Stripe por usuario.
  - Guardado correcto de `baselineCalculatedAt`.
- Refactor `app/api/stripe/status/route.ts`:
  - `baselineCalculated: account?.baselineRecoveryRate != null`.

### G. Recovery
- Refactor `lib/recovery/engine.ts`:
  - Dejar de depender de `getStripe()` global.
  - Resolver cliente Stripe por `recoveryCase.userId`.

### H. UI onboarding
- Actualizar `app/onboarding/page.tsx`:
  - Opcion BYOK como flujo principal.
  - Si se mantiene Connect, dejarlo como opcion secundaria/feature flag.

## Variables de entorno

### Requeridas para BYOK
- `APP_ENCRYPTION_KEY`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `MONGODB_URI`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

### Opcionales (solo si se mantiene Connect OAuth en paralelo)
- `STRIPE_SECRET_KEY`
- `STRIPE_CLIENT_ID`
- `STRIPE_WEBHOOK_SECRET` (legacy, idealmente eliminar)

## Permisos minimos recomendados para restricted key del usuario
- Read:
  - `invoices`
  - `customers`
  - `subscriptions`
  - `payment_intents`
- Write:
  - `billing_portal.sessions`
- Webhooks:
  - Soporte para eventos `invoice.payment_failed`, `invoice.paid`, `customer.subscription.updated`

## Plan de implementacion (orden sugerido)

### Fase 0 - Preparacion
- [ ] Definir si se mantiene Connect en paralelo o se elimina.
- [ ] Agregar `APP_ENCRYPTION_KEY`.
- [ ] Crear util de encriptado.

### Fase 1 - Datos e integracion
- [ ] Crear/actualizar modelo de integracion.
- [ ] Script de migracion desde `StripeAccount` actual.
- [ ] Endpoint BYOK connect (validar y guardar key encriptada).

### Fase 2 - Runtime Stripe
- [ ] Implementar cliente Stripe por usuario.
- [ ] Refactor baseline a cliente por usuario.
- [ ] Refactor recovery engine a cliente por usuario.

### Fase 3 - Webhooks robustos
- [ ] Resolver secret por integracion.
- [ ] Implementar idempotencia por `event.id`.
- [ ] Mejorar extraction de decline code con `PaymentIntent.retrieve`.

### Fase 4 - UI y producto
- [ ] Onboarding BYOK.
- [ ] Settings para rotacion/desconexion.
- [ ] Mensajes de error claros de integracion invalida.

### Fase 5 - QA
- [ ] Tests unitarios de clasificacion y baseline.
- [ ] Tests integracion de webhook firmado.
- [ ] Test end-to-end del flujo completo.
- [ ] Pruebas manuales con Stripe test mode.

## Plan de pruebas minimo (aceptacion)
1. Usuario conecta key valida y queda `connected=true`.
2. Baseline corre y guarda `baselineCalculatedAt` aun cuando `recoveryRate=0`.
3. `invoice.payment_failed` crea un `RecoveryCase` sin duplicados.
4. Se envia email step 0 y se guarda `EmailSent`.
5. `invoice.paid` marca caso como `recovered`.
6. Click del email redirige al portal y se trackea.
7. Credenciales rotadas invalidan cliente previo y el nuevo funciona.

## Riesgos y mitigaciones
1. Riesgo: filtrado de API keys.
- Mitigacion: cifrado, redaccion de logs, acceso server-only.

2. Riesgo: webhook replay o duplicados.
- Mitigacion: idempotencia por `event.id` + firma valida + timestamp tolerance.

3. Riesgo: permisos insuficientes en restricted key.
- Mitigacion: validacion proactiva al conectar y feedback exacto al usuario.

4. Riesgo: deuda por mantener Connect + BYOK simultaneamente.
- Mitigacion: feature flag y fecha de deprecacion clara.

## Backlog recomendado (post-migracion)
- Alertas cuando falla la validacion periodica de la key.
- Dashboard de salud de integracion.
- Reintento inteligente cuando falla creacion de portal session.
- Soporte multi-cuenta Stripe por usuario (si aparece el caso).

## Decisiones pendientes
1. Mantener Connect OAuth como opcion secundaria o eliminarlo.
2. Crear webhook automatico desde app o manual por parte del usuario.
3. Usar tabla nueva `PaymentIntegration` o extender `StripeAccount`.
4. Nivel de permisos exacto de restricted key requerido en onboarding.

## Referencias
- Stripe restricted keys: https://docs.stripe.com/keys#limit-access
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe webhook endpoints API: https://docs.stripe.com/api/webhook_endpoints
- Stripe Connect OAuth (si se mantiene): https://docs.stripe.com/connect/oauth-reference
