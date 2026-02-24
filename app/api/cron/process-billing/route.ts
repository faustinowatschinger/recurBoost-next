import { NextResponse, type NextRequest } from "next/server";
import { processExpiredTrials } from "@/lib/billing/service";
import { validateCronRequest } from "@/lib/security/cron-auth";

export async function POST(request: NextRequest) {
  const auth = validateCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error ?? "Unauthorized" },
      { status: auth.status }
    );
  }

  try {
    const result = await processExpiredTrials();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Error procesando trials vencidos:", err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
