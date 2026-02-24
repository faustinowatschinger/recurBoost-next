"use client";

import Link from "next/link";
import { useState } from "react";
import posthog from "posthog-js";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  isCookieConsentValue,
  type CookieConsentValue,
} from "@/lib/cookies/consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return !isCookieConsentValue(saved);
  });

  function saveConsent(value: CookieConsentValue) {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);

    if (value === "accepted") {
      posthog.opt_in_capturing();
      posthog.capture("cookie_consent_updated", { consent: "accepted" });
    } else {
      posthog.opt_out_capturing();
    }

    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto rounded-xl border border-card-border bg-card shadow-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Cookie preferences</p>
            <p className="text-sm text-text-muted max-w-3xl">
              We use essential cookies for authentication and optional analytics
              cookies (PostHog) to improve the product. Email open/click tracking
              is used for recovery workflows.{" "}
              <Link href="/cookies" className="text-primary underline">
                Learn more
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => saveConsent("rejected")}
              className="px-3 py-2 text-sm border border-card-border rounded-lg hover:bg-background transition-colors"
            >
              Reject analytics
            </button>
            <button
              onClick={() => saveConsent("accepted")}
              className="px-3 py-2 text-sm font-medium bg-primary text-background rounded-lg hover:bg-primary-hover transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
