import { VPlusHeader } from "@/components/vplus/site-header";
import { VPlusFooter } from "@/components/vplus/site-footer";
import { SvpOrganizationJsonLd } from "@/components/seo/json-ld";
import "./vplus.css";

export default function VPlusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="vp-site flex min-h-screen flex-col">
      <SvpOrganizationJsonLd />
      <VPlusHeader />
      <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
        {children}
      </main>
      <VPlusFooter />
    </div>
  );
}
