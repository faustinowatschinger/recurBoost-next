import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { User, StripeAccount } from "@/lib/db/models";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).select(
    "email companyName companyLogo senderName"
  );
  const stripeAccount = await StripeAccount.findOne({ userId: session.user.id }).select(
    "stripeAccountId baselineRecoveryRate baselineCalculatedAt"
  );

  return NextResponse.json({
    user: user ? {
      email: user.email,
      companyName: user.companyName || "",
      companyLogo: user.companyLogo || "",
      senderName: user.senderName || "",
    } : null,
    stripe: stripeAccount ? {
      connected: true,
      stripeAccountId: stripeAccount.stripeAccountId,
      baselineRecoveryRate: stripeAccount.baselineRecoveryRate,
      baselineCalculatedAt: stripeAccount.baselineCalculatedAt,
    } : { connected: false },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { companyName, companyLogo, senderName } = await request.json();

  await connectDB();

  const user = await User.findByIdAndUpdate(
    session.user.id,
    {
      companyName,
      companyLogo,
      senderName,
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
  });
}
