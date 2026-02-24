import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

interface CronAuthResult {
  ok: boolean;
  status: number;
  error?: string;
}

function safeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

export function validateCronRequest(request: NextRequest): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET;

  // Fail closed if CRON_SECRET is missing or weak.
  if (!cronSecret || cronSecret.length < 24) {
    return {
      ok: false,
      status: 500,
      error: "CRON_SECRET is not configured securely",
    };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || !safeEquals(token, cronSecret)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true, status: 200 };
}

