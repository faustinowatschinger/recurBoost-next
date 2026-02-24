import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { RecoveryCase } from "@/lib/db/models";
import { mockCases } from "@/lib/mock-data";
import { requireBillingAccess } from "@/lib/billing/guards";
import { isMockModeEnabled } from "@/lib/security/runtime";

export async function GET() {
  if (isMockModeEnabled) {
    return NextResponse.json(mockCases);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingAccess(session.user.id);
    await connectDB();

    const cases = await RecoveryCase.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(cases);
  } catch (err) {
    if (err instanceof Error && err.message === "BILLING_ACCESS_BLOCKED") {
      return NextResponse.json(
        { error: "Account canceled. Activate a plan to continue." },
        { status: 402 }
      );
    }

    console.error("Error fetching cases:", err);
    return NextResponse.json(
      { error: "Error al obtener casos" },
      { status: 500 }
    );
  }
}
