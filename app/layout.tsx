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
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-white antialiased">
        <AppProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
