import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { EmailSent } from "@/lib/db/models";

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const caseId = searchParams.get("caseId");
  const step = searchParams.get("step");

  // Track the open asynchronously
  if (caseId && step) {
    try {
      await connectDB();
      await EmailSent.findOneAndUpdate(
        {
          recoveryCaseId: caseId,
          step: parseInt(step),
          opened: false,
        },
        {
          opened: true,
          openedAt: new Date(),
        }
      );
    } catch (err) {
      console.error("Error tracking open:", err);
    }
  }

  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
