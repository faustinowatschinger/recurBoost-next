import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { requireBillingAccess } from "@/lib/billing/guards";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await requireBillingAccess(session.user.id);
  } catch (err) {
    if (err instanceof Error && err.message === "BILLING_ACCESS_BLOCKED") {
      return NextResponse.json(
        { error: "Cuenta cancelada. Activá un plan para continuar." },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo validar el estado de billing" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("logo") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usá PNG, JPG, WebP o SVG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "El archivo es muy grande. Máximo 2MB." },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = `${session.user.id}-${Date.now()}.${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "logos");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadsDir, filename);
  await writeFile(filePath, buffer);

  const logoUrl = `/uploads/logos/${filename}`;

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { companyLogo: logoUrl });

  return NextResponse.json({ url: logoUrl });
}
