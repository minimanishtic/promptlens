import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackToTop from "@/components/BackToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PromptLens — Visual Prompt Intelligence",
    template: "%s | PromptLens",
  },
  description:
    "Browse 6,846 real AI-generated images from Higgsfield AI. Find the exact prompt, model, and settings that produce the results you want.",
  metadataBase: new URL("https://promptlens-two.vercel.app"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    siteName: "PromptLens",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
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
      <head>
        <link rel="preconnect" href="https://d8j0ntlcm91z4.cloudfront.net" />
        <link rel="preconnect" href="https://d2ol7oe51mr4n9.cloudfront.net" />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
