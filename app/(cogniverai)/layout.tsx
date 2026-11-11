import { CogniveraiHeader } from "@/components/cogniverai/site-header";
import { CogniveraiFooter } from "@/components/cogniverai/site-footer";
import "./cogniverai.css";

export default function CogniveraiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cog-site flex min-h-screen flex-col">
      <CogniveraiHeader />
      <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
        {children}
      </main>
      <CogniveraiFooter />
    </div>
  );
}
