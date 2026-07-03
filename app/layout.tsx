import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "BitLyfe — Pick a Door. Win Real Cash.",
  description: "Nigeria's skill-based quiz game. Pick a door, answer a question, win real money. Three doors, one winner.",
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
    title: "BitLyfe — Pick a Door. Win Real Cash.",
    description: "Nigeria's skill-based quiz game. Three doors, three questions — one winner takes the prize.",
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
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
