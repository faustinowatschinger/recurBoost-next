import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_SECONDS = 10 * 60;

export const STRIPE_OAUTH_STATE_COOKIE = "stripe_oauth_state_nonce";

interface OAuthStatePayload {
  userId: string;
  nonce: string;
  iat: number;
  exp: number;
}

interface ParsedState {
  payload: OAuthStatePayload;
  signature: string;
  rawPayload: string;
}

function getOAuthStateSecret(): string {
  const secret =
    process.env.APP_OAUTH_STATE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "APP_OAUTH_STATE_SECRET (or NEXTAUTH_SECRET/AUTH_SECRET) is required"
    );
  }

  return secret;
}

function signPayload(rawPayload: string): string {
  return createHmac("sha256", getOAuthStateSecret())
    .update(rawPayload)
    .digest("base64url");
}

function safeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function parseState(state: string): ParsedState | null {
  const [rawPayload, signature] = state.split(".");
  if (!rawPayload || !signature) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(rawPayload, "base64url").toString("utf8")
    ) as OAuthStatePayload;

    if (
      !payload ||
      typeof payload.userId !== "string" ||
      typeof payload.nonce !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    return { payload, signature, rawPayload };
  } catch {
    return null;
  }
}

export function createStripeOAuthState(userId: string): {
  state: string;
  nonce: string;
  maxAgeSeconds: number;
} {
  const nonce = randomBytes(16).toString("hex");
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + STATE_TTL_SECONDS;

  const payload: OAuthStatePayload = { userId, nonce, iat, exp };
  const rawPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(rawPayload);

  return {
    state: `${rawPayload}.${signature}`,
    nonce,
    maxAgeSeconds: STATE_TTL_SECONDS,
  };
}

export function verifyStripeOAuthState(
  state: string,
  expectedNonce: string
): OAuthStatePayload | null {
  const parsed = parseState(state);
  if (!parsed) return null;

  const expectedSignature = signPayload(parsed.rawPayload);
  if (!safeEquals(parsed.signature, expectedSignature)) {
    return null;
  }

  if (!safeEquals(parsed.payload.nonce, expectedNonce)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.payload.exp <= now) return null;
  if (parsed.payload.iat > now + 60) return null;

  return parsed.payload;
}

