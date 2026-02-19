import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculateBaseline } from "@/lib/stripe/baseline";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await calculateBaseline(session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error calculating baseline:", err);
    return NextResponse.json(
      { error: "Error al calcular el baseline" },
      { status: 500 }
    );
  }
}
