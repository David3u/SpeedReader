import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Speed Reader",
  description: "Read 4x faster with science based Optimal Recognition Point (ORP).",
  keywords: ["speed reading", "reading trainer", "wpm", "rapid serial visual presentation", "rsvp", "optimal recognition point", "orp", "optimal viewing position"],
  authors: [{ name: "David3u" }],
  openGraph: {
    title: "Speed Reader",
    description: "Read 4x faster with science based Optimal Recognition Point (ORP).",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speed Reader",
    description: "Read 4x faster with science based Optimal Recognition Point (ORP).",
  },
};

export const viewport: Viewport = {
  themeColor: "#070708",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
