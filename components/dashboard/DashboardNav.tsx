"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface DashboardNavProps {
  userName: string;
}

export function DashboardNav({ userName }: DashboardNavProps) {
  return (
    <nav className="bg-card border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold text-foreground tracking-tight">
            Recur<span className="text-primary">Boost</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-text-muted hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="text-sm text-text-muted hover:text-foreground transition-colors"
          >
            Settings
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-text-muted hover:text-foreground transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
