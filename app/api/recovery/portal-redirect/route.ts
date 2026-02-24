import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { RecoveryCase } from "@/lib/db/models";
import { verifyRecoveryToken, generateFreshPortalUrl } from "@/lib/recovery/engine";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rate = consumeRateLimit(`recovery:portal:${ip}`, {
      maxAttempts: 60,
      windowMs: 60 * 1000,
      blockMs: 5 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const { caseId, token } = await request.json();

    if (!caseId || !token) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!verifyRecoveryToken(caseId, token)) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }

    await connectDB();

    const recoveryCase = await RecoveryCase.findById(caseId);
    if (!recoveryCase) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    const url = await generateFreshPortalUrl(recoveryCase);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error in portal-redirect:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
