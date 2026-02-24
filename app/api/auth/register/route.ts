import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { getPostHogClient } from "@/lib/posthog-server";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{10,}$/;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const companyName =
      typeof body.companyName === "string"
        ? body.companyName.trim().slice(0, 120)
        : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request.headers);
    const ipLimit = consumeRateLimit(`register:ip:${ip}`, {
      maxAttempts: 30,
      windowMs: 10 * 60 * 1000,
      blockMs: 30 * 60 * 1000,
    });
    const emailLimit = consumeRateLimit(`register:email:${email}`, {
      maxAttempts: 8,
      windowMs: 10 * 60 * 1000,
      blockMs: 30 * 60 * 1000,
    });

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retryAfterSeconds = Math.max(
        ipLimit.retryAfterSeconds,
        emailLimit.retryAfterSeconds
      );
      return NextResponse.json(
        {
          error: "Too many attempts. Please wait before trying again.",
          retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 10 characters and include letters and numbers",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      passwordHash,
      companyName: companyName || undefined,
    });

    const posthog = getPostHogClient();
    posthog.identify({
      distinctId: user.email,
      properties: {
        email: user.email,
        company_name: companyName,
      },
    });
    posthog.capture({
      distinctId: user.email,
      event: "user_registered_server",
      properties: { email: user.email, company_name: companyName, source: "api" },
    });

    return NextResponse.json(
      { id: user._id, email: user.email },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
