import type { Metadata } from "next";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-space-theme text-theme-text-primary relative overflow-x-hidden selection:bg-accent selection:text-white">
        {/* Background Centered Logo Watermark */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden select-none">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px] opacity-[0.14] transition-opacity duration-500">
            <img
              src="/images/leads-short-logo.png"
              alt="LEADS Centered Background Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_60px_rgba(59,130,246,0.6)]"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 min-h-screen flex flex-col flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
