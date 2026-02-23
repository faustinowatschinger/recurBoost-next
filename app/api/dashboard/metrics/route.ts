import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculateMetrics } from "@/lib/utils/metrics";
import { mockMetrics } from "@/lib/mock-data";
import { requireBillingAccess } from "@/lib/billing/guards";

export async function GET() {
  if (process.env.MOCK_DATA === "true") {
    return NextResponse.json(mockMetrics);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await requireBillingAccess(session.user.id);
    const metrics = await calculateMetrics(session.user.id);
    return NextResponse.json(metrics);
  } catch (err) {
    if (err instanceof Error && err.message === "BILLING_ACCESS_BLOCKED") {
      return NextResponse.json(
        { error: "Cuenta cancelada. Activá un plan para continuar." },
        { status: 402 }
      );
    }

    console.error("Error calculating metrics:", err);
    return NextResponse.json(
      { error: "Error al calcular métricas" },
      { status: 500 }
    );
  }
}
