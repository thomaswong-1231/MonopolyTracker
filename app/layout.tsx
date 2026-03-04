import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/gameStore";
import { AppShell } from "@/components/AppShell";
import { ToastViewport } from "@/components/ToastViewport";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();
const siteTitle = "Monopoly Game Tracker";
const siteDescription = "Track Monopoly players, cash, properties, rents, mortgages, and game history in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`
  },
  description: siteDescription,
  applicationName: siteTitle,
  keywords: [
    "Monopoly tracker",
    "Monopoly score tracker",
    "Monopoly net worth tracker",
    "board game money tracker",
    "Monopoly mortgage tracker"
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/monopoly-tracker-logo.png",
        width: 512,
        height: 512,
        alt: "Monopoly Tracker logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/monopoly-tracker-logo.png"]
  },
  icons: {
    icon: [{ url: "/monopoly-tracker-logo.png", type: "image/png" }],
    shortcut: ["/monopoly-tracker-logo.png"],
    apple: [{ url: "/monopoly-tracker-logo.png" }]
  }
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
