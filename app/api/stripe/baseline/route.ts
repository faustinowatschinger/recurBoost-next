import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculateBaseline } from "@/lib/stripe/baseline";
import { requireBillingAccess } from "@/lib/billing/guards";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingAccess(session.user.id);
    const result = await calculateBaseline(session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "BILLING_ACCESS_BLOCKED") {
      return NextResponse.json(
        { error: "Account canceled. Activate a plan to continue." },
        { status: 402 }
      );
    }

    console.error("Error calculating baseline:", err);
    return NextResponse.json(
      { error: "Error al calcular el baseline" },
      { status: 500 }
    );
  }
}
