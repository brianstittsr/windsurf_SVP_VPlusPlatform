import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ContactPopup } from "@/components/marketing/contact-popup";
import { OrganizationJsonLd, WebsiteJsonLd, LocalBusinessJsonLd } from "@/components/seo/json-ld";

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
      <LocalBusinessJsonLd />
      
      <Navbar />
      {/* Main content landmark with skip link target - WCAG 2.4.1 */}
      <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <ContactPopup />
    </div>
  );
}
