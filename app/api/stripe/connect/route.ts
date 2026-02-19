import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "STRIPE_CLIENT_ID no configurado" },
      { status: 500 }
    );
  }

  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id, ts: Date.now() })
  ).toString("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/stripe/callback`,
    state,
  });

  const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(url);
}
