import Link from "next/link";
import type { ReactNode } from "react";

interface LegalShellProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalShell({ title, lastUpdated, children }: LegalShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Recur<span className="text-primary">Boost</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-text-muted hover:text-foreground transition-colors"
        >
          Back to home
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-text-muted">Last Updated: {lastUpdated}</p>
        <article className="mt-8 space-y-8 text-sm leading-6">{children}</article>
      </main>
    </div>
  );
}
