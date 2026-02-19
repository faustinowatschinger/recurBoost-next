import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { RecoveryCase } from "@/lib/db/models";
import { mockCases } from "@/lib/mock-data";

export async function GET() {
  if (process.env.MOCK_DATA === "true") {
    return NextResponse.json(mockCases);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await connectDB();

    const cases = await RecoveryCase.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(cases);
  } catch (err) {
    console.error("Error fetching cases:", err);
    return NextResponse.json(
      { error: "Error al obtener casos" },
      { status: 500 }
    );
  }
}
