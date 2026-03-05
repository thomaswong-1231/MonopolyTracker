"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/gameStore";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, storageError } = useGame();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSpinActive, setIsSpinActive] = useState(false);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("monopoly-theme");
    const shouldUseDark = storedTheme === "dark";
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("theme-dark", shouldUseDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const handleDarkModeToggle = () => {
    setIsSpinActive(true);
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }
    spinTimeoutRef.current = setTimeout(() => setIsSpinActive(false), 650);
    setIsDarkMode((current) => {
      const next = !current;
      window.localStorage.setItem("monopoly-theme", next ? "dark" : "light");
      return next;
    });
  };

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
          <div className="darkmode-toggle-wrap">
            <button
              type="button"
              className="darkmode-toggle"
              onClick={handleDarkModeToggle}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={isDarkMode ? "Light mode" : "Dark mode"}
            >
              <span className={`top-hat-icon ${isSpinActive ? "spinning" : ""}`} aria-hidden="true">
                🎩
              </span>
            </button>
            <span className="darkmode-hover-label" aria-hidden="true">
              darkmode
            </span>
          </div>
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
