import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export const metadata = {
  title: "Zenthium Marketing 1-Pager | Strategic Value Plus",
  description: "Download the Zenthium Data Center Opportunity 1-pager PDF with QR code to share with property owners.",
};

export default function MarketingPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
