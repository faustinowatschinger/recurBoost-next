# Informe de Seguridad - RecurBoost (`mi-app`)

Fecha: 2026-02-24

## Alcance
- Revision estatica de codigo backend/frontend en `mi-app`.
- Revision de configuracion local y manejo de secretos (`.env*`).
- Revision de dependencias con `npm audit` y `npm audit --omit=dev`.

## Metodologia
- Analisis manual de rutas `app/api/**/route.ts`, `lib/**`, modelos Mongo y middleware.
- Busqueda de patrones de secreto y malas practicas con `rg`.
- Verificacion de vulnerabilidades en dependencias con auditoria de npm.

## Resumen Ejecutivo
- Hallazgos criticos: 2
- Hallazgos altos: 5
- Hallazgos medios: 2
- Hallazgos bajos: 2
- Hallazgos informativos: 1

Riesgos principales:
1. Secretos sensibles reales en archivos de entorno locales (incluyendo claves live de Stripe/Google en `.env.example`).
2. Endpoints de cron ejecutables sin autenticacion cuando `CRON_SECRET` esta vacio/no definido.
3. Flujo OAuth legacy de Stripe con validacion de `state` insuficiente y tokens guardados en texto plano.

## Hallazgos

### F-01 - [CRITICAL] Secretos reales expuestos en archivos de entorno
Evidencia:
- `.env.example:16` (`GOOGLE_CLIENT_SECRET=...`)
- `.env.example:19` (clave `rk_live_...` suelta)
- `.env.example:21` (`STRIPE_SECRET_KEY=sk_live_...`)
- `.env.example:22` (`STRIPE_PUBLISHABLE_KEY=pk_live_...`)
- `.env.example:23` (`STRIPE_WEBHOOK_SECRET=whsec_...`)
- `.env.example:25` (`STRIPE_BILLING_WEBHOOK_SECRET=whsec_...`)
- `.env.local:5` (`MONGODB_URI` con usuario/password)
- `.env.local:21` (`APP_ENCRYPTION_KEY`)
- `.env.local:24` (`RESEND_API_KEY`)

Impacto:
- Compromiso total de Stripe, DB y envio de correo si estos archivos se filtran por backup, ZIP, pantalla compartida o commit forzado.
- Aunque hoy no estan trackeados por Git (`.gitignore` incluye `.env*`), siguen siendo un riesgo operativo alto por exposicion local y comparticion accidental.

Recomendacion:
- Rotar inmediatamente todas las credenciales expuestas.
- Dejar `.env.example` solo con placeholders.
- Mover secretos a gestor de secretos del entorno de despliegue.
- Agregar escaneo de secretos en CI (gitleaks/trufflehog).

### F-02 - [CRITICAL] Endpoints cron sin auth efectiva cuando falta `CRON_SECRET`
Evidencia:
- `app/api/cron/process-billing/route.ts:6` y `:8`
- `app/api/cron/process-emails/route.ts:8` y `:10`
- `app/api/cron/process-retries/route.ts:6` y `:8`
- `.env.local:31` (`CRON_SECRET=` vacio)

Impacto:
- Cualquier actor puede disparar procesos de billing/emails/retries y causar DoS logico, spam y cambios operativos no autorizados.

Recomendacion:
- Modelo fail-closed: si `CRON_SECRET` no existe, responder `500` y no ejecutar.
- Exigir header auth siempre.
- Restringir por IP/origen del scheduler.

### F-03 - [HIGH] `state` OAuth de Stripe sin firma/nonce y callback sin auth
Evidencia:
- `app/api/stripe/connect/route.ts:18-19` (state en base64 con `userId` + `ts`)
- `app/api/stripe/callback/route.ts:27-30` (state se parsea y se confia directo)
- `app/api/stripe/callback/route.ts:7` (callback sin `auth()`)

Impacto:
- Riesgo de vinculacion incorrecta de cuenta Stripe en flujo legacy si se manipula `state`.

Recomendacion:
- Usar `state` firmado (HMAC/JWT) con expiracion corta y nonce one-time almacenado server-side.
- Validar que el callback pertenezca a sesion iniciada esperada.
- Si flujo legacy ya no se usa, deshabilitar rutas legacy.

### F-04 - [HIGH] Tokens OAuth legacy de Stripe en texto plano
Evidencia:
- `app/api/stripe/callback/route.ts:56-57` (guarda `accessToken`/`refreshToken`)
- `lib/db/models/StripeAccount.ts:19-20` (campos sin cifrado)

Impacto:
- Si hay fuga de DB, atacante obtiene acceso directo a APIs de cuentas Stripe conectadas.

Recomendacion:
- Cifrar `accessToken` y `refreshToken` con clave dedicada.
- Implementar rotacion de clave y versionado de cifrado.
- Migrar/retirar modelo `StripeAccount` si ya no aplica.

### F-05 - [HIGH] Open Redirect en tracking de clics
Evidencia:
- `app/api/emails/track/click/route.ts:9` (lee `redirect` desde query)
- `app/api/emails/track/click/route.ts:35` (redirige directo)

Impacto:
- El dominio legitimo puede ser usado para phishing/redireccion maliciosa.

Recomendacion:
- Permitir solo rutas relativas internas o lista blanca estricta de hosts.
- Rechazar esquemas no `https` y URLs absolutas no autorizadas.

