import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  OrganizationJsonLd,
  WebsiteJsonLd,
  CourseJsonLd,
} from "@/components/seo/json-ld";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* SEO: Structured Data */}
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <CourseJsonLd />

      <Navbar />
      {/* Main content landmark with skip link target - WCAG 2.4.1 */}
      <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
