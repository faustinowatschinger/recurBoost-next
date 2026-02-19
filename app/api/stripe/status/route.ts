import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { StripeAccount } from "@/lib/db/models";
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

  const account = await StripeAccount.findOne({ userId: session.user.id });

  return NextResponse.json({
    connected: !!account,
    baselineCalculated: !!account?.baselineRecoveryRate,
    stripeAccountId: account?.stripeAccountId || null,
  });
}
