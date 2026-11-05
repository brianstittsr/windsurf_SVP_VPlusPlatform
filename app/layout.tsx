import type { Metadata } from "next";
import { Manrope, DM_Sans, Barlow_Condensed } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AccessibilityWidget } from "@/components/shared/accessibility-widget";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://academy.efvertical.com"),
  title: {
    default: "EFVS UAS Training Academy | FAA Part 107 Training",
    template: "%s | EFVS Academy",
  },
  description:
    "The EFVS UAS Training Academy delivers FAA Part 107 Remote Pilot certification preparation and specialized UAS training for aspiring pilots, veterans, public agencies, and organizations.",
  keywords: [
    "FAA Part 107",
    "remote pilot certificate",
    "UAS training",
    "drone pilot training",
    "Part 107 test prep",
    "uncrewed aircraft systems",
    "advanced air mobility",
    "UAS training academy",
    "Eagle Flight Vertical Solutions",
    "EFVS",
  ],
  authors: [
    { name: "Eagle Flight Vertical Solutions", url: "https://www.efvertical.com" },
  ],
  creator: "Eagle Flight Vertical Solutions",
  publisher: "Aviante HWC, Inc. dba Eagle Flight Vertical Solutions",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://academy.efvertical.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://academy.efvertical.com",
    siteName: "EFVS UAS Training Academy",
    title: "EFVS UAS Training Academy | FAA Part 107 Training",
    description:
      "FAA Part 107 Remote Pilot certification preparation and specialized UAS training from Eagle Flight Vertical Solutions.",
    images: [
      {
        url: "/images/hero.jpg",
        width: 1672,
        height: 941,
        alt: "EFVS UAS Training Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EFVS UAS Training Academy | FAA Part 107 Training",
    description:
      "FAA Part 107 Remote Pilot certification preparation and specialized UAS training from Eagle Flight Vertical Solutions.",
    images: ["/images/hero.jpg"],
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Skip to main content link for keyboard users - WCAG 2.4.1 */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${manrope.variable} ${dmSans.variable} ${barlowCondensed.variable} font-sans antialiased`}
      >
        {/* Skip to main content link - WCAG 2.4.1 Bypass Blocks */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        {children}
        <Toaster />
        {/* UserWay Accessibility Widget */}
        <AccessibilityWidget />
      </body>
    </html>
  );
}
