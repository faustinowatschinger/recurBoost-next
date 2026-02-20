import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { User, PaymentIntegration } from "@/lib/db/models";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).select(
    "email companyName companyLogo senderName brandColor brandButtonColor brandButtonTextColor incentiveEnabled incentiveText smsEnabled smsThresholdAmount"
  );
  const integration = await PaymentIntegration.findOne({
    userId: session.user.id,
    status: "active",
  }).select(
    "stripeAccountId apiKeyLast4 baselineRecoveryRate baselineCalculatedAt webhookSecretEncrypted webhookEndpointId"
  );

  return NextResponse.json({
    user: user ? {
      email: user.email,
      companyName: user.companyName || "",
      companyLogo: user.companyLogo || "",
      senderName: user.senderName || "",
      brandColor: user.brandColor || "#635bff",
      brandButtonColor: user.brandButtonColor || "#635bff",
      brandButtonTextColor: user.brandButtonTextColor || "#ffffff",
      incentiveEnabled: user.incentiveEnabled || false,
      incentiveText: user.incentiveText || "",
      smsEnabled: user.smsEnabled || false,
      smsThresholdAmount: user.smsThresholdAmount || 0,
    } : null,
    stripe: integration ? {
      connected: true,
      stripeAccountId: integration.stripeAccountId,
      apiKeyLast4: integration.apiKeyLast4,
      baselineRecoveryRate: integration.baselineRecoveryRate,
      baselineCalculatedAt: integration.baselineCalculatedAt,
      webhookConfigured: !!integration.webhookSecretEncrypted,
    } : { connected: false },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const {
    companyName,
    companyLogo,
    senderName,
    brandColor,
    brandButtonColor,
    brandButtonTextColor,
    incentiveEnabled,
    incentiveText,
    smsEnabled,
    smsThresholdAmount,
  } = await request.json();

  await connectDB();

  const user = await User.findByIdAndUpdate(
    session.user.id,
    {
      companyName,
      companyLogo,
      senderName,
      brandColor,
      brandButtonColor,
      brandButtonTextColor,
      incentiveEnabled,
      incentiveText,
      smsEnabled,
      smsThresholdAmount,
    },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    companyName: user.companyName,
    companyLogo: user.companyLogo,
    senderName: user.senderName,
    brandColor: user.brandColor,
    brandButtonColor: user.brandButtonColor,
    brandButtonTextColor: user.brandButtonTextColor,
    incentiveEnabled: user.incentiveEnabled,
    incentiveText: user.incentiveText,
    smsEnabled: user.smsEnabled,
    smsThresholdAmount: user.smsThresholdAmount,
  });
}
