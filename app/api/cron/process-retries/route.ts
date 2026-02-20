import { NextResponse, type NextRequest } from "next/server";
import { processSmartRetries } from "@/lib/recovery/engine";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
