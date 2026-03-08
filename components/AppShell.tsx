"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useGame } from "@/lib/gameStore";
import { DiceRoller } from "@/components/DiceRoller";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, storageError } = useGame();

  const showGameNav =
    !!session &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/properties") ||
      pathname.startsWith("/history") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/players"));

  const navItems = [
    { href: "/dashboard", label: "Players" },
    { href: "/properties", label: "Properties" },
    { href: "/history", label: "History" },
    { href: "/settings", label: "Settings" }
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          {pathname !== "/" && (
            <button
              type="button"
              className="back-button"
              aria-label="Go back"
              onClick={() => router.back()}
            >
              ←
            </button>
          )}
          <Link href="/" className="brand brand-logo">
            <img
              src="/monopoly-tracker-logo.png"
              alt="Monopoly Tracker logo"
              className="brand-image"
              width={84}
              height={84}
            />
            <span className="brand-text-wrap">
              <span className="brand-title">Monopoly</span>
              <span className="brand-subtitle">Tracker</span>
            </span>
          </Link>
        </div>
        <div className="header-right">
          <DiceRoller />
        </div>
      </header>

      {storageError && (
        <div className="warning-banner" role="alert">
          Unable to save locally. Your changes may be lost.
        </div>
      )}

      {showGameNav && (
        <nav className="app-nav" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <main className="app-main">
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
