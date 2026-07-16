import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreInitializer } from "@/components/StoreInitializer";
import { Nav } from "@/components/ui/Nav";
import { CursorFollower } from "@/components/ui/CursorFollower";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Xeebrand — Premium Brand Agency",
  description:
    "We take your brand apart and rebuild it stronger. Premium 3D-animated brand transformation for companies that refuse to be ordinary.",
  openGraph: {
    title: "Xeebrand — Premium Brand Agency",
    description: "We take your brand apart and rebuild it stronger.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Clash Display — display typeface, not available on Google Fonts */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700,800&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--surface-0)] text-[var(--text-primary)]">
        <StoreInitializer />
        <CursorFollower />
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <Nav />
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
