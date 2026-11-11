import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Barlow_Condensed } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AccessibilityWidget } from "@/components/shared/accessibility-widget";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://strategicvalueplus.com"),
  title: {
    default: "Strategic Value+ | Supplier Readiness for OEM & Defense Manufacturing",
    template: "%s | Strategic Value+",
  },
  description:
    "Strategic Value+ helps small and mid-sized U.S. manufacturers get qualified, compliant and capacity-ready to win and keep OEM and defense work. Quality, cybersecurity, flow and export compliance, closed gate by gate.",
  keywords: [
    "supplier readiness",
    "AS9100",
    "ISO 9001",
    "CMMC",
    "NIST 800-171",
    "ITAR",
    "EAR",
    "Theory of Constraints",
    "OEM supplier qualification",
    "defense manufacturing",
    "Strategic Value+",
    "Cogniverai",
  ],
  authors: [
    { name: "Strategic Value Plus Solutions, LLC", url: "https://strategicvalueplus.com" },
  ],
  creator: "Strategic Value Plus Solutions, LLC",
  publisher: "Strategic Value Plus Solutions, LLC",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://strategicvalueplus.com",
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
    url: "https://strategicvalueplus.com",
    siteName: "Strategic Value+",
    title: "Strategic Value+ | Supplier Readiness for OEM & Defense Manufacturing",
    description:
      "We get small and mid-sized manufacturers qualified, compliant and capacity-ready to win and keep OEM and defense work.",
    images: [
      {
        url: "/VPlus_logo.jpg",
        width: 468,
        height: 427,
        alt: "Strategic Value+",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Strategic Value+ | Supplier Readiness for OEM & Defense Manufacturing",
    description:
      "We get small and mid-sized manufacturers qualified, compliant and capacity-ready to win and keep OEM and defense work.",
    images: ["/VPlus_logo.jpg"],
  },
  category: "business",
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
        className={`${plexSans.variable} ${plexMono.variable} ${barlowCondensed.variable} font-sans antialiased`}
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
