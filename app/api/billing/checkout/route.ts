import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBillingCheckoutSession } from "@/lib/billing/service";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await createBillingCheckoutSession(session.user.id);
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: session.user.email ?? session.user.id,
      event: "billing_checkout_started",
      properties: { user_id: session.user.id },
    });
    return NextResponse.json({ url });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";

    if (code === "PLAN_ALREADY_ACTIVE") {
      return NextResponse.json(
        { error: "Your plan is already active." },
        { status: 409 }
      );
    }

    if (code === "MINIMUM_RECOVERY_NOT_REACHED") {
      return NextResponse.json(
        { error: "Solo cobramos si recuperaste al menos $49 en el trial." },
        { status: 400 }
      );
    }

    console.error("Error creando checkout de billing:", err);
    return NextResponse.json(
      { error: "No se pudo iniciar el checkout" },
      { status: 500 }
    );
  }
}
