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
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
