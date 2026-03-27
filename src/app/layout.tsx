import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next";

// Split into separate chunks — these are UI overlays that don't affect initial render
const AuthModal = dynamic(() => import("@/components/AuthModal"));
const BackToTop = dynamic(() => import("@/components/BackToTop"));

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
    default: "PromptLens — Stop Guessing. Start Directing.",
    template: "%s | PromptLens",
  },
  description:
    "Browse 6,800+ AI-generated images classified by style, lighting, and mood. Find the exact prompt, model, and settings that produce the results you want.",
  metadataBase: new URL("https://promptlens-two.vercel.app"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "PromptLens — Stop Guessing. Start Directing.",
    description:
      "Browse 6,800+ AI-generated images. Find the exact prompt and settings that produce the results you want.",
    url: "https://promptlens-two.vercel.app",
    siteName: "PromptLens",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PromptLens — AI Prompt Intelligence Tool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptLens — Stop Guessing. Start Directing.",
    description:
      "Browse 6,800+ AI-generated images. Find the exact prompt and settings that work.",
    images: ["/og-image.png"],
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
        <AuthProvider>
          {children}
          <AuthModal />
          <BackToTop />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
