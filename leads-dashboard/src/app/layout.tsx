import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "LEADS All-in-One Dashboard",
  description: "Private internal management system for the LEADS Next Gen Centre at MSRUAS, Bengaluru.",
  icons: {
    icon: [
      { url: "/images/leads-short-logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/images/leads-short-logo.png",
    apple: "/images/leads-short-logo.png",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Cloudflare Web Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "edc6acebaad34f76a57c25783df697fe"}'
        />
      </body>
    </html>
  );
}
