import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBillingPortalSession } from "@/lib/billing/service";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const url = await createBillingPortalSession(session.user.id);
    return NextResponse.json({ url });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";

    if (code === "BILLING_CUSTOMER_NOT_FOUND") {
      return NextResponse.json(
        { error: "No se encontró cliente de billing para esta cuenta." },
        { status: 404 }
      );
    }

    console.error("Error creando portal de billing:", err);
    return NextResponse.json(
      { error: "No se pudo abrir el portal de billing" },
      { status: 500 }
    );
  }
}
