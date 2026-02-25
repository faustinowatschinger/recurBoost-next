"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn, useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import posthog from "posthog-js";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Google sign-in failed. Please try again.",
  OAuthCallbackError: "Google callback failed. Please try again.",
  OAuthCreateAccount: "Could not create your account with Google.",
  OAuthAccountNotLinked:
    "This email already exists with password login. Use email/password first.",
  Configuration:
    "Google login is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  AccessDenied: "Access denied.",
  Callback: "Authentication callback failed.",
  Verification: "Verification failed. Please sign in again.",
  default: "Could not sign in. Please try again.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <p className="text-[var(--foreground)]">Loading...</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const authError = searchParams.get("error");
  const authErrorMessage = authError
    ? AUTH_ERROR_MESSAGES[authError] ?? AUTH_ERROR_MESSAGES.default
    : "";
  const visibleError = error || authErrorMessage;

  useEffect(() => {
    async function loadProviders() {
      const providers = await getProviders();
      setGoogleEnabled(Boolean(providers?.google));
    }

    loadProviders().catch(() => setGoogleEnabled(false));
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const result = await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect email or password");
      posthog.capture("login_failed", { method: "credentials" });
      setLoading(false);
      return;
    }

    posthog.identify(email, { email });
    posthog.capture("user_logged_in", { method: "credentials" });
    router.push("/dashboard");
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");

    if (!googleEnabled) {
      setError(AUTH_ERROR_MESSAGES.Configuration);
      setGoogleLoading(false);
      return;
    }

    posthog.capture("user_logged_in_google", { method: "google" });
    await signIn("google", { callbackUrl: "/dashboard" });
    setGoogleLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Sign in</h1>
          <p className="mt-2 text-sm text-gray-500">Recover your failed payments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {visibleError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {visibleError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--background)] text-[var(--foreground)]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--background)] text-[var(--foreground)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[var(--background)] px-2 text-gray-500">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-2 px-4 border border-gray-300 text-[var(--foreground)] rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.8 2.2 2.6 6.4 2.6 11.6s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.1 0-.6-.1-1.2-.2-1.7H12Z"
                />
              </svg>
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>
          </>
        )}

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>

        <p className="text-center text-xs text-gray-500 leading-5">
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/cookies" className="text-blue-600 hover:underline">
            Cookies
          </Link>
        </p>
      </div>
    </div>
  );
}
