import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export const metadata = {
  title: "Zenthium Data Center Partnership | Strategic Value Plus",
  description: "Submit your property for Zenthium data center evaluation. We review industrial sites, warehouses, and vacant land for data center development opportunities.",
};

export default function ZenthiumLayout({
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
