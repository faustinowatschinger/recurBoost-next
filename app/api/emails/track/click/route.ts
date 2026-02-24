import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { EmailSent } from "@/lib/db/models";

function resolveSafeRedirect(target: string, request: NextRequest): URL {
  try {
    const parsed = new URL(target, request.url);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    const sameOrigin = parsed.origin === request.nextUrl.origin;

    if (!isHttp || !sameOrigin) {
      return new URL("/", request.url);
    }

    return parsed;
  } catch {
    return new URL("/", request.url);
  }
}

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

  return NextResponse.redirect(resolveSafeRedirect(redirect, request));
}
