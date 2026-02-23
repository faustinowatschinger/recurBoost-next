import { NextResponse, type NextRequest } from "next/server";
import { processExpiredTrials } from "@/lib/billing/service";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
