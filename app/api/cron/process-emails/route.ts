import { NextResponse, type NextRequest } from "next/server";
import { processEmailSequences } from "@/lib/recovery/engine";
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
    const billingResult = await processExpiredTrials();
    await processEmailSequences();
    return NextResponse.json({ success: true, billing: billingResult });
  } catch (err) {
    console.error("Error processing email sequences:", err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
