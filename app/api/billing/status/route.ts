import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  BILLING_PLAN_AMOUNT_USD,
  BILLING_TRIAL_DAYS,
} from "@/lib/billing/config";
import { getBillingAccessState } from "@/lib/billing/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const state = await getBillingAccessState(session.user.id, {
      autoExpireTrial: true,
    });

    return NextResponse.json({
      ...state,
      planAmountUsd: BILLING_PLAN_AMOUNT_USD,
      trialDays: BILLING_TRIAL_DAYS,
    });
  } catch (err) {
    console.error("Error obteniendo estado de billing:", err);
    return NextResponse.json(
      { error: "No se pudo obtener el estado de billing" },
      { status: 500 }
    );
  }
}
