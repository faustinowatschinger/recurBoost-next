import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { PaymentIntegration } from "@/lib/db/models";
import { encrypt } from "@/lib/security/crypto";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { webhookSecret } = await request.json();

  if (!webhookSecret || typeof webhookSecret !== "string" || !webhookSecret.startsWith("whsec_")) {
    return NextResponse.json(
      { error: "Se requiere un webhook secret válido (whsec_...)" },
      { status: 400 }
    );
  }

  await connectDB();

  const integration = await PaymentIntegration.findOneAndUpdate(
    { userId: session.user.id, status: "active" },
    { webhookSecretEncrypted: encrypt(webhookSecret) },
    { new: true }
  );

  if (!integration) {
    return NextResponse.json(
      { error: "No hay integración activa" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
