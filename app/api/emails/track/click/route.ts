import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { EmailSent } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const caseId = searchParams.get("caseId");
  const step = searchParams.get("step");
  const redirect = searchParams.get("redirect");

  if (!redirect) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Track the click asynchronously
  if (caseId && step) {
    try {
      await connectDB();
      await EmailSent.findOneAndUpdate(
        {
          recoveryCaseId: caseId,
          step: parseInt(step),
          clicked: false,
        },
        {
          clicked: true,
          clickedAt: new Date(),
        }
      );
    } catch (err) {
      console.error("Error tracking click:", err);
    }
  }

  return NextResponse.redirect(redirect);
}
