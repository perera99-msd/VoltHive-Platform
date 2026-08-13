import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext"; // <-- Import the provider
import MotionShell from "../components/MotionShell";
import AppShell from "../components/AppShell";

const sora = Sora({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoltHive",
  description: "Universal EV Charging Aggregator",
  manifest: "/manifest.webmanifest",
  applicationName: "VoltHive",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VoltHive",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: { url: "/favicon.ico", type: "image/x-icon" },
  },
};

export const viewport: Viewport = {
  themeColor: "#092034",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Wrap the children inside the AuthProvider */}
        <AuthProvider>
          <AppShell>
            <MotionShell>{children}</MotionShell>
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}