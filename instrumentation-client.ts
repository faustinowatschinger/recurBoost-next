import posthog from "posthog-js";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  isCookieConsentValue,
} from "@/lib/cookies/consent";

const savedConsent =
  typeof window !== "undefined"
    ? window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    : null;

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  // Include the defaults option as required by PostHog
  defaults: "2026-01-30",
  // Keep analytics limited to explicit events only.
  autocapture: false,
  disable_session_recording: true,
  // Analytics stays disabled until the user accepts cookie consent.
  opt_out_capturing_by_default: true,
  // Enables capturing unhandled exceptions via Error Tracking
  capture_exceptions: true,
  // Turn on debug in development mode
  debug: process.env.NODE_ENV === "development",
});

if (isCookieConsentValue(savedConsent)) {
  if (savedConsent === "accepted") {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization
// approaches, especially components like a PostHogProvider.
// instrumentation-client.ts is the correct solution for initializing client-side
// PostHog in Next.js 15.3+ apps.
