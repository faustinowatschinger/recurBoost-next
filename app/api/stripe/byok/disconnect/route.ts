import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { PaymentIntegration } from "@/lib/db/models";
import { decrypt } from "@/lib/security/crypto";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();

  const integration = await PaymentIntegration.findOne({
    userId: session.user.id,
    status: "active",
  });

  if (!integration) {
    return NextResponse.json(
      { error: "No hay integración activa" },
      { status: 404 }
    );
  }

  // Try to delete the webhook endpoint from Stripe before disconnecting
  if (integration.webhookEndpointId) {
    try {
      const apiKey = decrypt(integration.apiKeyEncrypted);
      const stripe = new Stripe(apiKey);
      await stripe.webhookEndpoints.del(integration.webhookEndpointId);
    } catch (err) {
      // Best-effort: the key might already be invalid
      console.warn("Could not delete webhook endpoint:", err);
    }
  }

  integration.status = "disconnected";
  integration.webhookSecretEncrypted = undefined;
  integration.webhookEndpointId = undefined;
  await integration.save();

  return NextResponse.json({ success: true });
}
