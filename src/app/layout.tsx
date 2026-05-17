import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Viral MMS - real connection and viral videos",
  description: "Discover, stream, and download high-definition web content.",
  keywords: ["HD Streaming", "4K Video", "Web Movies", "Download Videos", "Premium Cinema UI", "Viral MMS", "viralmms", "newviralmms", "realviralmms", "xhamster", "pornhub", "desimms", "bhabhi xxx", "indianmms", "milfmms", "webdesim", "desimmsxxx", "desi mms", "bhabhi mms", "hotmms", "xxx"],
  authors: [{ name: "@damxd89 on Telegram" }],
};

import AgeGate from "@/components/AgeGate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${outfit.variable} ${inter.variable} font-sans min-h-full flex flex-col bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-purple-600 selection:text-white`}
      >
        {children}
        <AgeGate />
      </body>
    </html>
  );
}
