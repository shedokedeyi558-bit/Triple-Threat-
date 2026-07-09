import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = {
  title: "BitLyfe — Play Smart. Win Real.",
  description: "BitLyfe: Play smart, win real. Pick a pill or predict the future and earn real money.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BitLyfe",
  },
  openGraph: {
    title: "BitLyfe — Play Smart. Win Real.",
    description: "BitLyfe: Play smart, win real. Pick a pill or predict the future and earn real money.",
    type: "website",
    siteName: "BitLyfe",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B0E14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-white antialiased" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
        <AppProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
