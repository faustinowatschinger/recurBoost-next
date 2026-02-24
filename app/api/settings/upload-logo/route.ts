import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { requireBillingAccess } from "@/lib/billing/guards";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 512 * 1024; // 512KB — logos should be small

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireBillingAccess(session.user.id);
  } catch (err) {
    if (err instanceof Error && err.message === "BILLING_ACCESS_BLOCKED") {
      return NextResponse.json(
        { error: "Account canceled. Activate a plan to continue." },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "Could not validate billing status" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("logo") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported format. Use PNG, JPG, WebP or SVG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File is too large. Max 512KB." },
      { status: 400 }
    );
  }

  // Convert to base64 data URI — works in any deployment (Vercel, Docker, etc.)
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { companyLogo: dataUri });

  return NextResponse.json({ url: dataUri });
}
