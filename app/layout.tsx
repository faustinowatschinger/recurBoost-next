import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://recurboost.com";

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RecurBoost — Recover More Failed Stripe Payments Than Stripe Does",
    template: "%s | RecurBoost",
  },
  description:
    "Recover more failed Stripe payments than Stripe does. Increase your real MRR automatically. Smart recovery sequences for SaaS doing $10K–$50K MRR. 30-day free trial.",
  keywords: [
    "Stripe failed payments",
    "recover failed payments",
    "SaaS revenue recovery",
    "MRR recovery",
    "Stripe payment recovery",
    "dunning management",
    "subscription recovery",
    "churn reduction",
    "involuntary churn",
    "failed payment recovery",
    "Stripe integration",
    "SaaS metrics",
    "recurring revenue",
  ],
  authors: [{ name: "RecurBoost" }],
  creator: "RecurBoost",
  publisher: "RecurBoost",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "RecurBoost",
    title: "RecurBoost — Recover More Failed Stripe Payments Than Stripe Does",
    description:
      "Increase your real MRR automatically. Smart recovery sequences for SaaS. 30-day free trial, no credit card required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RecurBoost — Revenue recovery for SaaS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RecurBoost — Recover More Failed Stripe Payments",
    description:
      "Increase your real MRR automatically. Smart recovery sequences for SaaS doing $10K–$50K MRR.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
