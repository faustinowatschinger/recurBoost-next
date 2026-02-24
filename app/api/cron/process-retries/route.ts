import { NextResponse, type NextRequest } from "next/server";
import { processSmartRetries } from "@/lib/recovery/engine";
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
    const result = await processSmartRetries();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Error processing smart retries:", err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
