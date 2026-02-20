import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { RecoveryCase } from "@/lib/db/models";
import { verifyRecoveryToken, generateFreshPortalUrl } from "@/lib/recovery/engine";

export async function POST(request: NextRequest) {
  try {
    const { caseId, token } = await request.json();

    if (!caseId || !token) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!verifyRecoveryToken(caseId, token)) {
      return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 403 });
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
