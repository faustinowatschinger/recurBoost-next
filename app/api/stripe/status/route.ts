import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { PaymentIntegration } from "@/lib/db/models";
import { mockStripeStatus } from "@/lib/mock-data";

export async function GET() {
  if (process.env.MOCK_DATA === "true") {
    return NextResponse.json(mockStripeStatus);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();

  const integration = await PaymentIntegration.findOne({
    userId: session.user.id,
    status: "active",
  });

  return NextResponse.json({
    connected: !!integration,
    // Fix: use != null so baseline of 0 is still considered "calculated"
    baselineCalculated: integration?.baselineRecoveryRate != null,
    stripeAccountId: integration?.stripeAccountId || null,
    apiKeyLast4: integration?.apiKeyLast4 || null,
    baselineRecoveryRate: integration?.baselineRecoveryRate ?? null,
    baselineCalculatedAt: integration?.baselineCalculatedAt || null,
    webhookConfigured: !!integration?.webhookSecretEncrypted,
  });
}
