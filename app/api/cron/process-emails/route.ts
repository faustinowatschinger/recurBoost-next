import { NextResponse, type NextRequest } from "next/server";
import { processEmailSequences } from "@/lib/recovery/engine";

export async function POST(request: NextRequest) {
  // Simple API key auth for cron protection
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await processEmailSequences();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error processing email sequences:", err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
