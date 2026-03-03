import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/gameStore";
import { AppShell } from "@/components/AppShell";
import { ToastViewport } from "@/components/ToastViewport";

export const metadata: Metadata = {
  title: "Monopoly Game Tracker",
  description: "Track Monopoly players, cash, and properties in one place"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <GameProvider>
          <AppShell>{children}</AppShell>
          <ToastViewport />
        </GameProvider>
      </body>
    </html>
  );
}
