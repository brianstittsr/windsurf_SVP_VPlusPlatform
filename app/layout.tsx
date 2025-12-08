import type { Metadata } from "next";
import { Manrope, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AccessibilityWidget } from "@/components/shared/accessibility-widget";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://strategicvalueplus.com"),
  title: {
    default: "Strategic Value+ | Transforming U.S. Manufacturing",
    template: "%s | Strategic Value+",
  },
  description:
    "We help small- and mid-sized U.S. manufacturers win OEM contracts through supplier qualification, ISO certification, and operational readiness.",
  keywords: [
    "manufacturing consulting",
    "OEM supplier qualification",
    "ISO certification",
    "IATF 16949",
    "Industry 4.0",
    "lean manufacturing",
    "digital transformation",
    "reshoring",
    "supply chain optimization",
    "digital twins",
    "AI manufacturing",
    "Toyota supplier",
    "automotive supplier qualification",
  ],
  authors: [{ name: "Strategic Value+ Solutions", url: "https://strategicvalueplus.com" }],
  creator: "Strategic Value+ Solutions",
  publisher: "Strategic Value+ Solutions",
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
    title: "Strategic Value+ | Transforming U.S. Manufacturing",
    description:
      "We help small- and mid-sized U.S. manufacturers win OEM contracts through supplier qualification, ISO certification, and operational readiness.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Strategic Value+ - Transforming U.S. Manufacturing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Strategic Value+ | Transforming U.S. Manufacturing",
    description:
      "We help small- and mid-sized U.S. manufacturers win OEM contracts through supplier qualification, ISO certification, and operational readiness.",
    images: ["/og-image.png"],
    creator: "@strategicvalueplus",
  },
  verification: {
    google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
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
      <body className={`${manrope.variable} ${dmSans.variable} font-sans antialiased`}>
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
