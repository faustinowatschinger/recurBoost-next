import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { User, PaymentIntegration } from "@/lib/db/models";
import { requireBillingAccess } from "@/lib/billing/guards";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const DATA_LOGO_REGEX = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i;

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function sanitizeMultilineText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeColor(
  value: unknown,
  fallback: string
): { valid: boolean; value: string } {
  if (value == null || value === "") return { valid: true, value: fallback };
  if (typeof value !== "string") return { valid: false, value: fallback };

  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) return { valid: false, value: fallback };

  return { valid: true, value: trimmed.toLowerCase() };
}

function normalizeCompanyLogo(value: unknown): string | null {
  if (value == null || value === "") return "";
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed.length > 800_000) return null;
  if (!DATA_LOGO_REGEX.test(trimmed)) return null;

  return trimmed;
}

function normalizeThresholdAmount(value: unknown): number {
  if (value == null || value === "") return 0;
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1_000_000, Math.round(num * 100) / 100));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingAccess(session.user.id);
  } catch (err) {
    if (err instanceof Error && err.message === "BILLING_ACCESS_BLOCKED") {
      return NextResponse.json(
        { error: "Account canceled. Activate a plan to continue." },
        { status: 402 }
      );
    }
    console.error("Error validando billing (GET settings):", err);
    return NextResponse.json(
      { error: "Could not validate billing status" },
      { status: 500 }
    );
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
  const safeCompanyLogo = user ? normalizeCompanyLogo(user.companyLogo) : "";

  return NextResponse.json({
    user: user
      ? {
          email: user.email,
          companyName: user.companyName || "",
          companyLogo: safeCompanyLogo || "",
          senderName: user.senderName || "",
          brandColor: user.brandColor || "#635bff",
          brandButtonColor: user.brandButtonColor || "#635bff",
          brandButtonTextColor: user.brandButtonTextColor || "#ffffff",
          incentiveEnabled: user.incentiveEnabled || false,
          incentiveText: user.incentiveText || "",
          smsEnabled: user.smsEnabled || false,
          smsThresholdAmount: user.smsThresholdAmount || 0,
        }
      : null,
    stripe: integration
      ? {
          connected: true,
          stripeAccountId: integration.stripeAccountId,
          apiKeyLast4: integration.apiKeyLast4,
          baselineRecoveryRate: integration.baselineRecoveryRate,
          baselineCalculatedAt: integration.baselineCalculatedAt,
          webhookConfigured: !!integration.webhookSecretEncrypted,
        }
      : { connected: false },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingAccess(session.user.id);
  } catch (err) {
    if (err instanceof Error && err.message === "BILLING_ACCESS_BLOCKED") {
      return NextResponse.json(
        { error: "Account canceled. Activate a plan to continue." },
        { status: 402 }
      );
    }
    console.error("Error validando billing (PUT settings):", err);
    return NextResponse.json(
      { error: "Could not validate billing status" },
      { status: 500 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const companyName = sanitizeText(payload.companyName, 120);
  const senderName = sanitizeText(payload.senderName, 120);
  const companyLogo = normalizeCompanyLogo(payload.companyLogo);
  const incentiveText = sanitizeMultilineText(payload.incentiveText, 280);

  if (companyLogo === null) {
    return NextResponse.json(
      { error: "Invalid company logo format" },
      { status: 400 }
    );
  }

  const brandColor = normalizeColor(payload.brandColor, "#635bff");
  const brandButtonColor = normalizeColor(payload.brandButtonColor, "#635bff");
  const brandButtonTextColor = normalizeColor(
    payload.brandButtonTextColor,
    "#ffffff"
  );

  if (!brandColor.valid || !brandButtonColor.valid || !brandButtonTextColor.valid) {
    return NextResponse.json({ error: "Invalid color format" }, { status: 400 });
  }

  const incentiveEnabled = payload.incentiveEnabled === true;
  const smsEnabled = payload.smsEnabled === true;
  const smsThresholdAmount = normalizeThresholdAmount(payload.smsThresholdAmount);

  await connectDB();

  const user = await User.findByIdAndUpdate(
    session.user.id,
    {
      companyName,
      companyLogo,
      senderName,
      brandColor: brandColor.value,
      brandButtonColor: brandButtonColor.value,
      brandButtonTextColor: brandButtonTextColor.value,
      incentiveEnabled,
      incentiveText,
      smsEnabled,
      smsThresholdAmount,
    },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
