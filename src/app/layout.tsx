import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

const SITE_TITLE = "Promere — The Prompt Intelligence Platform";
const SITE_DESCRIPTION =
  "Search, reverse-engineer, organize, and connect your AI prompts. The command center for AI image creators.";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | Promere",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://promere.vercel.app"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://promere.vercel.app",
    siteName: "Promere",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Promere — The prompt intelligence platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