### F-06 - [HIGH] Token de recovery debil (fallback conocido + sin expiracion)
Evidencia:
- `lib/recovery/engine.ts:11` (`dev-secret-key` como fallback)
- `lib/recovery/engine.ts:13-21` (token HMAC deterministico, comparacion simple)

Impacto:
- Si falta clave de entorno, token forjable por secreto conocido.
- Token reusable indefinidamente (sin TTL/nonce), facilita replay.

Recomendacion:
- Eliminar fallback fijo y fallar si no hay secreto.
- Usar secreto dedicado para recovery (no reutilizar `APP_ENCRYPTION_KEY`).
- Incluir expiracion y nonce (token firmado con timestamp).
- Usar comparacion en tiempo constante.

### F-07 - [HIGH] Riesgo de fuga de PII por `TEST_OVERRIDE_EMAIL`
Evidencia:
- `app/api/stripe/webhooks/route.ts:162` (`TEST_OVERRIDE_EMAIL` sobreescribe destino real)
- `.env.local:28` (`TEST_OVERRIDE_EMAIL=...`)

Impacto:
- Si queda activo en produccion, todos los emails de clientes pueden enviarse a una sola cuenta interna.

Recomendacion:
- Bloquear este flag en produccion (`NODE_ENV=production` => ignorar/romper startup).
- Hacerlo habilitable solo en entorno local de desarrollo.

### F-08 - [MEDIUM] Inyeccion HTML en emails y subida SVG sin sanitizar
Evidencia:
- `app/api/settings/route.ts:99` y `:103-109` (persistencia directa de input)
- `app/api/settings/upload-logo/route.ts:7` (acepta `image/svg+xml`)
- `app/api/settings/upload-logo/route.ts:55` (guarda `data:` URI)
- `lib/email/templates.ts:39-40, 52, 81, 89, 102` (insercion directa de valores en HTML)

Impacto:
- Un usuario malicioso puede insertar HTML/URLs de tracking en emails enviados por la plataforma.
- Mayor superficie para contenido engañoso o payloads SVG peligrosos en algunos clientes.

Recomendacion:
- Validar/normalizar con esquema estricto (Zod/Joi).
- Escapar siempre valores de usuario antes de interpolar HTML.
- Evitar SVG o sanitizar SVG con libreria especializada.

### F-09 - [MEDIUM] Sin rate limiting en login/registro
Evidencia:
- `app/api/auth/register/route.ts:9-30` (sin limitador por IP/email)
- `lib/auth/config.ts:22-31` (authorize credenciales sin throttling)

Impacto:
- Riesgo de brute force, credential stuffing y abuso automatizado.

Recomendacion:
- Implementar rate limit por IP + email, backoff progresivo y bloqueo temporal.
- Agregar CAPTCHA tras umbral de intentos fallidos.

### F-10 - [LOW] Middleware valida solo presencia de cookie y permite bypass en `MOCK_DATA`
Evidencia:
- `middleware.ts:9-19` (solo verifica nombre de cookie, no sesion valida)
- `middleware.ts:5` (`MOCK_DATA=true` evita proteccion)

Impacto:
- Un atacante puede sortear el gate de UI con cookie falsa (aunque APIs sensibles usan `auth()`).
- Riesgo operacional alto si `MOCK_DATA=true` llega a produccion.

Recomendacion:
- Validar sesion real en middleware o remover esta capa y depender de `auth()` server-side en layouts/rutas.
- Bloquear `MOCK_DATA=true` en produccion.

### F-11 - [LOW] Faltan headers de seguridad HTTP explicitos
Evidencia:
- `next.config.ts:4` y `:17` (solo rewrites, sin `headers()` para CSP/HSTS/XFO/etc.)

Impacto:
- Menor defensa en profundidad ante XSS/clickjacking/mixed-content.

Recomendacion:
- Definir headers de seguridad en `next.config.ts` (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options`).

### F-12 - [INFO] Dependencias: issues en dev dependencies, no issues en runtime prod
Evidencia:
- `npm audit --json`: 15 issues (14 high, 1 moderate) en cadena ESLint/TS-ESLint.
- `npm audit --omit=dev --json`: 0 vulnerabilidades en dependencias de produccion.

Impacto:
- Riesgo principal en entorno de desarrollo/CI, no en runtime de produccion actual.

Recomendacion:
- Planificar upgrade de toolchain de linting en rama dedicada.

## Controles Positivos Observados
- Verificacion de firma de webhooks Stripe en billing y recovery.
- Idempotencia de webhooks con `ProcessedEvent` (evita doble procesamiento).
- Cifrado AES-256-GCM para claves BYOK (`lib/security/crypto.ts`).
- `auth()` aplicado en la mayoria de rutas API sensibles.

## Plan de Remediacion Priorizado
1. Inmediato (hoy): rotar todas las credenciales expuestas y cerrar cron fail-closed.
2. 24-48h: corregir OAuth state legacy, bloquear `TEST_OVERRIDE_EMAIL` en prod, cerrar open redirect.
3. 7 dias: cifrar tokens legacy, fortalecer recovery token (TTL/nonce), validar/sanitizar settings/email HTML.
4. 30 dias: rate limiting global de auth y hardening de headers de seguridad.

## Notas de Alcance
- Este informe es de analisis estatico + auditoria de dependencias.
- No incluye pentest activo externo, fuzzing ni revision de infraestructura cloud.
