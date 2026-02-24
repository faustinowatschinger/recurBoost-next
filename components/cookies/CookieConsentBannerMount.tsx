"use client";

import dynamic from "next/dynamic";

const CookieConsentBanner = dynamic(
  () =>
    import("@/components/cookies/CookieConsentBanner").then(
      (m) => m.CookieConsentBanner
    ),
  { ssr: false }
);

export function CookieConsentBannerMount() {
  return <CookieConsentBanner />;
}
