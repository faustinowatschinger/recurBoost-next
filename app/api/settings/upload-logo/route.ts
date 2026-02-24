import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { requireBillingAccess } from "@/lib/billing/guards";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_SIZE = 512 * 1024; // 512KB

function isPng(buffer: Buffer): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((byte, idx) => buffer[idx] === byte);
}

function isJpeg(buffer: Buffer): boolean {
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length > 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function matchesMimeSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/png") return isPng(buffer);
  if (mimeType === "image/jpeg") return isJpeg(buffer);
  if (mimeType === "image/webp") return isWebp(buffer);
  return false;
}

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

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json(
      { error: "Unsupported format. Use PNG, JPG or WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File is too large. Max 512KB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesMimeSignature(buffer, file.type)) {
    return NextResponse.json(
      { error: "Invalid file content for the declared image type." },
      { status: 400 }
    );
  }

  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { companyLogo: dataUri });

  return NextResponse.json({ url: dataUri });
}

